import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config';
import * as schema from './schema';

// Create postgres connection pool
const pool = new Pool({
    connectionString: config.database.url,
    ssl: config.database.url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

// Create drizzle database instance
export const db = drizzle(pool, { schema });

export { schema };
