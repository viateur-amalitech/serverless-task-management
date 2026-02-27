export interface Task {
    taskId: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    assignedTo: string;
    dueDate?: string;
    createdAt: string;
}

export interface User {
    username: string;
    email: string;
    status: string;
    enabled: boolean;
}
