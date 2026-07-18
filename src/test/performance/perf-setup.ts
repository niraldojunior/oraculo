process.env.DB_PROVIDER = process.env.DB_PROVIDER || 'oracle';

if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD || !process.env.ORACLE_CONNECTION_STRING) {
  console.warn('[PERFORMANCE TESTS] Oracle credentials not configured. Set ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECTION_STRING.');
  console.warn('[PERFORMANCE TESTS] These tests require a real Oracle instance.');
}

process.env.ORACLE_POOL_MIN = process.env.ORACLE_POOL_MIN || '5';
process.env.ORACLE_POOL_MAX = process.env.ORACLE_POOL_MAX || '20';
