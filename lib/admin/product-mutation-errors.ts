import {
  isLikelyRowLevelSecurityMessage,
  logAdminSupabaseIssue,
  RLS_BLOCK_USER_MESSAGE,
} from '@/lib/admin/supabase-admin-log'

export function productMutationErrorResult(
  operation: 'create' | 'update' | 'delete',
  rawMessage: string,
): { ok: false; error: string } {
  if (isLikelyRowLevelSecurityMessage(rawMessage)) {
    const code =
      operation === 'create'
        ? 'PRODUCT_CREATE_RLS'
        : operation === 'update'
          ? 'PRODUCT_UPDATE_RLS'
          : 'PRODUCT_DELETE_RLS'
    logAdminSupabaseIssue(code, 'PostgREST devolvió error típico de RLS en products.', {
      operation,
      supabaseMessage: rawMessage,
      hint: 'Con service_role no debería aplicarse RLS; revisar env en runtime.',
    })
    return { ok: false as const, error: `${RLS_BLOCK_USER_MESSAGE}${rawMessage}` }
  }
  logAdminSupabaseIssue('PRODUCT_MUTATION_DB', `Error en products (${operation}).`, {
    operation,
    supabaseMessage: rawMessage,
  })
  return { ok: false as const, error: rawMessage }
}
