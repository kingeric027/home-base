import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN!,
  }),
});

export const ddb = DynamoDBDocumentClient.from(ddbClient);
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
