export class Logger {
    static info(message: string, context?: any) {
        console.log(JSON.stringify({ level: 'INFO', message, context, timestamp: new Date().toISOString() }));
    }

    static error(message: string, error: any, context?: any) {
        console.error(JSON.stringify({
            level: 'ERROR',
            message,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
            context,
            timestamp: new Date().toISOString()
        }));
    }

    static warn(message: string, context?: any) {
        console.warn(JSON.stringify({ level: 'WARN', message, context, timestamp: new Date().toISOString() }));
    }
}
