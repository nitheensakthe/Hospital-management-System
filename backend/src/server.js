require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

async function initDbIfEnabled() {
  const enabled = String(process.env.RUN_DB_INIT || '').toLowerCase() === 'true';
  if (!enabled) return;

  const fs = require('fs');
  const path = require('path');

  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schemaSql = await fs.promises.readFile(schemaPath, 'utf8');

  console.log('RUN_DB_INIT=true — applying database schema.sql');
  await pool.query(schemaSql);
  console.log('Database schema ensured');
}

const PORT = process.env.PORT || 5000;

initDbIfEnabled()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database');
    console.error(error);
    process.exit(1);
  });