export const Config = {
    PROJECT_NAME: process.env.PROJECT_NAME || 'task-mgmt',
    DYNAMODB: {
        TASKS_TABLE: process.env.TABLE_NAME || '',
        AUDIT_TABLE: process.env.AUDIT_TABLE || '',
        USERS_TABLE: process.env.USERS_TABLE || ''
    },
    COGNITO: {
        ALLOWED_DOMAINS: (process.env.ALLOWED_DOMAINS || 'amalitech.com,amalitechtraining.org').split(','),
        ADMIN_GROUP: process.env.ADMIN_GROUP_NAME || 'Admin',
        MEMBER_GROUP: process.env.MEMBER_GROUP_NAME || 'Member',
        USER_POOL_ID: process.env.USER_POOL_ID || ''
    },
    NOTIFICATIONS: {
        SENDER_EMAIL: process.env.SENDER_EMAIL || 'noreply@amalitech.com',
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@amalitech.com'
    }
};
