export const EmailTemplates = {
    NEW_TASK: {
        SUBJECT: 'New Task Assigned',
        BODY: (title: string, description: string) =>
            `Hello, you have been assigned a new task: ${title}\n\nBrief: ${description}`
    },
    STATUS_UPDATE: {
        SUBJECT: (title: string) => `Task Status Updated: ${title}`,
        BODY: (title: string, oldStatus: string, newStatus: string) =>
            `The status of "${title}" has changed from ${oldStatus} to ${newStatus}.`
    }
};
