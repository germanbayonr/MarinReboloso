import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'

function readEnvLocalVar(key: string) {
  try {
    const filePath = path.join(process.cwd(), '.env.local')
    const src = readFileSync(filePath, 'utf8')
    const lines = src.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const match = trimmed.match(new RegExp(`^(?:export\\s+)?${key}\\s*=\\s*(.*)$`))
      if (!match) continue
      let value = match[1].trim()
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
      return value
    }
  } catch {}
  return ''
}

export function createSupabaseServerClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const envUrl = rawUrl || readEnvLocalVar('NEXT_PUBLIC_SUPABASE_URL') || readEnvLocalVar('SUPABASE_URL')
  const url = envUrl
    .trim()
    .replace(/^https:https:\/\//, 'https://')
    .replace(/^http:http:\/\//, 'http://')
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    readEnvLocalVar('SUPABASE_SERVICE_ROLE_KEY') ||
    process.env.SUPABASE_SERVICE_KEY ||
    readEnvLocalVar('SUPABASE_SERVICE_KEY') ||
    process.env.SUPABASE_SERVICE_ROLE ||
    readEnvLocalVar('SUPABASE_SERVICE_ROLE') ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    readEnvLocalVar('SUPABASE_ANON_KEY') ||
    readEnvLocalVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    ''

  if (!url || !key) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
