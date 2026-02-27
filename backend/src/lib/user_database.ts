import * as AWS from 'aws-sdk';
import { Config } from '../utils/config';
import { Logger } from '../utils/logger';

const dynamo = new AWS.DynamoDB.DocumentClient();

export interface UserRecord {
    userId: string;
    email: string;
    role: 'Admin' | 'Member';
    name?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export class UserRepository {
    static async create(user: UserRecord): Promise<void> {
        Logger.info(`Creating user record: ${user.email}`);
        await dynamo.put({
            TableName: process.env.USERS_TABLE || `${Config.PROJECT_NAME}-users`,
            Item: user
        }).promise();
    }

    static async getById(userId: string): Promise<UserRecord | null> {
        const result = await dynamo.get({
            TableName: process.env.USERS_TABLE || `${Config.PROJECT_NAME}-users`,
            Key: { userId }
        }).promise();
        return (result.Item as UserRecord) || null;
    }

    static async getByEmail(email: string): Promise<UserRecord | null> {
        const result = await dynamo.query({
            TableName: process.env.USERS_TABLE || `${Config.PROJECT_NAME}-users`,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        }).promise();
        return (result.Items?.[0] as UserRecord) || null;
    }
}
