import { createClient } from '@supabase/supabase-js'

export const PROMOTION_TYPES = ['code_only', 'banner_popup', 'header_bar'] as const
export type PromotionType = (typeof PROMOTION_TYPES)[number]

export interface PromotionRow {
  id: string
  type: PromotionType
  code: string
  discount_percentage: number
  announcement_text: string | null
  is_active: boolean
  created_at: string
}

export interface CreatePromotionInput {
  type: PromotionType
  code: string
  discountPercentage: number
  announcementText?: string | null
}

export interface PromoValidationResult {
  isValid: boolean
  code: string | null
  discountPercentage: number | null
  promotionId: string | null
}

function getSupabaseAnonClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()
  if (!url || !anonKey) throw new Error('Faltan credenciales públicas de Supabase para validar promociones.')
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

export async function validatePromoCodePublic(code: string): Promise<PromoValidationResult> {
  const normalizedCode = String(code || '').trim().toUpperCase()
  if (!normalizedCode) {
    return { isValid: false, code: null, discountPercentage: null, promotionId: null }
  }
  const supabase = getSupabaseAnonClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('id,code,discount_percentage')
    .eq('is_active', true)
    .eq('code', normalizedCode)
    .maybeSingle()
  if (error || !data) {
    return { isValid: false, code: null, discountPercentage: null, promotionId: null }
  }
  return {
    isValid: true,
    code: String(data.code),
    discountPercentage: Number(data.discount_percentage) || 0,
    promotionId: String(data.id),
  }
}
