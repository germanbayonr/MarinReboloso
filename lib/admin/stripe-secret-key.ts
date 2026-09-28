/** Resuelve la secret key de Stripe desde variables de entorno habituales en Vercel/local. */
export function stripeSecretKey(): string {
  return (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    process.env.STRIPE_SECRET ||
    process.env.NEXT_STRIPE_SECRET_KEY ||
    ''
  ).trim()
}
