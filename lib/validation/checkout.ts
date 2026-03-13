import { z } from 'zod'

export const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address1: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(3),
  country: z.string().min(1),
  terms: z.boolean().refine((v) => v, { message: 'Debes aceptar los términos' }),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
