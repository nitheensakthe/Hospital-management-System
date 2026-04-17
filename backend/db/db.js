const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ Single clean connection test
pool.query("SELECT 1")
  .then(() => {
    console.log("Database connected ✅");
  })
  .catch((err) => {
    console.error("Database connection failed ❌");
    console.error(err.message);
    process.exit(1); // stop app if DB fails (important)
  });

module.exports = pool;