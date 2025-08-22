const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

let poolConfig;

if (process.env.DATABASE_URL) {
  // Supabase / cloud Postgres - Enhanced configuration for better reliability
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 3, // Further reduced pool size for better connection management
    min: 0, // Allow pool to be empty when no connections needed
    idleTimeoutMillis: 30000, // Reduced idle timeout to prevent stale connections
    connectionTimeoutMillis: 60000, // Increased connection timeout to 60s
    acquireTimeoutMillis: 60000, // Time to wait for connection from pool
    createTimeoutMillis: 60000, // Time to wait for new connection creation
    destroyTimeoutMillis: 10000, // Time to wait for connection destruction
    reapIntervalMillis: 5000, // How often to check for idle connections
    createRetryIntervalMillis: 1000, // Retry interval for failed connections
    ssl: { 
      rejectUnauthorized: false,
      sslmode: 'require'
    },
    // Additional Supabase-specific settings
    application_name: 'military-asset-api',
    statement_timeout: 60000, // Increased statement timeout
    query_timeout: 60000, // Increased query timeout
    keepAlive: true,
    keepAliveInitialDelayMillis: 30000
  };
} else {
  // Local dev Postgres
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'military_assets',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'kapeesh',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const pool = new Pool(poolConfig);

// On successful connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
  logger.info('Connected to PostgreSQL database');
});

// On idle client error (handle Supabase pooler shutdown)
pool.on('error', (err) => {
  if (err.code === 'XX000') {
    logger.warn('⚠️ Session Pooler closed idle client, reconnecting...');
  } else {
    console.error('❌ Unexpected error on idle PostgreSQL client', err);
    logger.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
  }
});

// Connect to DB with retry logic
const connectDatabase = async (maxRetries = 5, retryDelay = 2000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      
      const client = await pool.connect();
      const { rows } = await client.query('SELECT NOW()');
      console.log('✅ Database connected successfully at:', rows[0].now);
      logger.info('Database connected successfully');
      client.release();
      return true;
    } catch (error) {
      lastError = error;
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('❌ All database connection attempts failed');
        logger.error('Database connection failed after all retries:', error);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(1.5, attempt - 1);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Connection health check
const checkConnectionHealth = async () => {
  try {
    const client = await pool.connect();
    const start = Date.now();
    const { rows } = await client.query('SELECT version(), current_database(), current_user, inet_server_addr(), inet_server_port()');
    const duration = Date.now() - start;
    
    console.log('🔍 Database Health Check:');
    console.log(`   Version: ${rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`   Database: ${rows[0].current_database}`);
    console.log(`   User: ${rows[0].current_user}`);
    console.log(`   Server: ${rows[0].inet_server_addr}:${rows[0].inet_server_port}`);
    console.log(`   Response Time: ${duration}ms`);
    
    client.release();
    return { healthy: true, responseTime: duration };
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return { healthy: false, error: error.message };
  }
};

// Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
    logger.info('Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
    logger.error('Error closing database pool:', error);
  }
};

module.exports = { query, transaction, connectDatabase, checkConnectionHealth, closeDatabase };
