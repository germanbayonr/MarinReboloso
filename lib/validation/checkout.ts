import { z } from 'zod'

export const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(3),
  country: z.string().min(1),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

