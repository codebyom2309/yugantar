import mysql, { type Pool, type ResultSetHeader } from 'mysql2/promise';

// ---------------------------------------------------------------------------
// Connection pool singleton
// ---------------------------------------------------------------------------

const globalForDb = globalThis as unknown as {
  dbPool: Pool | undefined;
};

function getPool(): Pool {
  if (globalForDb.dbPool) return globalForDb.dbPool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse the MySQL URL
  const url = new URL(databaseUrl);

  const pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: {
      rejectUnauthorized: true,
    },
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.dbPool = pool;
  }

  return pool;
}

export const db = {
  getPool,

  /** Execute a query and return the result rows */
  async query<T = Record<string, unknown>>(
    sql: string,
    params?: (string | number | null | Date)[],
  ): Promise<T[]> {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  },

  /** Execute a single insert/update and return the result */
  async execute(sql: string, params?: (string | number | null | Date)[]) {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(sql, params);
    return result;
  },
};
