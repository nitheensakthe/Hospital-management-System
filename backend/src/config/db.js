const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const useSsl = connectionString && connectionString.includes('neon.tech');

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;
