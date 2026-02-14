import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '../config';

export const emailQueue = new Queue('email', {
    connection: getRedisConnectionOptions(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute initial delay
        },
        removeOnComplete: {
            age: 86400, // Keep for 24 hours
            count: 1000,
        },
        removeOnFail: false, // Keep failed jobs for analysis
    },
});
