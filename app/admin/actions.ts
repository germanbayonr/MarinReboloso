'use server'

import Stripe from 'stripe'
import { allImageUrlsFromDatabase, imageUrlFirstFromDatabase, imageUrlsForDatabaseColumn } from '@/lib/admin/product-image-db'
import { archiveStripeProduct } from '@/lib/admin/archive-stripe-product'
import { removeProductImagesFromSupabaseStorage } from '@/lib/admin/remove-product-storage-images'
import { normalizeProductCollectionInput } from '@/lib/admin/product-collections'
import { getAllowedCollectionSlugs } from '@/lib/collections'
import { ensureAdminOrRedirect, getServiceSupabase, getServiceSupabaseSafe, withAdminServiceSupabase, assertAdminMutationContext } from '@/lib/admin/server'
import { productMutationErrorResult } from '@/lib/admin/product-mutation-errors'
import { runAdminDeleteProduct, runAdminDeleteProducts } from '@/lib/admin/product-delete-server'
import { runAdminDeleteOrder, runAdminUpdateOrderStatus } from '@/lib/admin/order-status-server'
import { stripeSecretKey } from '@/lib/admin/stripe-secret-key'
import { computeFinalPrice } from '@/lib/pricing'
import { flattenVariantItemsGalleryUrls, normalizeVariantsForSave } from '@/lib/product-variants'
import { mapProductRow } from '@/lib/admin/map-product'
import { ensureStripePriceForProduct } from '@/lib/stripe-ensure-product-price'
import { uploadOptimizedAdminImages } from '@/lib/admin/upload-optimized-admin-images'
import { insertProductRow, updateProductRow } from '@/lib/admin/product-db-write'
import { loadAdminProductsForPanel } from '@/lib/admin/load-admin-products'
import { loadAdminOrdersForPanel } from '@/lib/admin/load-admin-orders'
import { ORDER_STATUSES, type AdminCustomer, type AdminOrder, type AdminOrderStatusPayload, type AdminProduct, type OrderStatus } from '@/lib/admin/types'
import { buildOrderLinesForEmail } from '@/lib/mail/build-order-email-lines'
import { TEST_EMAIL_TO } from '@/lib/admin/test-email-config'
import { sendMareboMailResult } from '@/lib/mail/send'
import { checkoutNameFromStripeSession, customerPhoneFromStripeSession } from '@/lib/stripe-session-customer'
import { getMailTransporter } from '@/lib/mail/transporter'
import { getOrderConfirmationTemplate, getOrderEmailSubject } from '@/lib/mail/templates'
import { getPublicSiteBaseUrl } from '@/lib/mail/site-url'
import { revalidateCatalogPaths, revalidateStorefrontCatalogPaths } from '@/lib/admin/revalidate-catalog'
import { runCreateProduct } from '@/lib/admin/create-product-server'
import { runSyncProductsWithStripe, type StripeSyncFailedItem } from '@/lib/admin/stripe-products-sync-server'
import { runSyncOrdersFromStripe } from '@/lib/admin/stripe-orders-sync-server'
import { logAdminSupabaseIssue } from '@/lib/admin/supabase-admin-log'

async function normalizeCollectionForProduct(raw: string | null | undefined): Promise<string | null> {
  const allowed = await getAllowedCollectionSlugs()
  return normalizeProductCollectionInput(raw, allowed)
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

interface StripeProductForMatch {
  id: string
  name: string
  description: string | null
  defaultPriceId: string | null
}

interface StripeLinkResult {
  stripeProductId: string
  stripePriceId: string
}

function normalizeProductNameForMatch(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildBigrams(raw: string): Set<string> {
  if (raw.length < 2) return new Set([raw])
  const output = new Set<string>()
  for (let index = 0; index < raw.length - 1; index += 1) {
    output.add(raw.slice(index, index + 2))
  }
  return output
}

function stringSimilarity(left: string, right: string): number {
  if (!left || !right) return 0
  if (left === right) return 1
  if (left.includes(right) || right.includes(left)) return 0.95
  const leftBigrams = buildBigrams(left)
  const rightBigrams = buildBigrams(right)
  const intersectionCount = Array.from(leftBigrams).filter((item) => rightBigrams.has(item)).length
  return (2 * intersectionCount) / (leftBigrams.size + rightBigrams.size)
}

function priceIdFromStripeProduct(product: Stripe.Product): string | null {
  if (!product.default_price) return null
  if (typeof product.default_price === 'string') return product.default_price
  if (typeof product.default_price === 'object' && 'id' in product.default_price) return product.default_price.id
  return null
}

async function listAllActiveStripeProducts(stripe: Stripe): Promise<StripeProductForMatch[]> {
  const output: StripeProductForMatch[] = []
  let startingAfter: string | undefined
  while (true) {
    const page = await stripe.products.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.default_price'],
    })
    for (const product of page.data) {
      const name = product.name?.trim()
      if (!name) continue
      output.push({
        id: product.id,
        name,
        description: product.description?.trim() || null,
        defaultPriceId: priceIdFromStripeProduct(product),
      })
    }
    if (!page.has_more) break
    startingAfter = page.data[page.data.length - 1]?.id
    if (!startingAfter) break
  }
  return output
}

function findStripeProductMatch({
  supabaseProductName,
  stripeProducts,
}: {
  supabaseProductName: string
  stripeProducts: StripeProductForMatch[]
}): { ok: true; product: StripeProductForMatch } | { ok: false; reason: string } {
  const normalizedSupabaseName = normalizeProductNameForMatch(supabaseProductName)
  if (!normalizedSupabaseName) return { ok: false, reason: 'Nombre vacío o inválido para comparar.' }

  const exactMatches = stripeProducts.filter(
    (stripeProduct) => normalizeProductNameForMatch(stripeProduct.name) === normalizedSupabaseName,
  )
  if (exactMatches.length === 1) return { ok: true, product: exactMatches[0] }
  if (exactMatches.length > 1) {
    return { ok: false, reason: 'Nombres ambiguos en Stripe (varias coincidencias exactas).' }
  }

  const candidateMatches = stripeProducts
    .map((stripeProduct) => ({
      product: stripeProduct,
      similarity: stringSimilarity(normalizedSupabaseName, normalizeProductNameForMatch(stripeProduct.name)),
    }))
    .filter((item) => item.similarity >= 0.9)
    .sort((left, right) => right.similarity - left.similarity)

  const bestMatch = candidateMatches[0]
  if (!bestMatch) return { ok: false, reason: 'No se encontró match aceptable por nombre.' }

  const secondBestMatch = candidateMatches[1]
  if (secondBestMatch && bestMatch.similarity - secondBestMatch.similarity < 0.03) {
    return { ok: false, reason: 'Nombres parecidos en Stripe pero ambiguos.' }
  }
  return { ok: true, product: bestMatch.product }
}

async function createStripeProductAndPrice({
  stripe,
  name,
  description,
  imageUrl,
  amountEur,
}: {
  stripe: Stripe
  name: string
  description: string | null
  imageUrl: string | null
  amountEur: number
}): Promise<StripeLinkResult> {
  const unitAmount = Math.round(amountEur * 100)
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error('Precio no válido para crear Stripe Price.')
  }
  const stripeProduct = await stripe.products.create({
    name,
    description: description?.trim() || undefined,
    images: imageUrl?.trim() ? [imageUrl.trim()] : undefined,
    active: true,
  })
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    currency: 'eur',
    unit_amount: unitAmount,
    recurring: undefined,
  })
  await stripe.products.update(stripeProduct.id, { default_price: stripePrice.id })
  return {
    stripeProductId: stripeProduct.id,
    stripePriceId: stripePrice.id,
  }
}

async function ensureOneTimePriceForStripeProduct({
  stripe,
  stripeProductId,
  currentPriceId,
  amountEur,
}: {
  stripe: Stripe
  stripeProductId: string
  currentPriceId: string | null
  amountEur: number
}): Promise<string> {
  const expectedUnitAmount = Math.round(amountEur * 100)
  if (!Number.isFinite(expectedUnitAmount) || expectedUnitAmount <= 0) {
    throw new Error('Precio no válido para Stripe.')
  }

  if (currentPriceId) {
    try {
      const current = await stripe.prices.retrieve(currentPriceId)
      if (
        current.active &&
        current.currency === 'eur' &&
        !current.recurring &&
        current.unit_amount === expectedUnitAmount
      ) {
        await stripe.products.update(stripeProductId, { default_price: currentPriceId, active: true })
        return currentPriceId
      }
    } catch {
      // Continuar: buscar o crear precio puntual
    }
  }

  const listed = await stripe.prices.list({ product: stripeProductId, active: true, limit: 100 })
  const matching = listed.data.find(
    (price) =>
      price.currency === 'eur' && !price.recurring && price.unit_amount === expectedUnitAmount,
  )
  if (matching) {
    await stripe.products.update(stripeProductId, { default_price: matching.id, active: true })
    return matching.id
  }

  const freshPrice = await stripe.prices.create({
    product: stripeProductId,
    currency: 'eur',
    unit_amount: expectedUnitAmount,
  })
  await stripe.products.update(stripeProductId, { default_price: freshPrice.id, active: true })
  return freshPrice.id
}

async function findOrCreateStripeProductLink({
  stripe,
  stripeProducts,
  name,
  description,
  imageUrl,
  amountEur,
}: {
  stripe: Stripe
  stripeProducts: StripeProductForMatch[]
  name: string
  description: string | null
  imageUrl: string | null
  amountEur: number
}): Promise<StripeLinkResult> {
  const matchResult = findStripeProductMatch({ supabaseProductName: name, stripeProducts })
  if (matchResult.ok) {
    const ensuredOneTimePriceId = await ensureOneTimePriceForStripeProduct({
      stripe,
      stripeProductId: matchResult.product.id,
      currentPriceId: matchResult.product.defaultPriceId,
      amountEur,
    })
    return { stripeProductId: matchResult.product.id, stripePriceId: ensuredOneTimePriceId }
  }
  if (matchResult.reason.includes('ambiguos')) {
    throw new Error(matchResult.reason)
  }

  const createdStripeLink = await createStripeProductAndPrice({
    stripe,
    name,
    description,
    imageUrl,
    amountEur,
  })

  stripeProducts.push({
    id: createdStripeLink.stripeProductId,
    name,
    description: description?.trim() || null,
    defaultPriceId: createdStripeLink.stripePriceId,
  })

  return createdStripeLink
}

function shippingBlockFromStripeSession(session: Stripe.Checkout.Session) {
  const s = session as Stripe.Checkout.Session & {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null }
    shipping?: { name?: string | null; address?: Stripe.Address | null }
  }
  return s.shipping_details ?? s.shipping ?? null
}

function normalizeNullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function shippingFieldsFromStripeSession(session: Stripe.Checkout.Session) {
  const block = shippingBlockFromStripeSession(session)
  const addr = block?.address
  return {
    shipping_address: addr?.line1?.trim() || null,
    shipping_city: addr?.city?.trim() || null,
    shipping_postal_code: addr?.postal_code?.trim() || null,
    shipping_country: addr?.country?.trim() || null,
  }
}

export async function adminGetProducts(): Promise<AdminProduct[]> {
  return withAdminServiceSupabase(async (sb) => loadAdminProductsForPanel(sb))
}

export type ProductInput = {
  name: string
  description: string | null
  category: string
  /** Slug permitido o null (sin colección) */
  collection: string | null
  image_url: string | null
  /** Varias URLs para la columna Postgres `text[]`; si se omite, se usa solo `image_url`. */
  image_urls?: string[] | null
  is_new_arrival: boolean
  in_stock: boolean
  original_price: number
  discount_percent: number
  has_variants?: boolean
  variants?: import('@/lib/product-variants').ProductVariantsData
}

export async function updateProduct(id: string, input: ProductInput) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const sb = ctx.sb
  const price = computeFinalPrice(input.original_price, input.discount_percent)
  const collection = await normalizeCollectionForProduct(input.collection)
  const normalizedVariants =
    input.has_variants && input.variants
      ? normalizeVariantsForSave(input.variants)
      : { colors: [], sizes: [], items: [] }
  const hasVariants = Boolean(input.has_variants && normalizedVariants.items.length)
  const variantImages = hasVariants ? flattenVariantItemsGalleryUrls(normalizedVariants.items) : []
  const imageInput = hasVariants && variantImages.length
    ? { image_url: variantImages[0], image_urls: variantImages }
    : input
  const writePayload = {
    name: input.name,
    description: input.description,
    category: input.category,
    collection,
    image_url: imageUrlsForDatabaseColumn(imageInput),
    is_new_arrival: input.is_new_arrival,
    in_stock: input.in_stock,
    original_price: input.original_price,
    discount_percent: input.discount_percent,
    price,
    has_variants: hasVariants,
    variants: hasVariants ? normalizedVariants : { colors: [], sizes: [], items: [] },
  }
  const { data, error } = await updateProductRow(sb, id, writePayload)
  if (error) return productMutationErrorResult('update', error.message)

  const row = (data ?? {}) as Record<string, unknown>
  const secret = stripeSecretKey()
  if (secret) {
    try {
      const stripe = new Stripe(secret)
      await ensureStripePriceForProduct({
        stripe,
        supabase: sb,
        product: {
          id: String(row.id),
          name: input.name.trim(),
          price,
          description: input.description,
          stripe_product_id: (row.stripe_product_id as string) ?? null,
          stripe_price_id: (row.stripe_price_id as string) ?? null,
          image_url: row.image_url,
        },
      })
    } catch (syncError) {
      logAdminSupabaseIssue('STRIPE_SYNC_FAILED', 'Producto actualizado en Supabase pero falló sync Stripe.', {
        supabaseMessage: syncError instanceof Error ? syncError.message : String(syncError),
      })
    }
  }

  revalidateCatalogPaths(collection)
  return { ok: true as const, product: mapProductRow(row) }
}

/** Sincroniza galería: borra ficheros en Storage, actualiza BD y opcionalmente imagen en Stripe. */
export async function syncProductGallery(
  productId: string,
  input: {
    image_urls: string[]
    removed_urls: string[]
    /** true solo si se eliminó al menos una imagen y se añadió otra nueva */
    update_stripe_image: boolean
  },
) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const sb = ctx.sb
  const id = String(productId ?? '').trim()
  if (!id) return { ok: false as const, error: 'ID de producto inválido' }

  const { data: row, error: fetchErr } = await sb
    .from('products')
    .select('id,collection,stripe_product_id')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) return { ok: false as const, error: fetchErr.message }
  if (!row) return { ok: false as const, error: 'Producto no encontrado' }

  const removed = [...new Set(input.removed_urls.map((u) => u.trim()).filter(Boolean))]
  if (removed.length > 0) {
    const rm = await removeProductImagesFromSupabaseStorage(sb, removed)
    if (!rm.ok) {
      return { ok: false as const, error: `No se pudieron borrar las imágenes en Storage: ${rm.error}` }
    }
  }

  const urls = input.image_urls.map((u) => String(u).trim()).filter(Boolean)
  const imageColumn = imageUrlsForDatabaseColumn({
    image_url: urls[0] ?? null,
    image_urls: urls,
  })

  const { data, error } = await updateProductRow(sb, id, { image_url: imageColumn })
  if (error) return productMutationErrorResult('update', error.message)

  const mappedRow = (data ?? {}) as Record<string, unknown>
  const collection = (row.collection as string | null) ?? null

  if (input.update_stripe_image) {
    const stripeProductId = String(row.stripe_product_id ?? '').trim()
    const secret = stripeSecretKey()
    if (stripeProductId && secret) {
      try {
        const stripe = new Stripe(secret)
        const primary = imageUrlFirstFromDatabase(imageColumn)
        await stripe.products.update(stripeProductId, {
          images: primary ? [primary] : [],
        })
      } catch (syncError) {
        logAdminSupabaseIssue('STRIPE_SYNC_FAILED', 'Galería actualizada pero falló sync de imagen Stripe.', {
          supabaseMessage: syncError instanceof Error ? syncError.message : String(syncError),
        })
      }
    }
  }

  revalidateCatalogPaths(collection)
  return { ok: true as const, product: mapProductRow(mappedRow) }
}

export async function deleteProduct(id: string) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const deleted = await runAdminDeleteProduct(ctx.sb, id)
  if (!deleted.ok) return deleted
  revalidateCatalogPaths()
  return { ok: true as const }
}

export async function deleteProducts(ids: string[]) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const result = await runAdminDeleteProducts(ctx.sb, ids)
  if (!result.ok) return result
  if (result.deletedCount > 0) revalidateCatalogPaths()
  return { ok: true as const, deletedCount: result.deletedCount, failures: result.failures }
}

export async function createProduct(input: ProductInput) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  const result = await runCreateProduct(ctx.sb, input)
  if (!result.ok) return result
  revalidateStorefrontCatalogPaths(input.collection)
  return { ok: true as const, id: result.id }
}

export async function syncProductsWithStripe(): Promise<{
  success: boolean
  syncedCount: number
  failedSyncs: StripeSyncFailedItem[]
}> {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) {
    return { success: false, syncedCount: 0, failedSyncs: [{ name: 'Sistema', reason: ctx.error }] }
  }
  const result = await runSyncProductsWithStripe(ctx.sb)
  if (result.syncedCount > 0) revalidateStorefrontCatalogPaths()
  return result
}

function parseFormBoolean(value: FormDataEntryValue | null): boolean {
  if (value == null) return false
  const s = String(value).toLowerCase()
  return s === 'true' || s === '1' || s === 'on'
}

async function uploadFilesToProductImagesBucket(
  sb: ReturnType<typeof getServiceSupabase>,
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  return uploadOptimizedAdminImages(sb, files, 'products')
}

/**
 * Crea un producto subiendo las imágenes con **service_role** (evita RLS de Storage en el navegador).
 * Requiere `SUPABASE_SERVICE_ROLE_KEY` y la misma URL de proyecto que en el cliente.
 */
export async function createProductWithImages(
  formData: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const sb = ctx.sb

  const files = formData.getAll('images').filter((x): x is File => x instanceof File && x.size > 0)
  if (files.length === 0) return { ok: false, error: 'Sube al menos una imagen' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { ok: false, error: 'El nombre es obligatorio' }

  const originalPriceRaw = String(formData.get('original_price') ?? '')
  const original_price = Number(originalPriceRaw)
  if (!Number.isFinite(original_price) || original_price < 0) {
    return { ok: false, error: 'Introduce un precio original válido' }
  }

  const discount_percent = Math.min(100, Math.max(0, Number(formData.get('discount_percent')) || 0))
  const descriptionRaw = String(formData.get('description') ?? '').trim()
  const description = descriptionRaw || null
  const category = String(formData.get('category') ?? 'pendientes').trim() || 'pendientes'
  const collectionRaw = String(formData.get('collection') ?? '').trim()
  const collection = collectionRaw || null

  const uploadResult = await uploadFilesToProductImagesBucket(sb, files)
  if (!uploadResult.ok) return uploadResult
  const imageUrls = uploadResult.urls

  return createProduct({
    name,
    description,
    category,
    collection,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    is_new_arrival: parseFormBoolean(formData.get('is_new_arrival')),
    in_stock: parseFormBoolean(formData.get('in_stock')),
    original_price,
    discount_percent,
  })
}

export async function adminUploadProductImages(formData: FormData): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const sb = ctx.sb
  const files = formData.getAll('images').filter((x): x is File => x instanceof File && x.size > 0)
  if (files.length === 0) return { ok: false, error: 'Selecciona al menos una imagen' }
  return uploadFilesToProductImagesBucket(sb, files)
}

export const adminUpdateProduct = updateProduct
export const adminSyncProductGallery = syncProductGallery
export const adminDeleteProduct = deleteProduct
export const adminDeleteProducts = deleteProducts
export const adminCreateProduct = createProduct
export const adminCreateProductWithImages = createProductWithImages
export const adminSyncProductsWithStripe = syncProductsWithStripe

export async function adminGetOrders(): Promise<AdminOrder[]> {
  return withAdminServiceSupabase(async (sb) => loadAdminOrdersForPanel(sb))
}

type AdminStripeSyncInput = {
  daysBack?: number
}

type AdminStripeSyncResult =
  | {
      ok: true
      scannedSessions: number
      eligibleSessions: number
      existingSessions: number
      importedCount: number
      skippedNoLineItems: number
      importedOrders: AdminOrder[]
    }
  | { ok: false; error: string }

export async function adminSyncOrdersFromStripe(input?: AdminStripeSyncInput): Promise<AdminStripeSyncResult> {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  return runSyncOrdersFromStripe(ctx.sb, input)
}

export async function adminDeleteOrder(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  return runAdminDeleteOrder(ctx.sb, id)
}

function shortOrderRef(orderId: string) {
  return orderId.replace(/-/g, '').slice(0, 10).toUpperCase()
}

export async function adminUpdateOrderStatus(
  id: string,
  status: OrderStatus,
  payload?: AdminOrderStatusPayload,
) {
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false as const, error: ctx.error }
  return runAdminUpdateOrderStatus(ctx.sb, id, status, payload)
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
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const sb = ctx.sb
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
  const ctx = await assertAdminMutationContext()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const sb = ctx.sb
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
      customer_phone: '+34623781628',
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

  if (!mail.ok) {
    console.error('[admin] simulateRealPurchase mail:', mail.error)
    return { ok: false, error: `Pedido creado (${orderRef}), pero el correo falló: ${mail.error}` }
  }

  return { ok: true }
}
