'use server'

import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import {
  PROMOTION_TYPES,
  type CreatePromotionInput,
  type PromotionRow,
  validatePromoCodePublic,
} from '@/lib/promotions'
import { disableStripePromotionCodesByCode, ensureStripePromotionCode } from '@/lib/stripe-promotions'

function normalizeCode(value: string): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9Ñ]/g, '')
}

function stripeSecretKey(): string {
  return (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.NEXT_STRIPE_SECRET_KEY ||
    ''
  ).trim()
}

function getStripeClient(): Stripe {
  const secret = stripeSecretKey()
  if (!secret) throw new Error('Falta STRIPE_SECRET_KEY para sincronizar promociones con Stripe.')
  return new Stripe(secret)
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
  try {
    const stripe = getStripeClient()
    await ensureStripePromotionCode({
      stripe,
      code,
      discountPercentage: discount,
      promotionId: String(inserted.id),
      isActive: false,
    })
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : 'Error al sincronizar promoción en Stripe.'
    return { ok: false, error: message }
  }
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
  try {
    const stripe = getStripeClient()
    await ensureStripePromotionCode({
      stripe,
      code,
      discountPercentage: discount,
      promotionId: String(updated.id),
      isActive: Boolean(updated.is_active),
    })
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : 'Error al sincronizar promoción en Stripe.'
    return { ok: false, error: message }
  }
  revalidatePath('/admin/promotions')
  revalidatePath('/checkout')
  revalidatePath('/')
  return { ok: true, promotion: updated as PromotionRow }
}

export async function togglePromotionActive(
  id: string,
  status: boolean,
): Promise<{ ok: true; promotion: PromotionRow } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { data, error } = await sb
    .from('promotions')
    .update({ is_active: status })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return { ok: false, error: error.message }
  try {
    const stripe = getStripeClient()
    await ensureStripePromotionCode({
      stripe,
      code: String(data.code),
      discountPercentage: Number(data.discount_percentage),
      promotionId: String(data.id),
      isActive: status,
    })
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : 'Error al sincronizar activación en Stripe.'
    return { ok: false, error: message }
  }
  revalidatePath('/admin/promotions')
  revalidatePath('/checkout')
  revalidatePath('/')
  return { ok: true, promotion: data as PromotionRow }
}

export async function deletePromotion(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { data: existingPromotion, error: fetchError } = await sb
    .from('promotions')
    .select('code')
    .eq('id', id)
    .maybeSingle()
  if (fetchError) return { ok: false, error: fetchError.message }
  const { error } = await sb.from('promotions').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  try {
    const stripe = getStripeClient()
    await disableStripePromotionCodesByCode({
      stripe,
      code: String(existingPromotion?.code ?? ''),
    })
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : 'Error al desactivar promoción en Stripe.'
    return { ok: false, error: message }
  }
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
