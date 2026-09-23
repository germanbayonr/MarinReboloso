import { z } from 'zod'
import { isValidCustomerPhone } from '@/lib/normalize-customer-phone'

export const checkoutSchema = z.object({
  email: z.string().trim().email('Email no válido'),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .refine((v) => isValidCustomerPhone(v), {
      message: 'Introduce un teléfono válido (mínimo 9 dígitos)',
    }),
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
  address1: z.string().trim().min(1, 'La dirección es obligatoria'),
  city: z.string().trim().min(1, 'La población es obligatoria'),
  postalCode: z.string().trim().min(3, 'Código postal no válido'),
  country: z.string().trim().min(1, 'El país es obligatorio'),
  terms: z.boolean().refine((v) => v, { message: 'Debes aceptar los términos' }),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
