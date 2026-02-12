type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatTimestamp(): string {
    return new Date().toISOString();
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const timestamp = formatTimestamp();
    const logMessage = meta
        ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}`
        : `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
        case 'error':
            console.error(logMessage);
            break;
        case 'warn':
            console.warn(logMessage);
            break;
        case 'debug':
            console.debug(logMessage);
            break;
        default:
            console.log(logMessage);
    }
}

export const logger = {
    info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
    error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
    debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
};
