import pg from 'pg';
import { env, validateRequiredEnv } from '../config/env.js';

validateRequiredEnv();

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
});
