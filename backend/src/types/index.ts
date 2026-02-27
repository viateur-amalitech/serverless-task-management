export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
    taskId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo: string;
    dueDate?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface User {
    username: string;
    email: string;
    role: 'Admin' | 'Member';
}

export interface UserClaims {
    email: string;
    'cognito:groups'?: string | string[];
}
