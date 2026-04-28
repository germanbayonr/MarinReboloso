import Stripe from 'stripe'

interface EnsureStripePromotionInput {
  stripe: Stripe
  code: string
  discountPercentage: number
  promotionId?: string | null
  isActive?: boolean
}

function normalizePromoCode(value: string): string {
  return String(value || '').trim().toUpperCase()
}

function isSameDiscount({
  stripeCoupon,
  discountPercentage,
}: {
  stripeCoupon: Stripe.Coupon
  discountPercentage: number
}): boolean {
  return Number(stripeCoupon.percent_off ?? 0) === Number(discountPercentage)
}

async function resolvePromotionCodeCoupon(stripe: Stripe, stripePromotionCode: Stripe.PromotionCode): Promise<Stripe.Coupon | null> {
  const couponId = typeof stripePromotionCode.coupon === 'string' ? stripePromotionCode.coupon : stripePromotionCode.coupon.id
  if (!couponId) return null
  return stripe.coupons.retrieve(couponId)
}

export async function ensureStripePromotionCode({
  stripe,
  code,
  discountPercentage,
  promotionId,
  isActive = true,
}: EnsureStripePromotionInput): Promise<string> {
  const normalizedCode = normalizePromoCode(code)
  if (!normalizedCode) throw new Error('Código de promoción vacío.')

  const existingPromotionCodes = await stripe.promotionCodes.list({
    code: normalizedCode,
    limit: 100,
  })

  let matchingPromotionCode: Stripe.PromotionCode | null = null

  for (const stripePromotionCode of existingPromotionCodes.data) {
    const stripeCoupon = await resolvePromotionCodeCoupon(stripe, stripePromotionCode)
    if (!stripeCoupon) continue
    if (!isSameDiscount({ stripeCoupon, discountPercentage })) continue
    matchingPromotionCode = stripePromotionCode
    break
  }

  if (matchingPromotionCode) {
    if (matchingPromotionCode.active !== isActive) {
      const updated = await stripe.promotionCodes.update(matchingPromotionCode.id, {
        active: isActive,
        metadata: {
          ...(matchingPromotionCode.metadata ?? {}),
          supabase_promotion_id: promotionId ?? '',
        },
      })
      return updated.id
    }
    return matchingPromotionCode.id
  }

  for (const stripePromotionCode of existingPromotionCodes.data) {
    if (!stripePromotionCode.active) continue
    await stripe.promotionCodes.update(stripePromotionCode.id, { active: false })
  }

  const stripeCoupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: 'once',
    name: `Promo ${normalizedCode}`,
    metadata: {
      supabase_promotion_id: promotionId ?? '',
    },
  })

  const createdPromotionCode = await stripe.promotionCodes.create({
    code: normalizedCode,
    coupon: stripeCoupon.id,
    active: isActive,
    metadata: {
      supabase_promotion_id: promotionId ?? '',
    },
  })

  return createdPromotionCode.id
}

export async function disableStripePromotionCodesByCode({
  stripe,
  code,
}: {
  stripe: Stripe
  code: string
}): Promise<void> {
  const normalizedCode = normalizePromoCode(code)
  if (!normalizedCode) return
  const promotionCodes = await stripe.promotionCodes.list({ code: normalizedCode, limit: 100 })
  for (const stripePromotionCode of promotionCodes.data) {
    if (!stripePromotionCode.active) continue
    await stripe.promotionCodes.update(stripePromotionCode.id, { active: false })
  }
}
