import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from '../config';
import * as schema from './schema';

// Create postgres connection
const client = neon(config.database.url);

// Create drizzle database instance
export const db = drizzle(client, { schema });

export { schema };
