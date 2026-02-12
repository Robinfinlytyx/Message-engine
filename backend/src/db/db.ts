import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config';
import * as schema from './schema';

// Create postgres connection
const client = postgres(config.database.url);

// Create drizzle database instance
export const db = drizzle(client, { schema });

export { schema };
