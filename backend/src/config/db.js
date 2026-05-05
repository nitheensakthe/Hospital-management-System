const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const sslFromEnv = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';
const sslModeRequired = String(process.env.PGSSLMODE || '').toLowerCase() === 'require';
const sslFromConnectionString =
  typeof connectionString === 'string' && /sslmode=require/i.test(connectionString);

const useSsl = sslFromEnv || sslModeRequired || sslFromConnectionString ||
  (typeof connectionString === 'string' && connectionString.includes('neon.tech'));

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;
