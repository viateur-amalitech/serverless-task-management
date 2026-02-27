import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { Task, UserClaims, TaskStatus, TaskPriority } from '../types';
import { Auth } from '../lib/auth';
import { TaskRepository } from '../lib/database';
import { withMiddleware } from '../middleware/wrapper';
import { ValidationError, ForbiddenError } from '../utils/errors';
import { Logger } from '../utils/logger';
import * as AWS from 'aws-sdk';
import { EmailTemplates } from '../utils/constants';
import { Config } from '../utils/config';
import { Logger } from '../utils/logger';
import { isUserActive, sendEmail } from './notification_handler';

const cognito = new AWS.CognitoIdentityServiceProvider();

/**
 * Task & User Handler logic wrapped in middleware.
 * Incorporates all logic version: Priority, Deletion, User Management.
 */
export const handler = withMiddleware(async (event: APIGatewayProxyEventV2, _context, claims) => {
    const httpMethod = event.requestContext.http.method;
    const path = event.rawPath;
    const body = event.body;
    const pathParameters = event.pathParameters || {};
    const queryStringParameters = event.queryStringParameters;

    // Normalize resource path for routing
    // e.g., /tasks/123 -> /tasks/{id}
    let resource = path;
    if (path.match(/^\/tasks\/[^/]+$/)) {
        resource = '/tasks/{id}';
    }

    const isAdmin = Auth.isAdmin(claims);
    const userEmail = claims.email;

    // --- GET /users ---
    if (resource === '/users' && httpMethod === 'GET') {
        if (!isAdmin) throw new ForbiddenError('Only admins can list users');
        return await listUsers();
    }

    // --- GET /tasks    (with search) ---
    if (resource === '/tasks' && httpMethod === 'GET') {
        const query = queryStringParameters?.q;
        if (query) {
            return await TaskRepository.search(query, isAdmin, userEmail);
        }
        return isAdmin
            ? await TaskRepository.getAll()
            : await TaskRepository.getByAssignee(userEmail);
    }

    // --- POST /tasks ---
    if (resource === '/tasks' && httpMethod === 'POST') {
        if (!isAdmin) throw new ForbiddenError();
        const data = JSON.parse(body || '{}');

        if (!data.title) throw new ValidationError('task title is required.');
        const priority = (data.priority || 'MEDIUM') as TaskPriority;
        if (!['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
            throw new ValidationError('Invalid priority level.');
        }

        // Support multiple assignees
        let assignedTo = data.assignedTo || 'UNASSIGNED';
        if (assignedTo !== 'UNASSIGNED') {
            const assignees = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
            
            // Remove duplicates
            const uniqueAssignees = [...new Set(assignees)];
            
            // Check for deactivated users
            for (const email of uniqueAssignees) {
                if (!(await Auth.isUserActive(email))) {
                    throw new ValidationError(`Cannot assign task to inactive or deactivated user: ${email}`);
                }
            }
            
            assignedTo = uniqueAssignees.length === 1 ? uniqueAssignees[0] : uniqueAssignees;
        }


        const newTask: Task = {
            taskId: Date.now().toString(),
            title: data.title,
            description: data.description || '',
            status: 'OPEN',
            priority,
            assignedTo,
            dueDate: data.dueDate,
            createdAt: new Date().toISOString()
        };

        await TaskRepository.create(newTask);
        return { statusCode: 201, body: newTask };
    }

    if (resource === '/tasks/{id}' && httpMethod === 'PUT') {
        const taskId = pathParameters?.id || '';
        const data = JSON.parse(body || '{}');
        const oldTask = await TaskRepository.getById(taskId);

        if (!Auth.canUpdateTask(claims, oldTask.assignedTo)) {
            throw new ForbiddenError('You are not authorized to update this task.');
        }

        const updates: Partial<Task> = {};
        let statusChanged = false;
        if (data.status) {
            const allowed: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];
            if (!allowed.includes(data.status as TaskStatus)) {
                throw new ValidationError('Invalid status. Use OPEN, IN_PROGRESS, or CLOSED.');
            }
            updates.status = data.status as TaskStatus;
            if (oldTask.status !== data.status) {
                statusChanged = true;
            }
        }

        if (isAdmin) {
            if (data.priority) {
                if (!['LOW', 'MEDIUM', 'HIGH'].includes(data.priority)) {
                    throw new ValidationError('Invalid priority level.');
                }
                updates.priority = data.priority as TaskPriority;
            }
            if (data.assignedTo) {
                let assignedTo = data.assignedTo;
                if (assignedTo !== 'UNASSIGNED') {
                    const assignees = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
                    // Remove duplicates
                    const uniqueAssignees = [...new Set(assignees)];
                    // Check for deactivated users
                    for (const email of uniqueAssignees) {
                        if (!(await Auth.isUserActive(email))) {
                            throw new ValidationError(`Cannot assign task to inactive or deactivated user: ${email}`);
                        }
                    }
                    assignedTo = uniqueAssignees.length === 1 ? uniqueAssignees[0] : uniqueAssignees;
                }
                updates.assignedTo = assignedTo;
            }
        }

        if (Object.keys(updates).length === 0) {
            throw new ValidationError('No valid update fields provided.');
        }

        updates.updatedAt = new Date().toISOString();
        await TaskRepository.update(taskId, updates, claims.email);

        // Send notification if status changed
        if (statusChanged) {
            try {
                const newTask = { ...oldTask, ...updates };
                const subject = EmailTemplates.STATUS_UPDATE.SUBJECT(newTask.title);
                const message = EmailTemplates.STATUS_UPDATE.BODY(newTask.title, oldTask.status, newTask.status);
                // Notify all assigned members
                if (newTask.assignedTo && newTask.assignedTo !== 'UNASSIGNED') {
                    const assignees = Array.isArray(newTask.assignedTo) ? newTask.assignedTo : [newTask.assignedTo];
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
            } catch (err) {
                Logger.error('Failed to send status change notification', err, { taskId });
            }
        }

        return { body: { message: 'Task updated successfully', taskId } };
    }

    // --- DELETE /tasks/{id} ---
    if (resource === '/tasks/{id}' && httpMethod === 'DELETE') {
        if (!isAdmin) throw new ForbiddenError('Only admins can delete tasks.');
        const taskId = pathParameters?.id || '';
        await TaskRepository.delete(taskId);
        return { body: { message: 'Task deleted successfully' } };
    }

    return { statusCode: 404, body: { message: 'Resource path not found' } };
});

async function listUsers() {
    const poolId = process.env.USER_POOL_ID;
    Logger.info('[listUsers] Starting listUsers function');
    Logger.info('[listUsers] USER_POOL_ID exists:', !!poolId);
    if (!poolId) throw new Error('USER_POOL_ID environment variable is missing');

    try {
        const result = await cognito.listUsers({ UserPoolId: poolId }).promise();
        Logger.info('[listUsers] Cognito listUsers result count:', result.Users?.length || 0);
        Logger.info('[listUsers] Raw Cognito users:', JSON.stringify(result.Users));

        const mapped = (result.Users || []).map((u: AWS.CognitoIdentityServiceProvider.UserType) => {
            const email = u.Attributes?.find(a => a.Name === 'email')?.Value || '';
            const name = u.Attributes?.find(a => a.Name === 'name')?.Value || u.Username || '';
            Logger.info('[listUsers] Processing user:', { username: name, email, userStatus: u.UserStatus });
            return {
                username: name,
                email,
                status: u.UserStatus,
                enabled: u.Enabled
            };
        });
        Logger.info('[listUsers] Final mapped users count:', mapped.length);
        return mapped;
    } catch (err) {
        Logger.error('[listUsers] Error in listUsers:', err);
        throw err;
    }
}
