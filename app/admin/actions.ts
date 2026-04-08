'use server'

import { revalidatePath } from 'next/cache'
import { normalizeProductCollectionInput } from '@/lib/admin/product-collections'
import { ensureAdminOrRedirect, getServiceSupabase } from '@/lib/admin/server'
import {
  isLikelyRowLevelSecurityMessage,
  logAdminSupabaseIssue,
  RLS_BLOCK_USER_MESSAGE,
} from '@/lib/admin/supabase-admin-log'
import { computeFinalPrice } from '@/lib/pricing'
import { mapProductRow } from '@/lib/admin/map-product'
import { ORDER_STATUSES, type AdminCustomer, type AdminOrder, type AdminProduct, type OrderStatus } from '@/lib/admin/types'
import { buildOrderLinesForEmail } from '@/lib/mail/build-order-email-lines'
import { TEST_EMAIL_TO } from '@/lib/admin/test-email-config'
import { notifyCustomerOrderStatusChange } from '@/lib/mail/order-status-mail'
import { sendMareboMailResult } from '@/lib/mail/send'
import { getMailTransporter } from '@/lib/mail/transporter'
import { getOrderConfirmationTemplate, getOrderEmailSubject } from '@/lib/mail/templates'
import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'

function revalidateCatalogPaths() {
  revalidatePath('/admin')
  revalidatePath('/admin/productos')
  revalidatePath('/catalogo')
  revalidatePath('/')
}

function getServiceSupabaseForAction():
  | { ok: true; client: ReturnType<typeof getServiceSupabase> }
  | { ok: false; error: string } {
  try {
    return { ok: true, client: getServiceSupabase() }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Cliente Supabase (service role) no disponible.'
    return { ok: false, error: errorMessage }
  }
}

function productMutationErrorResult(
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
      hint: 'Con service_role no debería aplicarse RLS; revisar env en runtime, misma URL de proyecto y reinicio de dev server.',
    })
    return { ok: false as const, error: `${RLS_BLOCK_USER_MESSAGE}${rawMessage}` }
  }
  logAdminSupabaseIssue('PRODUCT_MUTATION_DB', `Error en products (${operation}).`, {
    operation,
    supabaseMessage: rawMessage,
  })
  return { ok: false as const, error: rawMessage }
}

/** `image_url` en Supabase puede ser string o array de URLs (JSON). */
function normalizeProductImageUrl(raw: unknown): string | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t || null
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') {
        const t = item.trim()
        if (t) return t
      }
    }
    return null
  }
  return null
}

export async function adminGetProducts(): Promise<AdminProduct[]> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { data, error } = await sb.from('products').select('*').order('name', { ascending: true }).limit(5000)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>))
}

export type ProductInput = {
  name: string
  description: string | null
  category: string
  /** Slug permitido o null (sin colección) */
  collection: string | null
  image_url: string | null
  is_new_arrival: boolean
  in_stock: boolean
  original_price: number
  discount_percent: number
}

export async function updateProduct(id: string, input: ProductInput) {
  await ensureAdminOrRedirect()
  const sup = getServiceSupabaseForAction()
  if (!sup.ok) return { ok: false as const, error: sup.error }
  const sb = sup.client
  const price = computeFinalPrice(input.original_price, input.discount_percent)
  const collection = normalizeProductCollectionInput(input.collection)
  const { error } = await sb
    .from('products')
    .update({
      name: input.name,
      description: input.description,
      category: input.category,
      collection,
      image_url: input.image_url,
      is_new_arrival: input.is_new_arrival,
      in_stock: input.in_stock,
      original_price: input.original_price,
      discount_percent: input.discount_percent,
      price,
    })
    .eq('id', id)
  if (error) return productMutationErrorResult('update', error.message)
  revalidateCatalogPaths()
  return { ok: true as const }
}

export async function deleteProduct(id: string) {
  await ensureAdminOrRedirect()
  const sup = getServiceSupabaseForAction()
  if (!sup.ok) return { ok: false as const, error: sup.error }
  const sb = sup.client
  const { error } = await sb.from('products').delete().eq('id', id)
  if (error) return productMutationErrorResult('delete', error.message)
  revalidateCatalogPaths()
  return { ok: true as const }
}

export async function createProduct(input: ProductInput) {
  await ensureAdminOrRedirect()
  const sup = getServiceSupabaseForAction()
  if (!sup.ok) return { ok: false as const, error: sup.error }
  const sb = sup.client
  const price = computeFinalPrice(input.original_price, input.discount_percent)
  const collection = normalizeProductCollectionInput(input.collection)
  const { data, error } = await sb
    .from('products')
    .insert({
      name: input.name,
      description: input.description,
      category: input.category,
      collection,
      image_url: input.image_url,
      is_new_arrival: input.is_new_arrival,
      in_stock: input.in_stock,
      is_active: true,
      original_price: input.original_price,
      discount_percent: input.discount_percent,
      price,
      stripe_product_id: null,
      stripe_price_id: null,
    })
    .select('id')
    .single()
  if (error) return productMutationErrorResult('create', error.message)
  revalidateCatalogPaths()
  return { ok: true as const, id: data.id as string }
}

export async function adminSetProductStock(id: string, in_stock: boolean) {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { error } = await sb.from('products').update({ in_stock }).eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidateCatalogPaths()
  return { ok: true as const }
}

/** Visible en la web (listados y ficha). Independiente de `in_stock` (pausa vs. «sin stock»). */
export async function adminSetProductCatalogVisible(id: string, is_active: boolean) {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { error } = await sb.from('products').update({ is_active }).eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidateCatalogPaths()
  return { ok: true as const }
}

export const adminUpdateProduct = updateProduct
export const adminDeleteProduct = deleteProduct
export const adminCreateProduct = createProduct

export async function adminGetOrders(): Promise<AdminOrder[]> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []) as AdminOrder[]
}

function shortOrderRef(orderId: string) {
  return orderId.replace(/-/g, '').slice(0, 10).toUpperCase()
}

/** Datos de envío al pasar a «Enviado» (obligatorio en el modal del admin). */
export type AdminOrderStatusPayload = {
  shippingCarrier?: 'correos' | 'packlink'
  trackingNumber?: string | null
  packlinkUrl?: string | null
}

export async function adminUpdateOrderStatus(
  id: string,
  status: OrderStatus,
  payload?: AdminOrderStatusPayload,
) {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false as const, error: 'Estado no válido' }
  }

  if (status === 'enviado') {
    const carrier = payload?.shippingCarrier
    if (carrier !== 'correos' && carrier !== 'packlink') {
      return { ok: false as const, error: 'Selecciona Correos o Packlink para el envío.' }
    }
    if (carrier === 'correos') {
      const t = payload?.trackingNumber?.trim()
      if (!t) {
        return { ok: false as const, error: 'Indica el número de seguimiento de Correos.' }
      }
    }
    if (carrier === 'packlink') {
      const u = payload?.packlinkUrl?.trim()
      if (!u) {
        return { ok: false as const, error: 'Indica el enlace de seguimiento de Packlink.' }
      }
      try {
        new URL(u)
      } catch {
        return { ok: false as const, error: 'El enlace de Packlink no es una URL válida.' }
      }
    }
  }

  const { data: row, error: fetchErr } = await sb.from('orders').select('*').eq('id', id).maybeSingle()
  if (fetchErr) return { ok: false as const, error: fetchErr.message }
  if (!row) return { ok: false as const, error: 'Pedido no encontrado' }

  const previous = String((row as { status?: string }).status ?? '')
  if (previous === status) {
    revalidatePath('/admin/pedidos')
    return { ok: true as const }
  }

  const patch: Record<string, unknown> = { status }
  if (status === 'enviado' && payload?.shippingCarrier) {
    patch.shipping_carrier = payload.shippingCarrier
    if (payload.shippingCarrier === 'correos') {
      patch.tracking_number = payload.trackingNumber?.trim() ?? null
      patch.packlink_url = null
    } else {
      patch.packlink_url = payload.packlinkUrl?.trim() ?? null
      patch.tracking_number = null
    }
  }

  const { error } = await sb.from('orders').update(patch).eq('id', id)
  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/admin/pedidos')

  const { data: refreshed, error: refetchErr } = await sb.from('orders').select('*').eq('id', id).maybeSingle()
  if (refetchErr || !refreshed) {
    console.warn('[admin] adminUpdateOrderStatus: no se pudo releer el pedido tras UPDATE', refetchErr?.message)
    return { ok: true as const }
  }

  const customer_email =
    typeof refreshed.customer_email === 'string' ? refreshed.customer_email.trim() : ''

  console.log('Intentando enviar correo a:', customer_email || '(vacío)', 'Nuevo estado:', status)

  if (!customer_email || !customer_email.includes('@')) {
    console.warn('No se puede enviar correo: El pedido no tiene email asociado')
    return { ok: true as const }
  }

  const orderForMail = refreshed as AdminOrder

  try {
    await notifyCustomerOrderStatusChange(orderForMail, status)
  } catch (error) {
    console.error('🚨 ERROR NODEMAILER AL CAMBIAR ESTADO:', error)
  }

  return { ok: true as const }
}

export async function adminGetCustomers(): Promise<AdminCustomer[]> {
  await ensureAdminOrRedirect()
  const sb = getServiceSupabase()
  const { data, error } = await sb
    .from('customers')
    .select('id, first_name, last_name, email, phone, shipping_address, created_at')
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) throw new Error(error.message)
  return (data ?? []) as AdminCustomer[]
}

/** Inserta un pedido de prueba en Supabase, revalida el panel y envía el correo de confirmación (120 €). */
export async function sendTestEmail(): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()

  const sb = getServiceSupabase()
  const { data: catalog, error: catErr } = await sb
    .from('products')
    .select('id,name,price,image_url')
    .eq('is_active', true)
    .eq('in_stock', true)
    .limit(60)

  if (catErr) {
    console.error('[admin] sendTestEmail catálogo:', catErr)
    return { ok: false, error: catErr.message }
  }
  if (!catalog?.length) {
    return { ok: false, error: 'No hay productos activos en el catálogo para montar el email de prueba.' }
  }

  const picked = catalog.slice(0, 2)
  const sampleItems = picked.map((p: Record<string, unknown>) => {
    const raw = p.price
    const price = typeof raw === 'number' ? raw : Number(raw)
    const line = Number.isFinite(price) ? price : 0
    return {
      id: String(p.id),
      name: String(p.name ?? ''),
      quantity: 1,
      line_total: line,
      image_url: normalizeProductImageUrl(p.image_url),
    }
  })
  const totalAmount = sampleItems.reduce((s, i) => s + (i.line_total as number), 0)

  const { data: inserted, error: insertError } = await sb
    .from('orders')
    .insert({
      customer_name: 'Juan Prueba',
      customer_email: TEST_EMAIL_TO,
      total_amount: totalAmount,
      status: 'pendiente',
      currency: 'eur',
      line_summary: sampleItems.map((i) => `1× ${i.name}`).join(' · '),
      items_json: sampleItems,
      stripe_session_id: null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[admin] sendTestEmail insert:', insertError)
    return { ok: false, error: insertError.message }
  }

  const orderId = String(inserted?.id ?? '')
  const orderRef = orderId ? shortOrderRef(orderId) : 'TEST'

  revalidatePath('/admin')
  revalidatePath('/admin/pedidos')

  const { data: orderRow, error: readErr } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (readErr || !orderRow) {
    console.error('[admin] sendTestEmail read order:', readErr)
    return { ok: false, error: readErr?.message ?? 'No se pudo leer el pedido insertado.' }
  }

  const siteUrl = getPublicSiteBaseUrl()
  const pack = await buildOrderLinesForEmail(orderRow as AdminOrder)
  const html = getOrderConfirmationTemplate({
    customerName: 'Juan Prueba',
    siteUrl,
    orderId: orderId || '',
    orderRef,
    ...pack,
  })

  const transport = getMailTransporter()
  if (!transport) {
    const msg = 'SMTP no configurado: faltan SMTP_USER o SMTP_PASSWORD'
    console.error('[mail] sendTestEmail:', msg)
    return { ok: false, error: msg }
  }

  const from = process.env.SMTP_USER?.trim()
  const fromName = process.env.SMTP_FROM_NAME?.trim() || 'Marebo'
  if (!from) {
    console.error('[mail] sendTestEmail: SMTP_USER vacío')
    return { ok: false, error: 'SMTP_USER vacío' }
  }

  try {
    await transport.sendMail({
      from: `"${fromName}" <${from}>`,
      to: TEST_EMAIL_TO,
      subject: `[TEST Marebo] ${getOrderEmailSubject('En preparación', 'Juan Prueba')}`,
      html,
    })
    return { ok: true }
  } catch (e: unknown) {
    console.error('[mail] sendTestEmail: envío fallido')
    console.error('[mail] sendTestEmail error (raw):', e)
    if (e instanceof Error) {
      console.error('[mail] sendTestEmail message:', e.message)
      console.error('[mail] sendTestEmail stack:', e.stack)
    }
    const nodemailerErr = e as { code?: string; command?: string; response?: string; responseCode?: number }
    if (nodemailerErr.code != null || nodemailerErr.response != null) {
      console.error('[mail] sendTestEmail nodemailer fields:', {
        code: nodemailerErr.code,
        command: nodemailerErr.command,
        responseCode: nodemailerErr.responseCode,
        response: nodemailerErr.response,
      })
    }
    const message =
      e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e)
    return { ok: false, error: message }
  }
}

/** Pedido de prueba: un producto activo aleatorio + correo con imagen real. */
export async function simulateRealPurchase(): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdminOrRedirect()

  const sb = getServiceSupabase()
  const { data: pool, error: poolErr } = await sb
    .from('products')
    .select('id,name,price,image_url')
    .eq('is_active', true)
    .eq('in_stock', true)
    .limit(200)

  if (poolErr) {
    console.error('[admin] simulateRealPurchase productos:', poolErr)
    return { ok: false, error: poolErr.message }
  }
  if (!pool?.length) {
    return { ok: false, error: 'No hay productos activos en el catálogo para simular.' }
  }

  const pick = pool[Math.floor(Math.random() * pool.length)] as Record<string, unknown>
  const priceEur = Number(pick.price)
  if (!Number.isFinite(priceEur) || priceEur <= 0) {
    return { ok: false, error: 'El producto elegido no tiene un precio válido.' }
  }

  const img = normalizeProductImageUrl(pick.image_url)
  const itemsJson = [
    {
      id: String(pick.id ?? ''),
      name: String(pick.name ?? ''),
      price: priceEur,
      line_total: priceEur,
      image_url: img,
    },
  ]

  const { data: inserted, error: insertError } = await sb
    .from('orders')
    .insert({
      customer_email: 'marebo.meri@gmail.com',
      customer_name: 'Cliente de Prueba',
      status: 'pendiente',
      total_amount: priceEur,
      currency: 'EUR',
      shipping_address: 'Calle de la Joya, 22',
      shipping_city: 'Sevilla',
      shipping_postal_code: '41001',
      shipping_country: 'España',
      line_summary: `1x ${String(pick.name ?? '')}`,
      items_json: itemsJson,
      stripe_session_id: null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[admin] simulateRealPurchase insert:', insertError)
    return { ok: false, error: insertError.message }
  }

  console.log('✅ Pedido insertado en DB')

  const orderId = String(inserted?.id ?? '')
  const orderRef = orderId ? shortOrderRef(orderId) : 'SIM'

  const { data: orderRow, error: readSimErr } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (readSimErr || !orderRow) {
    console.error('[admin] simulateRealPurchase read order:', readSimErr)
    return { ok: false, error: readSimErr?.message ?? 'No se pudo leer el pedido insertado.' }
  }

  const siteUrl = getPublicSiteBaseUrl()
  const pack = await buildOrderLinesForEmail(orderRow as AdminOrder)
  const html = getOrderConfirmationTemplate({
    customerName: 'Cliente de Prueba',
    siteUrl,
    orderId: orderId || '',
    orderRef,
    ...pack,
  })

  const mail = await sendMareboMailResult({
    to: 'marebo.meri@gmail.com',
    subject: `[TEST] ${getOrderEmailSubject('En preparación', 'Cliente de Prueba')}`,
    html,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/pedidos')

  if (!mail.ok) {
    console.error('[admin] simulateRealPurchase mail:', mail.error)
    return { ok: false, error: `Pedido creado (${orderRef}), pero el correo falló: ${mail.error}` }
  }

  return { ok: true }
}
