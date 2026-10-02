import Stripe from 'stripe'

export interface StripeProductForMatch {
  id: string
  name: string
  description: string | null
  defaultPriceId: string | null
}

export interface StripeLinkResult {
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

export async function listAllActiveStripeProducts(stripe: Stripe): Promise<StripeProductForMatch[]> {
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
    (price) => price.currency === 'eur' && !price.recurring && price.unit_amount === expectedUnitAmount,
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

export async function findOrCreateStripeProductLink({
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
