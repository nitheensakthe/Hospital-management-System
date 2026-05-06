const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const looksLocal = /localhost|127\.0\.0\.1/i.test(connectionString);
if (isProduction && looksLocal) {
  throw new Error(
    'DATABASE_URL points to localhost/127.0.0.1 in production. Set DATABASE_URL to your hosted Postgres connection string.'
  );
}
const sslFromEnv = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';
const sslModeRequired = String(process.env.PGSSLMODE || '').toLowerCase() === 'require';
const sslFromConnectionString =
  typeof connectionString === 'string' && /sslmode=require/i.test(connectionString);

const useSsl = sslFromEnv || sslModeRequired || sslFromConnectionString ||
  (typeof connectionString === 'string' && connectionString.includes('neon.tech')) ||
  (isProduction && !looksLocal);

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;
