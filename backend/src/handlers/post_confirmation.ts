import { PostConfirmationConfirmSignUpTriggerEvent } from 'aws-lambda';
import { UserRepository, UserRecord } from '../lib/user_database';
import { Config } from '../utils/config';
import { Logger } from '../utils/logger';
import * as AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler = async (event: any): Promise<any> => {
    Logger.info('PostConfirmation event received', { trigger: event.triggerSource });

    // Only process confirm signup
    if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
        return event;
    }

    const { userAttributes } = event.request;
    const userId = userAttributes.sub;
    const email = userAttributes.email;
    const name = userAttributes.name || userAttributes.email;

    try {
        const existing = await UserRepository.getById(userId);
        if (existing) {
            Logger.info('User already exists in database', { userId });
            return event;
        }

        const newUser: UserRecord = {
            userId,
            email,
            name,
            role: Config.COGNITO.MEMBER_GROUP as any,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await UserRepository.create(newUser);
        Logger.info('User record mirrored to DynamoDB', { userId, email });

        // Automatically add to Members group in Cognito
        await cognito.adminAddUserToGroup({
            UserPoolId: event.userPoolId,
            Username: event.userName,
            GroupName: Config.COGNITO.MEMBER_GROUP
        }).promise();

        Logger.info(`User added to ${Config.COGNITO.MEMBER_GROUP} group in Cognito`, { userName: event.userName });

        return event;
    } catch (err) {
        Logger.error('Failed to process post-confirmation', err);
        // We return event anyway to not block the user login, but we've logged the error
        return event;
    }
};
