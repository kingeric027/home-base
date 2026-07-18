import bcrypt from "bcryptjs";
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "./client";
import { emailKey, userProfileKey } from "./keys";

const SALT_ROUNDS = 10;

export type User = {
  userId: string;
  email: string;
  name?: string;
  homeCount: number;
  createdAt: string;
};

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email is already registered");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const createdAt = new Date().toISOString();

  const user: User = { userId, email, name, homeCount: 0, createdAt };

  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: TABLE_NAME,
              Item: { ...emailKey(email), entityType: "EMAIL_LOCK", userId },
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          {
            Put: {
              TableName: TABLE_NAME,
              Item: {
                ...userProfileKey(userId),
                entityType: "USER",
                ...user,
                passwordHash,
              },
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
      throw new EmailAlreadyRegisteredError();
    }
    throw err;
  }

  return user;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const emailLock = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: emailKey(email) })
  );
  const userId = emailLock.Item?.userId as string | undefined;
  if (!userId) return null;

  const profile = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: userProfileKey(userId) })
  );
  if (!profile.Item) return null;

  const passwordMatches = await bcrypt.compare(
    password,
    profile.Item.passwordHash as string
  );
  if (!passwordMatches) return null;

  return {
    userId: profile.Item.userId,
    email: profile.Item.email,
    name: profile.Item.name,
    homeCount: profile.Item.homeCount,
    createdAt: profile.Item.createdAt,
  };
}
