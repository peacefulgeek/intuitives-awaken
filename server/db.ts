import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDb(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    pool.on('error', (err) => {
      console.error('[db] Unexpected pool error', err);
    });
  }
  return pool;
}

export async function initDb(): Promise<void> {
  const db = getDb();

  // Create articles table with full queue-system schema
  await db.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      meta_description TEXT,
      og_title TEXT,
      og_description TEXT,
      category VARCHAR(100),
      tags TEXT[],
      body TEXT NOT NULL,
      image_url TEXT,
      image_alt TEXT,
      reading_time INTEGER DEFAULT 8,
      author VARCHAR(100) DEFAULT 'Kalesh',
      -- Queue system: status replaces boolean published
      status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('queued','published','archived')),
      published_at TIMESTAMPTZ DEFAULT NOW(),
      queued_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      word_count INTEGER,
      asins_used TEXT[],
      last_refreshed_30d TIMESTAMPTZ,
      last_refreshed_90d TIMESTAMPTZ,
      opener_type VARCHAR(50),
      conclusion_type VARCHAR(50)
    );

    -- Migrate legacy boolean published column if it exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='articles' AND column_name='published' AND data_type='boolean'
      ) THEN
        -- Add status column if not already there
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='articles' AND column_name='status'
        ) THEN
          ALTER TABLE articles ADD COLUMN status VARCHAR(20) DEFAULT 'published'
            CHECK (status IN ('queued','published','archived'));
          UPDATE articles SET status = CASE WHEN published = true THEN 'published' ELSE 'archived' END;
        END IF;
        -- Drop the old boolean column
        ALTER TABLE articles DROP COLUMN IF EXISTS published;
      END IF;
    END $$;

    -- Add queued_at column if missing (migration for existing deployments)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='articles' AND column_name='queued_at'
      ) THEN
        ALTER TABLE articles ADD COLUMN queued_at TIMESTAMPTZ DEFAULT NOW();
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      questions JSONB NOT NULL,
      results JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS asin_health_log (
      id SERIAL PRIMARY KEY,
      checked_at TIMESTAMPTZ DEFAULT NOW(),
      total INTEGER,
      passed INTEGER,
      failed INTEGER,
      failed_asins JSONB
    );

    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
  `);
  console.log('[db] Schema initialized (queue-system v2)');
}
