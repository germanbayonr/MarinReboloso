import { z } from 'zod'

export const checkoutSchema = z.object({
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono requerido'),

  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellidos requeridos'),
  address1: z.string().min(1, 'Dirección requerida'),
  address2: z.string().optional(),
  city: z.string().min(1, 'Población requerida'),
  province: z.string().min(1, 'Provincia requerida'),
  postalCode: z.string().min(5, 'CP inválido'),
  country: z.string().min(1, 'País requerido'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
