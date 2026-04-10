/** Prefijo fijo para filtrar en terminal / Vercel / Log Drain. */
export const ADMIN_SUPABASE_LOG_PREFIX = '[admin][supabase]'

export type AdminSupabaseIssueCode =
  | 'MISSING_SERVICE_ENV'
  | 'SERVICE_ROLE_EQUALS_ANON'
  | 'JWT_ROLE_NOT_SERVICE_ROLE'
  | 'PRODUCT_CREATE_RLS'
  | 'PRODUCT_UPDATE_RLS'
  | 'PRODUCT_DELETE_RLS'
  | 'PRODUCT_MUTATION_DB'
  | 'STORAGE_UPLOAD_FAILED'
  | 'STORAGE_DELETE_FAILED'

/**
 * Registra un problema de configuración o de mutación admin↔Supabase.
 * No registra secretos ni JWT completos.
 */
export function logAdminSupabaseIssue(
  code: AdminSupabaseIssueCode,
  message: string,
  extra?: Record<string, string | undefined>,
) {
  const line = `${ADMIN_SUPABASE_LOG_PREFIX} [${code}] ${message}`
  if (extra && Object.keys(extra).length > 0) {
    const safe = Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v != null && v !== '') as [string, string][],
    )
    console.error(line, safe)
  } else {
    console.error(line)
  }
}

export function isLikelyRowLevelSecurityMessage(msg: string): boolean {
  const m = msg.toLowerCase()
  return m.includes('row-level security') || m.includes('rls') || m.includes('violates row-level')
}

/** Texto para toast / UI cuando PostgREST devuelve RLS pese a usar service client. */
export const RLS_BLOCK_USER_MESSAGE =
  'La base de datos bloqueó la operación (RLS). Suele indicar que el servidor no está usando la clave «service_role» ' +
  '(revisa SUPABASE_SERVICE_ROLE_KEY, que no sea la anon, reinicia el dev server y que la URL sea del mismo proyecto). ' +
  'Detalle técnico: '
