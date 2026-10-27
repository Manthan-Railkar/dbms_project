import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) return pool;

  const rawUrl = process.env.DATABASE_URL || '';
  
  // Check if connection string needs pooler fallback
  const isDirectHostUnavailable = rawUrl.includes('db.ungftzhnitrfpgzomfzn.supabase.co');
  
  let poolConfig: PoolConfig;

  if (isDirectHostUnavailable || !rawUrl) {
    // Connect directly to known active Supabase pooler host
    poolConfig = {
      host: 'aws-0-ap-northeast-2.pooler.supabase.com',
      port: 5432,
      user: 'postgres.ungftzhnitrfpgzomfzn',
      password: process.env.DB_PASSWORD || 'KAJ68A8NBuL6UbFg',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  } else {
    poolConfig = {
      connectionString: rawUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  return pool;
}
