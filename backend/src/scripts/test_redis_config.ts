import { getRedisConnectionOptions } from '../config';

function testConfig(env: Record<string, string>) {
    // Backup original env
    const originalEnv = { ...process.env };

    // Set mock env
    Object.assign(process.env, env);

    console.log(`\nTesting with Env: ${JSON.stringify(env)}`);
    try {
        const options = getRedisConnectionOptions();
        console.log(`Generated Options: ${JSON.stringify(options, null, 2)}`);
    } catch (e) {
        console.error(`Error: ${e}`);
    } finally {
        // Restore original env
        process.env = originalEnv;
    }
}

console.log('--- Redis Config Verification ---');

// Case 1: REDIS_URL
testConfig({ REDIS_URL: 'redis://default:password@random-host:12345' });

// Case 2: Railway standard variables
testConfig({
    REDISHOST: 'railway-host',
    REDISPORT: '6379',
    REDISUSER: 'railway-user',
    REDISPASSWORD: 'railway-password'
});

// Case 3: Fallback (local)
testConfig({});
