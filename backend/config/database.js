const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('📦 Connected to PostgreSQL');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err.message);
});

/**
 * Run a query against the pool.
 * @param {string} text  SQL string
 * @param {any[]}  params  Parameterised values
 */
const query = (text, params) => pool.query(text, params);

/**
 * Grab a client from the pool for multi-statement transactions.
 * Always release in a finally block.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
