import { DynamoDBStreamEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { Config } from '../utils/config';
import { Logger } from '../utils/logger';
import { EmailTemplates } from '../utils/constants';

const ses = new AWS.SES();
const cognito = new AWS.CognitoIdentityServiceProvider();

type EventHandler = (newData: any, oldData: any) => Promise<void>;

const strategies: Record<string, EventHandler> = {
    'INSERT': async (newData) => {
        if (newData.assignedTo && newData.assignedTo !== 'UNASSIGNED') {
            const assignees = Array.isArray(newData.assignedTo) ? newData.assignedTo : [newData.assignedTo];
            for (const email of assignees) {
                if (await isUserActive(email)) {
                    await sendEmail(
                        email,
                        EmailTemplates.NEW_TASK.SUBJECT,
                        EmailTemplates.NEW_TASK.BODY(newData.title, newData.description)
                    );
                }
            }
        }
    },
    'MODIFY': async (newData, oldData) => {
        if (newData.status !== oldData.status) {
            const subject = EmailTemplates.STATUS_UPDATE.SUBJECT(newData.title);
            const message = EmailTemplates.STATUS_UPDATE.BODY(newData.title, oldData.status, newData.status);

            // Notify all assigned members
            if (newData.assignedTo && newData.assignedTo !== 'UNASSIGNED') {
                const assignees = Array.isArray(newData.assignedTo) ? newData.assignedTo : [newData.assignedTo];
                for (const email of assignees) {
                    if (await isUserActive(email)) {
                        await sendEmail(email, subject, message);
                    }
                }
            }
            
            // Notify admin
            if (await isUserActive(Config.NOTIFICATIONS.ADMIN_EMAIL)) {
                await sendEmail(Config.NOTIFICATIONS.ADMIN_EMAIL, subject, message);
            }
        }
    }
};

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    Logger.info('Processing DynamoDB Stream event', { recordsCount: event.Records.length });

    for (const record of event.Records) {
        const eventName = record.eventName;
        if (!eventName || !strategies[eventName]) continue;

        const newData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage || {}) as any;
        const oldData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.OldImage || {}) as any;

        try {
            await strategies[eventName](newData, oldData);
        } catch (err) {
            Logger.error('Failed to process stream record', err, { taskId: newData.taskId || oldData.taskId });
        }
    }
};

async function isUserActive(email: string): Promise<boolean> {
    if (!Config.COGNITO.USER_POOL_ID) return true;
    
    try {
        const result = await cognito.adminGetUser({
            UserPoolId: Config.COGNITO.USER_POOL_ID,
            Username: email
        }).promise();
        
        return result.Enabled === true && result.UserStatus !== 'UNKNOWN';
    } catch (err) {
        Logger.error('Error checking user status', err, { email });
        return false;
    }
}

async function sendEmail(to: string, subject: string, body: string) {
    try {
        const params = {
            Destination: { ToAddresses: [to] },
            Message: {
                Body: { Text: { Data: body } },
                Subject: { Data: subject }
            },
            Source: Config.NOTIFICATIONS.SENDER_EMAIL
        };

        Logger.info(`Sending email to ${to}`, { subject });
        await ses.sendEmail(params).promise();
        Logger.info(`Email sent successfully to ${to}`);
    } catch (err) {
        Logger.error('Failed to send email', err, { to, subject });
    }
}
