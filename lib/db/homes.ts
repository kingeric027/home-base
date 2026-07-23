import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "./client";
import { homeKey, userProfileKey } from "./keys";

export const MAX_HOMES_PER_USER = 5;

// The home data fields shared by the /api/places/details response and the
// edit form — no homeId/userId/createdAt/updatedAt, since those don't exist
// until the home is actually created.
export type HomeInput = {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  squareFootage?: number;
  yearBuilt?: number;
  totalAssessedValue?: number;
  assessedYear?: number;
  taxValue?: number;
  taxYear?: number;
  acres?: number;
  totalBathrooms?: number;
  totalBedrooms?: number;
  salePriceLastTransfer?: number;
  ownershipStartDate?: string;
};

// A persisted home record — always has the system-managed fields once read
// from the database.
export type Home = HomeInput & {
  homeId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export class HomeLimitReachedError extends Error {
  constructor() {
    super(`You can only have up to ${MAX_HOMES_PER_USER} homes`);
    this.name = "HomeLimitReachedError";
  }
}

export class HomeNotFoundError extends Error {
  constructor() {
    super("Home not found");
    this.name = "HomeNotFoundError";
  }
}

export async function createHome(
  userId: string,
  input: HomeInput
): Promise<Home> {
  const homeId = crypto.randomUUID();
  const now = new Date().toISOString();
  const home: Home = {
    ...input,
    homeId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: TABLE_NAME,
              Key: userProfileKey(userId),
              UpdateExpression:
                "SET homeCount = if_not_exists(homeCount, :zero) + :incr",
              ConditionExpression:
                "attribute_not_exists(homeCount) OR homeCount < :max",
              ExpressionAttributeValues: {
                ":incr": 1,
                ":zero": 0,
                ":max": MAX_HOMES_PER_USER,
              },
            },
          },
          {
            Put: {
              TableName: TABLE_NAME,
              Item: { ...homeKey(userId, homeId), entityType: "HOME", ...home },
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
        ],
      })
    );
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "TransactionCanceledException"
    ) {
      throw new HomeLimitReachedError();
    }
    throw err;
  }

  return home;
}

export async function listHomes(userId: string): Promise<Home[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":skPrefix": "HOME#",
      },
    })
  );
  return (result.Items ?? []) as Home[];
}

export async function getHome(
  userId: string,
  homeId: string
): Promise<Home | null> {
  const result = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: homeKey(userId, homeId) })
  );
  return (result.Item as Home) ?? null;
}

export async function updateHome(
  userId: string,
  homeId: string,
  input: Partial<HomeInput>
): Promise<void> {
  const updates = { ...input, updatedAt: new Date().toISOString() };
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);

  const setClauses = entries.map((_, i) => `#f${i} = :v${i}`);
  const names = Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key]));
  const values = Object.fromEntries(
    entries.map(([, value], i) => [`:v${i}`, value])
  );

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: homeKey(userId, homeId),
        UpdateExpression: `SET ${setClauses.join(", ")}`,
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "ConditionalCheckFailedException"
    ) {
      throw new HomeNotFoundError();
    }
    throw err;
  }
}

export async function deleteHome(userId: string, homeId: string): Promise<void> {
  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: TABLE_NAME,
              Key: homeKey(userId, homeId),
              ConditionExpression: "attribute_exists(PK)",
            },
          },
          {
            Update: {
              TableName: TABLE_NAME,
              Key: userProfileKey(userId),
              UpdateExpression: "SET homeCount = homeCount - :one",
              ConditionExpression: "homeCount > :zero",
              ExpressionAttributeValues: { ":one": 1, ":zero": 0 },
            },
          },
        ],
      })
    );
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "TransactionCanceledException"
    ) {
      throw new HomeNotFoundError();
    }
    throw err;
  }

  await deleteHomeChildren(homeId);
}

async function deleteHomeChildren(homeId: string): Promise<void> {
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `HOME#${homeId}` },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const items = result.Items ?? [];
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      await ddb.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: batch.map((item) => ({
              DeleteRequest: { Key: { PK: item.PK, SK: item.SK } },
            })),
          },
        })
      );
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
}
