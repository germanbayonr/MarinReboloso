'use server'

import { revalidatePath } from 'next/cache'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import {
  PROMOTION_TYPES,
  type CreatePromotionInput,
  type PromotionRow,
  validatePromoCodePublic,
} from '@/lib/promotions'

function normalizeCode(value: string): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9Ñ]/g, '')
}

export async function getPromotions(): Promise<PromotionRow[]> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { data, error } = await sb.from('promotions').select('*').order('created_at', { ascending: false }).limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []) as PromotionRow[]
}

export async function createPromotion(
  data: CreatePromotionInput,
): Promise<{ ok: true; promotion: PromotionRow } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const type = data.type
  if (!PROMOTION_TYPES.includes(type)) return { ok: false, error: 'Tipo de promoción no válido.' }
  const code = normalizeCode(data.code)
  if (code.length < 3) return { ok: false, error: 'El código debe tener al menos 3 caracteres.' }
  const discount = Number(data.discountPercentage)
  if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
    return { ok: false, error: 'El descuento debe estar entre 1 y 100.' }
  }
  const announcementText = String(data.announcementText ?? '').trim()
  const requiresAnnouncement = type === 'banner_popup' || type === 'header_bar'
  if (requiresAnnouncement && !announcementText) {
    return { ok: false, error: 'El texto del anuncio es obligatorio para banner y header.' }
  }
  const { data: inserted, error } = await sb
    .from('promotions')
    .insert({
      type,
      code,
      discount_percentage: discount,
      announcement_text: announcementText || null,
      is_active: false,
    })
    .select('*')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/promotions')
  revalidatePath('/checkout')
  revalidatePath('/')
  return { ok: true, promotion: inserted as PromotionRow }
}

export async function updatePromotion(
  id: string,
  data: CreatePromotionInput,
): Promise<{ ok: true; promotion: PromotionRow } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const type = data.type
  if (!PROMOTION_TYPES.includes(type)) return { ok: false, error: 'Tipo de promoción no válido.' }
  const code = normalizeCode(data.code)
  if (code.length < 3) return { ok: false, error: 'El código debe tener al menos 3 caracteres.' }
  const discount = Number(data.discountPercentage)
  if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
    return { ok: false, error: 'El descuento debe estar entre 1 y 100.' }
  }
  const announcementText = String(data.announcementText ?? '').trim()
  const requiresAnnouncement = type === 'banner_popup' || type === 'header_bar'
  if (requiresAnnouncement && !announcementText) {
    return { ok: false, error: 'El texto del anuncio es obligatorio para banner y header.' }
  }
  const { data: updated, error } = await sb
    .from('promotions')
    .update({
      type,
      code,
      discount_percentage: discount,
      announcement_text: announcementText || null,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/promotions')
  revalidatePath('/checkout')
  revalidatePath('/')
  return { ok: true, promotion: updated as PromotionRow }
}

export async function togglePromotionActive(
  id: string,
  status: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { error } = await sb.from('promotions').update({ is_active: status }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/promotions')
  revalidatePath('/checkout')
  revalidatePath('/')
  return { ok: true }
}

export async function deletePromotion(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { error } = await sb.from('promotions').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/promotions')
  revalidatePath('/checkout')
  revalidatePath('/')
  return { ok: true }
}

export async function validatePromoCode(code: string): Promise<{
  ok: boolean
  discountPercentage: number | null
  code: string | null
  promotionId: string | null
}> {
  const result = await validatePromoCodePublic(code)
  return {
    ok: result.isValid,
    discountPercentage: result.discountPercentage,
    code: result.code,
    promotionId: result.promotionId,
  }
}
