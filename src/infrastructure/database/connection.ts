import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/seo_metadata_db';

  if (!process.env.DATABASE_URL && !process.env.SUPABASE_DATABASE_URL && !process.env.POSTGRES_URL) {
    console.warn('[DB] Nenhuma variável de conexão do Supabase/Postgres foi definida. Usando fallback local.');
  }

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase') || connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}
