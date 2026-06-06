/**
 * Aplica migraciones de `collections` en Supabase remoto.
 * Requiere DATABASE_URL en .env.local (Settings → Database → Connection string → URI).
 *
 * Uso: npm run db:collections
 */
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
const migrationFiles = [
  '20250603120000_collections_table.sql',
  '20250603140000_collections_homepage_visibility.sql',
  '20250603150000_collections_portada_images.sql',
]

const databaseUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '').trim()
if (!databaseUrl) {
  console.error(
    'Falta DATABASE_URL en .env.local.\n' +
      'Supabase → Project Settings → Database → Connection string (URI).\n' +
      'O ejecuta el SQL manualmente en SQL Editor con:\n' +
      '  supabase/migrations/20250603120000_collections_table.sql\n' +
      '  supabase/migrations/20250603140000_collections_homepage_visibility.sql\n' +
      '  supabase/migrations/20250603150000_collections_portada_images.sql',
  )
  process.exit(1)
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  for (const file of migrationFiles) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf8')
    console.log(`Applying ${file}...`)
    await client.query(sql)
    console.log(`  OK`)
  }
  const { rows } = await client.query('select count(*)::int as n from public.collections')
  console.log(`Done. collections row count: ${rows[0]?.n ?? 0}`)
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
