import * as AWS from 'aws-sdk';
import { Task } from '../types';
import { Config } from '../utils/config';
import { Logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

const dynamo = new AWS.DynamoDB.DocumentClient();

export class TaskRepository {
    static async getAll(): Promise<Task[]> {
        Logger.info('Fetching all tasks');
        const result = await dynamo.scan({ TableName: Config.DYNAMODB.TASKS_TABLE }).promise();
        return (result.Items as Task[]) || [];
    }

    static async getByAssignee(email: string): Promise<Task[]> {
        Logger.info(`Fetching tasks for assignee: ${email}`);
        const result = await dynamo.query({
            TableName: Config.DYNAMODB.TASKS_TABLE,
            IndexName: 'AssignedToIndex',
            KeyConditionExpression: 'assignedTo = :email',
            ExpressionAttributeValues: { ':email': email }
        }).promise();
        return (result.Items as Task[]) || [];
    }

    static async getById(taskId: string): Promise<Task> {
        Logger.info(`Fetching task by id: ${taskId}`);
        const result = await dynamo.get({ TableName: Config.DYNAMODB.TASKS_TABLE, Key: { taskId } }).promise();
        if (!result.Item) throw new NotFoundError(`Task with ID ${taskId} not found`);
        return result.Item as Task;
    }

    static async search(query: string, isAdmin: boolean, userEmail: string): Promise<Task[]> {
        Logger.info(`Searching tasks with query: ${query}`);
        // Simple search logic - usually done with OpenSearch for production, 
        // but for this lab we will filter the returned results for performance/simplicity
        const all = isAdmin ? await this.getAll() : await this.getByAssignee(userEmail);
        const searchLower = query.toLowerCase();
        return all.filter(t =>
            t.title.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower)
        );
    }

    static async create(task: Task): Promise<void> {
        Logger.info(`Creating new task: ${task.taskId}`);
        await dynamo.put({ TableName: Config.DYNAMODB.TASKS_TABLE, Item: task }).promise();
        await this.logAudit(task.taskId, 'CREATE', task);
    }

    static async update(taskId: string, updates: Partial<Task>, updatedBy: string): Promise<void> {
        Logger.info(`Updating task: ${taskId}`, { updates, updatedBy });
        let updateExpression = 'set';
        let expressionAttributeNames: any = {};
        let expressionAttributeValues: any = {};

        Object.entries(updates).forEach(([key, value], index) => {
            const attrName = `#attr${index}`;
            const attrVal = `:val${index}`;
            updateExpression += ` ${attrName} = ${attrVal},`;
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrVal] = value;
        });

        updateExpression = updateExpression.slice(0, -1);

        await dynamo.update({
            TableName: Config.DYNAMODB.TASKS_TABLE,
            Key: { taskId },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        }).promise();

        await this.logAudit(taskId, 'UPDATE', { updates, updatedBy });
    }

    static async delete(taskId: string): Promise<void> {
        Logger.info(`Deleting task: ${taskId}`);
        await dynamo.delete({ TableName: Config.DYNAMODB.TASKS_TABLE, Key: { taskId } }).promise();
        await this.logAudit(taskId, 'DELETE', { timestamp: new Date().toISOString() });
    }

    private static async logAudit(taskId: string, action: string, data: any) {
        if (!Config.DYNAMODB.AUDIT_TABLE) return;
        try {
            await dynamo.put({
                TableName: Config.DYNAMODB.AUDIT_TABLE,
                Item: {
                    auditId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    taskId,
                    action,
                    data,
                    timestamp: new Date().toISOString()
                }
            }).promise();
        } catch (err) {
            Logger.error('Failed to log audit', err);
        }
    }
}
