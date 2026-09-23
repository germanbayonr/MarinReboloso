import { z } from 'zod'
import { checkoutSchema } from '@/lib/validation/checkout'
import { normalizeCustomerPhone } from '@/lib/normalize-customer-phone'

export const checkoutCustomerApiSchema = checkoutSchema.pick({
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  address1: true,
  city: true,
  postalCode: true,
  country: true,
})

export type CheckoutCustomerApi = z.infer<typeof checkoutCustomerApiSchema>

export function parseCheckoutCustomerFromBody(body: unknown): CheckoutCustomerApi {
  if (!body || typeof body !== 'object') {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['phone'],
        message: 'Datos de contacto incompletos',
      },
    ])
  }
  return checkoutCustomerApiSchema.parse(body)
}

export function checkoutCustomerStripeMetadata(customer: CheckoutCustomerApi): Record<string, string> {
  const phone = normalizeCustomerPhone(customer.phone)
  if (!phone) {
    throw new Error('Teléfono no válido')
  }
  return {
    customer_phone: phone.slice(0, 500),
    customer_first_name: customer.firstName.trim().slice(0, 500),
    customer_last_name: customer.lastName.trim().slice(0, 500),
    customer_email: customer.email.trim().slice(0, 500),
    checkout_address1: customer.address1.trim().slice(0, 500),
    checkout_city: customer.city.trim().slice(0, 500),
    checkout_postal_code: customer.postalCode.trim().slice(0, 500),
    checkout_country: customer.country.trim().slice(0, 500),
  }
}
