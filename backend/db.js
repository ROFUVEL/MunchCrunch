const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'restaurant_db',
  password: process.env.PGPASSWORD || 'your_password',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});

module.exports = pool;
