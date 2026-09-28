import { jwtRoleFromSupabaseKey } from '@/lib/supabase/jwt-role'
import { MIGRATION_PROBES, REPO_MIGRATION_FILES, type MigrationProbeId } from '@/lib/admin/migration-manifest'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AdminEnvCheck = {
  ok: boolean
  issues: string[]
  env: {
    nodeEnv: string | null
    vercelEnv: string | null
    hasNextPublicSupabaseUrl: boolean
    supabaseHost: string | null
    hasNextPublicSupabaseAnonKey: boolean
    hasSupabaseServiceRoleKey: boolean
    serviceRoleKeyEqualsAnon: boolean
    serviceRoleJwtRole: string | null
    hasStripeSecretKey: boolean
  }
}

function supabaseHostFromUrl(raw: string | undefined): string | null {
  const url = String(raw ?? '').trim()
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function stripeSecretPresent(): boolean {
  return Boolean(
    (
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY ||
      process.env.STRIPE_SECRET ||
      process.env.NEXT_STRIPE_SECRET_KEY ||
      ''
    ).trim(),
  )
}

export function checkAdminEnvironment(): AdminEnvCheck {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const issues: string[] = []

  const hasNextPublicSupabaseUrl = Boolean(url)
  const hasNextPublicSupabaseAnonKey = Boolean(anon)
  const hasSupabaseServiceRoleKey = Boolean(serviceKey)
  const serviceRoleKeyEqualsAnon = Boolean(serviceKey && anon && serviceKey === anon)
  const serviceRoleJwtRole = serviceKey ? jwtRoleFromSupabaseKey(serviceKey) : null
  const hasStripeSecretKey = stripeSecretPresent()

  if (!hasNextPublicSupabaseUrl) {
    issues.push('Falta NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL).')
  }
  if (!hasNextPublicSupabaseAnonKey) {
    issues.push('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  if (!hasSupabaseServiceRoleKey) {
    issues.push('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor (Vercel → Production).')
  }
  if (serviceRoleKeyEqualsAnon) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY no puede ser la misma clave que la anon.')
  }
  if (serviceRoleJwtRole && serviceRoleJwtRole !== 'service_role') {
    issues.push(`SUPABASE_SERVICE_ROLE_KEY no es service_role (JWT role="${serviceRoleJwtRole}").`)
  }
  if (!hasStripeSecretKey) {
    issues.push('Falta STRIPE_SECRET_KEY (crear productos y checkout desde admin).')
  }

  const ok = issues.length === 0

  return {
    ok,
    issues,
    env: {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      hasNextPublicSupabaseUrl,
      supabaseHost: supabaseHostFromUrl(url),
      hasNextPublicSupabaseAnonKey,
      hasSupabaseServiceRoleKey,
      serviceRoleKeyEqualsAnon,
      serviceRoleJwtRole,
      hasStripeSecretKey,
    },
  }
}

export type MigrationProbeResult = {
  id: MigrationProbeId
  migrationFile: string
  description: string
  status: 'ok' | 'missing' | 'error'
  detail: string | null
}

export async function probeDatabaseMigrations(sb: SupabaseClient): Promise<MigrationProbeResult[]> {
  const results: MigrationProbeResult[] = []

  for (const probe of MIGRATION_PROBES) {
    const base = {
      id: probe.id,
      migrationFile: probe.migrationFile,
      description: probe.description,
    }

    try {
      if (probe.id === 'collections.table') {
        const { error } = await sb.from('collections').select('slug').limit(1)
        if (error) {
          results.push({ ...base, status: 'missing', detail: error.message })
          continue
        }
        results.push({ ...base, status: 'ok', detail: null })
        continue
      }

      if (probe.id === 'promotions.table') {
        const { error } = await sb.from('promotions').select('id').limit(1)
        if (error) {
          results.push({ ...base, status: 'missing', detail: error.message })
          continue
        }
        results.push({ ...base, status: 'ok', detail: null })
        continue
      }

      if (probe.id === 'products.has_variants') {
        const { error } = await sb.from('products').select('has_variants,variants').limit(1)
        if (error && isMissingColumnError(error.message)) {
          results.push({ ...base, status: 'missing', detail: error.message })
          continue
        }
        if (error) {
          results.push({ ...base, status: 'error', detail: error.message })
          continue
        }
        results.push({ ...base, status: 'ok', detail: null })
        continue
      }

      if (probe.id === 'products.is_active') {
        const { error } = await sb.from('products').select('is_active').limit(1)
        if (error && isMissingColumnError(error.message)) {
          results.push({ ...base, status: 'missing', detail: error.message })
          continue
        }
        if (error) {
          results.push({ ...base, status: 'error', detail: error.message })
          continue
        }
        results.push({ ...base, status: 'ok', detail: null })
        continue
      }

      if (probe.id === 'orders.customer_phone') {
        const { error } = await sb.from('orders').select('customer_phone').limit(1)
        if (error && isMissingColumnError(error.message)) {
          results.push({ ...base, status: 'missing', detail: error.message })
          continue
        }
        if (error) {
          results.push({ ...base, status: 'error', detail: error.message })
          continue
        }
        results.push({ ...base, status: 'ok', detail: null })
        continue
      }

      if (probe.id === 'orders.total_amount') {
        const { error } = await sb.from('orders').select('total_amount').limit(1)
        if (error && isMissingColumnError(error.message)) {
          results.push({ ...base, status: 'missing', detail: error.message })
          continue
        }
        if (error) {
          results.push({ ...base, status: 'error', detail: error.message })
          continue
        }
        results.push({ ...base, status: 'ok', detail: null })
        continue
      }

      if (probe.id === 'customers.email') {
        const { error } = await sb.from('customers').select('email').limit(1)
        if (error && isMissingColumnError(error.message)) {
          results.push({ ...base, status: 'missing', detail: error.message })
          continue
        }
        if (error) {
          results.push({ ...base, status: 'error', detail: error.message })
          continue
        }
        results.push({ ...base, status: 'ok', detail: null })
        continue
      }

      results.push({ ...base, status: 'error', detail: 'Sonda no implementada' })
    } catch (e) {
      results.push({
        ...base,
        status: 'error',
        detail: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return results
}

function isMissingColumnError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('does not exist') || m.includes('column') || m.includes('could not find')
}

export function migrationManifestForHealth() {
  return {
    repoMigrationCount: REPO_MIGRATION_FILES.length,
    repoMigrations: [...REPO_MIGRATION_FILES],
    probes: MIGRATION_PROBES.map((p) => ({
      id: p.id,
      migrationFile: p.migrationFile,
      description: p.description,
    })),
  }
}
