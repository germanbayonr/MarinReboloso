/**
 * Aplica migración has_variants / variants en Supabase remoto.
 * Requiere DATABASE_URL en .env.local
 *
 * Uso: node --env-file=.env.local scripts/apply-products-variants-migration.mjs
 */
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250604120000_products_variants.sql')

const databaseUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '').trim()
if (!databaseUrl) {
  console.error('Falta DATABASE_URL en .env.local (Supabase → Database → Connection string URI).')
  process.exit(1)
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  const sql = await readFile(sqlPath, 'utf8')
  console.log('Applying products variants migration...')
  await client.query(sql)
  const { rows } = await client.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name='products' and column_name in ('has_variants','variants') order by column_name",
  )
  console.log('OK. Columns:', rows.map((r) => r.column_name).join(', ') || '(none)')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
