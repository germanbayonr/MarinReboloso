'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'

export interface ProductVariant {
  colorName: string
  images: string[]
}

export interface Product {
  id: string
  name: string
  price: number
  sku: string
  stock: number
  status: 'published' | 'draft'
  category: string
  collection: string
  collectionSlug: string
  variants: ProductVariant[]
  createdAt: string
}

interface ProductsContextType {
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
}

const STORAGE_KEY = 'marebo_products_v2'

interface RawProduct {
  id: string
  name: string
  price: number
  sku: string
  stock: number
  status: 'published' | 'draft'
  category: string
  collection: string
  images: string[]
  createdAt: string
}

const INITIAL_RAW_PRODUCTS: RawProduct[] = [
  // --- COLECCIÓN DESCARÁ ---
  {
    id: 'd1',
    name: 'Pendientes Reina Isabela Marfil',
    price: 85,
    sku: 'DESC-001',
    stock: 10,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Reina%20Isabela%20Marfil.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd2',
    name: 'Pendientes Descará Córdoba Coral',
    price: 75,
    sku: 'DESC-002',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Cordoba%20Coral.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd3',
    name: 'Pendientes Descará Coral',
    price: 70,
    sku: 'DESC-003',
    stock: 12,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Coral.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd4',
    name: 'Pendientes Descará Dorados',
    price: 65,
    sku: 'DESC-004',
    stock: 15,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Dorados.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd5',
    name: 'Pendientes Descará Imperio',
    price: 90,
    sku: 'DESC-005',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Imperio.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd6',
    name: 'Pendientes Descará Pasión',
    price: 75,
    sku: 'DESC-006',
    stock: 10,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Pasion.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd7',
    name: 'Pendientes Descará Alhambra',
    price: 80,
    sku: 'DESC-007',
    stock: 7,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Alhambra.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd8',
    name: 'Pendientes Descará Córdoba',
    price: 75,
    sku: 'DESC-008',
    stock: 9,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Cordoba.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd9',
    name: 'Pendientes Descará Moneda',
    price: 60,
    sku: 'DESC-009',
    stock: 14,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Moneda.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd10',
    name: 'Pendientes Descará Cristal',
    price: 70,
    sku: 'DESC-010',
    stock: 11,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Cristal.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd11',
    name: 'Pendientes Descará Esmeralda',
    price: 85,
    sku: 'DESC-011',
    stock: 6,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Esmeralda.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd12',
    name: 'Pendientes Folklore Blancos',
    price: 55,
    sku: 'FOLK-001',
    stock: 20,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20blancos.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd13',
    name: 'Pendientes Folklore Fucsia',
    price: 55,
    sku: 'FOLK-002',
    stock: 18,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20fucsia.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd14',
    name: 'Pendientes Folklore Negros',
    price: 55,
    sku: 'FOLK-003',
    stock: 22,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20negros.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd15',
    name: 'Pendientes Folklore Turquesas',
    price: 55,
    sku: 'FOLK-004',
    stock: 16,
    status: 'published',
    category: 'pendientes',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20turquesas.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd16',
    name: 'Pulseras Folklore Fucsia',
    price: 35,
    sku: 'PUL-001',
    stock: 25,
    status: 'published',
    category: 'pulseras',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pulseras%20folklore%20fucsia.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd17',
    name: 'Pulseras Folklore Negras',
    price: 35,
    sku: 'PUL-002',
    stock: 30,
    status: 'published',
    category: 'pulseras',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pulseras%20Folklore%20negras.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'd18',
    name: 'Pulseras Folklore Turquesas',
    price: 35,
    sku: 'PUL-003',
    stock: 28,
    status: 'published',
    category: 'pulseras',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pulseras%20folklore%20turquesas.PNG'],
    createdAt: '2025-03-10',
  },

  // --- COLECCIÓN MAREBO ---
  {
    id: 'm1',
    name: 'Pendiente Flor MAREBO Doré',
    price: 95,
    sku: 'MARE-001',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Flor%20MAREBO%20Dore.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm2',
    name: 'Pendiente Flor Noir MAREBO Doré',
    price: 95,
    sku: 'MARE-002',
    stock: 6,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Flor%20Noir%20MAREBO%20Dore.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm3',
    name: 'Pendiente Flor Esmeralda',
    price: 95,
    sku: 'MARE-003',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Flor%20Esmeralda.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm4',
    name: 'Pendiente Triángulo Rubí',
    price: 80,
    sku: 'MARE-004',
    stock: 10,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Triangulo%20Rubi.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm5',
    name: 'Pendiente Triángulo Noir',
    price: 80,
    sku: 'MARE-005',
    stock: 12,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Triangulo%20Noir.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm6',
    name: 'Pendiente Triángulo Esmeralda',
    price: 80,
    sku: 'MARE-006',
    stock: 9,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Triangulo%20esmeralda.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm7',
    name: 'Pendiente Aura Carmín',
    price: 85,
    sku: 'MARE-007',
    stock: 11,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20Carmin.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm8',
    name: 'Pendiente Aura Turquesa',
    price: 85,
    sku: 'MARE-008',
    stock: 7,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20turquesa.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm9',
    name: 'Pendiente Aura Marfil',
    price: 85,
    sku: 'MARE-009',
    stock: 13,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20marfil.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm10',
    name: 'Pendiente Aura Nácar',
    price: 85,
    sku: 'MARE-010',
    stock: 9,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20nacar.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm11',
    name: 'Pendiente Aura Noir',
    price: 85,
    sku: 'MARE-011',
    stock: 15,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20Noir.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm12',
    name: 'Pendiente Corona',
    price: 110,
    sku: 'MARE-012',
    stock: 4,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Corona.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm13',
    name: 'Pendiente Imperial',
    price: 105,
    sku: 'MARE-013',
    stock: 6,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Imperial.png'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm14',
    name: 'Pendientes Lágrima Imperial Azul',
    price: 90,
    sku: 'MARE-014',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Imperial%20Azul.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm15',
    name: 'Pendientes Lágrima Buganvilla Real',
    price: 90,
    sku: 'MARE-015',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Buganvilla%20Real%20.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm16',
    name: 'Pendientes Lágrima Rosa Empolvado',
    price: 90,
    sku: 'MARE-016',
    stock: 7,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Rosa%20Empolvado%20.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm17',
    name: 'Pendientes Lágrima Marfil Dorado',
    price: 90,
    sku: 'MARE-017',
    stock: 11,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Marfil%20Dorado.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm18',
    name: 'Pendientes Lágrima Jade Dorado',
    price: 90,
    sku: 'MARE-018',
    stock: 9,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Jade%20Dorado.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm19',
    name: 'Pendientes Lágrima Coral Dorado',
    price: 90,
    sku: 'MARE-019',
    stock: 12,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20lagrima%20Coral%20Dorado.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm20',
    name: 'Pendientes Lágrima Vino Imperial',
    price: 90,
    sku: 'MARE-020',
    stock: 6,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Vino%20Imperial.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm21',
    name: 'Pendientes Geometría Azul Real',
    price: 85,
    sku: 'MARE-021',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Geometria%20Azul%20Real.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm22',
    name: 'Pendientes Geometría Esmeralda',
    price: 85,
    sku: 'MARE-022',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Geometria%20Esmeralda.jpg'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm23',
    name: 'Pendientes Geometría Vino',
    price: 85,
    sku: 'MARE-023',
    stock: 7,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Geometria%20Vino.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm24',
    name: 'Pendientes Isabela Aguamarina',
    price: 75,
    sku: 'MARE-024',
    stock: 14,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Isabela%20Aguamarina.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm25',
    name: 'Pendientes Isabela Vino',
    price: 75,
    sku: 'MARE-025',
    stock: 11,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Isabela%20Vino.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'm26',
    name: 'Pendientes Soberana',
    price: 120,
    sku: 'MARE-026',
    stock: 3,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: [
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Soberana%20Grandes.PNG',
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20soberana%20little.PNG'
    ],
    createdAt: '2025-03-10',
  },
  {
    id: 'm28',
    name: 'Pendientes Isolde',
    price: 100,
    sku: 'MARE-028',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Isolde.PNG'],
    createdAt: '2025-03-10',
  },

  // --- COLECCIÓN CORALES ---
  {
    id: 'c1',
    name: 'Pendientes Coralia Cocoa',
    price: 72,
    sku: 'COR-001',
    stock: 10,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: [
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Cocoa.PNG',
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Cocoa(1).PNG',
    ],
    createdAt: '2025-03-10',
  },
  {
    id: 'c2',
    name: 'Pendientes Coralia Ivory',
    price: 72,
    sku: 'COR-002',
    stock: 12,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Ivory.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c3',
    name: 'Pendientes Coralia Sky',
    price: 72,
    sku: 'COR-003',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Sky.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c4',
    name: 'Pendientes Coralia Electric Blue',
    price: 72,
    sku: 'COR-004',
    stock: 9,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Electric%20Blue.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c5',
    name: 'Pendientes Coralia Bottle Green',
    price: 72,
    sku: 'COR-005',
    stock: 11,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Bottle%20Green.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c6',
    name: 'Pendientes Coralia Pistachio',
    price: 72,
    sku: 'COR-006',
    stock: 7,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: [
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Pistachio.PNG',
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Pistachio(1).PNG',
    ],
    createdAt: '2025-03-10',
  },
  {
    id: 'c7',
    name: 'Pendientes Coralia Salmón',
    price: 72,
    sku: 'COR-007',
    stock: 13,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Salmon.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c8',
    name: 'Pendientes Lágrimas de Coral',
    price: 70,
    sku: 'COR-008',
    stock: 15,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20_Lagrimas%20de%20coral_%20.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c9',
    name: 'Pendientes Lágrimas Coralinas',
    price: 70,
    sku: 'COR-009',
    stock: 6,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/pendientes%20lagrimas%20de%20Coralinas.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c10',
    name: 'Pendientes Aura Coralina Rojos',
    price: 85,
    sku: 'COR-010',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20_Aura%20Coralina_%20rojos.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c19',
    name: 'Pendientes Aura Coralina Coral Antiguo',
    price: 85,
    sku: 'COR-019',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: [
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20_Aura%20Coralina_%20coral%20antiguo.PNG',
      'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20_Aura%20Coralina_%20coral%20antiguo(1).PNG',
    ],
    createdAt: '2025-03-10',
  },
  {
    id: 'c11',
    name: 'Pendientes Ecos de Coral',
    price: 85,
    sku: 'COR-011',
    stock: 4,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/pendientes%20ecos%20de%20coral.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c12',
    name: 'Pendientes Pastora Azul',
    price: 80,
    sku: 'COR-012',
    stock: 9,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20%28Azul%29.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c13',
    name: 'Pendientes Pastora Pistacho',
    price: 80,
    sku: 'COR-013',
    stock: 11,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20%28Pistacho.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c14',
    name: 'Pendientes Pastora Verde Botella',
    price: 80,
    sku: 'COR-014',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20%28Verde%20Botella%29.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c15',
    name: 'Pendientes Pastora Crudos',
    price: 80,
    sku: 'COR-015',
    stock: 14,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20Crudos.JPG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c16',
    name: 'Pendientes Soleá Rojos',
    price: 75,
    sku: 'COR-016',
    stock: 10,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Solea%20Rojos.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c17',
    name: 'Pendientes Soleá Naranjas',
    price: 75,
    sku: 'COR-017',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Solea%20naranjas.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'c18',
    name: 'Pendientes Soleá Negros',
    price: 75,
    sku: 'COR-018',
    stock: 12,
    status: 'published',
    category: 'pendientes',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Solea%20negros.PNG'],
    createdAt: '2025-03-10',
  },

  // --- COLECCIÓN FILIPA ---
  {
    id: 'f1',
    name: 'Pendientes Linaje Carmesí',
    price: 110,
    sku: 'FILI-001',
    stock: 5,
    status: 'published',
    category: 'pendientes',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Linaje%20Carmesi.jpg'],
    createdAt: '2025-03-10',
  },
  {
    id: 'f2',
    name: 'Pendientes Herencia Imperial',
    price: 105,
    sku: 'FILI-002',
    stock: 7,
    status: 'published',
    category: 'pendientes',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Herencia%20Imperial.jpg'],
    createdAt: '2025-03-10',
  },
  {
    id: 'f3',
    name: 'Pendientes Legado Bizantino',
    price: 95,
    sku: 'FILI-003',
    stock: 8,
    status: 'published',
    category: 'pendientes',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Legado%20Bizantino.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'f4',
    name: 'Pendientes Noche Barroca',
    price: 90,
    sku: 'FILI-004',
    stock: 6,
    status: 'published',
    category: 'pendientes',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Noche%20Barroca.jpg'],
    createdAt: '2025-03-10',
  },
  {
    id: 'f5',
    name: 'Pendientes Flor de Perlas',
    price: 85,
    sku: 'FILI-005',
    stock: 10,
    status: 'published',
    category: 'pendientes',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20flor%20de%20perlas.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'f6',
    name: 'Pendientes Jardín Imperial',
    price: 95,
    sku: 'FILI-006',
    stock: 4,
    status: 'published',
    category: 'pendientes',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Jardin%20Imperial.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'f7',
    name: 'Collar Duquesa Blanca',
    price: 130,
    sku: 'FILI-007',
    stock: 3,
    status: 'published',
    category: 'collares',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Duquesa%20Blanca.PNG'],
    createdAt: '2025-03-10',
  },
  {
    id: 'f8',
    name: 'Collar Filipa',
    price: 145,
    sku: 'FILI-008',
    stock: 2,
    status: 'published',
    category: 'collares',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Filipa.PNG'],
    createdAt: '2025-03-10',
  },

  // --- NUEVOS PRODUCTOS (BOLSOS) ---
  {
    id: 'bag-agua-borde',
    name: 'Bolso Agua Borde',
    price: 190,
    sku: 'BOL-001',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Agua%20Borde.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'bag-carmesi-borde',
    name: 'Bolso Carmesí Borde',
    price: 190,
    sku: 'BOL-002',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Carmesi%20Borde.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'bag-clavel-noir',
    name: 'Bolso Clavel Noir',
    price: 195,
    sku: 'BOL-003',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Clavel%20Noir.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'bag-flor-de-noche',
    name: 'Bolso Flor de Noche',
    price: 200,
    sku: 'BOL-004',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Flor%20de%20Noche.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'bag-ivory-jardin',
    name: 'Bolso Ivory Jardin',
    price: 200,
    sku: 'BOL-005',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Ivory%20Jardin.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'bag-noir-imperial',
    name: 'Bolso Noir Imperial',
    price: 205,
    sku: 'BOL-006',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Noir%20Imperial.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'bag-oriental-noir',
    name: 'Bolso Oriental Noir',
    price: 205,
    sku: 'BOL-007',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Oriental%20Noir.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'bag-rose-filipa',
    name: 'Bolso Rose Filipa',
    price: 210,
    sku: 'BOL-008',
    stock: 3,
    status: 'published',
    category: 'bolsos',
    collection: 'Filipa',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Bolso%20Rose%20Filipa%20.PNG'],
    createdAt: '2026-03-11',
  },

  // --- NUEVOS PRODUCTOS (MANTONES) ---
  {
    id: 'manton-agua-de-mujer',
    name: 'Mantón Agua de Mujer',
    price: 360,
    sku: 'MAN-001',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20_Agua_%20de%20mujer.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-blanca',
    name: 'Mantón Blanca',
    price: 360,
    sku: 'MAN-002',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20_Blanca_.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-dolores',
    name: 'Mantón Dolores',
    price: 380,
    sku: 'MAN-003',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20_Dolores_%20.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-noche-de-sevilla',
    name: 'Mantón Noche de Sevilla',
    price: 390,
    sku: 'MAN-004',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20_Noche%20de%20Sevilla_.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-rosa-de-triana',
    name: 'Mantón Rosa de Triana',
    price: 380,
    sku: 'MAN-005',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20_Rosa%20de%20Triana_.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-valentina',
    name: 'Mantón Valentina',
    price: 395,
    sku: 'MAN-006',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20_Valentina_.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-valeria',
    name: 'Mantón Valeria',
    price: 395,
    sku: 'MAN-007',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20_Valeria_.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-carmesi',
    name: 'Mantón Carmesí',
    price: 390,
    sku: 'MAN-008',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20Carmesi%20.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-coralia',
    name: 'Mantón Coralia',
    price: 390,
    sku: 'MAN-009',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20Coralia.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-candela',
    name: 'Mantón Candela',
    price: 370,
    sku: 'MAN-010',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20de%20mujer%20Candela.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-isabella',
    name: 'Mantón Isabella',
    price: 390,
    sku: 'MAN-011',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20Isabella.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-melocoton-sevilla',
    name: 'Mantón Melocotón Sevilla',
    price: 380,
    sku: 'MAN-012',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20Melocoton%20Sevilla.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-noir-de-mujer',
    name: 'Mantón Noir de Mujer',
    price: 395,
    sku: 'MAN-013',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20Noir%20de%20mujer.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-noir',
    name: 'Mantón Noir',
    price: 395,
    sku: 'MAN-014',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20Noir.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'manton-oliva',
    name: 'Mantón Oliva',
    price: 380,
    sku: 'MAN-015',
    stock: 2,
    status: 'published',
    category: 'mantones',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Manton%20Oliva.PNG'],
    createdAt: '2026-03-11',
  },

  // --- NUEVOS PRODUCTOS (PEINECILLOS) ---
  {
    id: 'peinecillos-azul-vintage',
    name: 'Peinecillos Azul Vintage',
    price: 65,
    sku: 'PEI-001',
    stock: 10,
    status: 'published',
    category: 'peinecillos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Peinecillos%20Azul%20Vintage.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'peinecillos-coral-crudo',
    name: 'Peinecillos Coral y Crudo',
    price: 65,
    sku: 'PEI-002',
    stock: 10,
    status: 'published',
    category: 'peinecillos',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Peinecillos%20Coral%20y%20Crudo.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'peinecillos-descara-pasion',
    name: 'Peinecillos Descará Pasión',
    price: 70,
    sku: 'PEI-003',
    stock: 10,
    status: 'published',
    category: 'peinecillos',
    collection: 'Descará',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Peinecillos%20Descara%20Pasion.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'peinecillos-ebano',
    name: 'Peinecillos Ébano',
    price: 70,
    sku: 'PEI-004',
    stock: 10,
    status: 'published',
    category: 'peinecillos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Peinecillos%20Ebano.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'peinecillos-rosa-nude-crudo',
    name: 'Peinecillos Rosa Nude y Crudo',
    price: 65,
    sku: 'PEI-005',
    stock: 10,
    status: 'published',
    category: 'peinecillos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Peinecillos%20Rosa%20Nude%20y%20Crudo.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'peinecillos-rosa-nude',
    name: 'Peinecillos Rosa Nude',
    price: 65,
    sku: 'PEI-006',
    stock: 10,
    status: 'published',
    category: 'peinecillos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Peinecillos%20Rosa%20Nude.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'peinecillos-verde-agua',
    name: 'Peinecillos Verde Agua',
    price: 65,
    sku: 'PEI-007',
    stock: 10,
    status: 'published',
    category: 'peinecillos',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Peinecillos%20Verde%20Agua.PNG'],
    createdAt: '2026-03-11',
  },

  // --- NUEVOS PRODUCTOS (COLLARES) ---
  {
    id: 'collar-alba',
    name: 'Collar Alba',
    price: 125,
    sku: 'COL-001',
    stock: 6,
    status: 'published',
    category: 'collares',
    collection: 'Marebo',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Alba.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-coralia-cruz',
    name: 'Collar Coralia Cruz',
    price: 135,
    sku: 'COL-002',
    stock: 6,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Coralia%20Cruz.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-coralia',
    name: 'Collar Coralia',
    price: 130,
    sku: 'COL-003',
    stock: 6,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Coralia.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-cruz-corrallium',
    name: 'Collar Cruz Corrallium',
    price: 140,
    sku: 'COL-004',
    stock: 6,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Cruz%20Corrallium.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-azul-electrico-42',
    name: 'Collar Esfera Azul Eléctrico 42',
    price: 120,
    sku: 'COL-005',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Azul%20Electrico%2042.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-burdeos-42',
    name: 'Collar Esfera Burdeos 42',
    price: 120,
    sku: 'COL-006',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Burdeos%2042.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-coral-teja-42',
    name: 'Collar Esfera Coral-Teja 42',
    price: 120,
    sku: 'COL-007',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Coral-Teja%2042.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-coral-teja-58',
    name: 'Collar Esfera Coral-Teja 58',
    price: 130,
    sku: 'COL-008',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Coral-Teja%2058.PNG'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-crudo-42',
    name: 'Collar Esfera Crudo 42',
    price: 120,
    sku: 'COL-009',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Crudo%2042.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-crudo-58',
    name: 'Collar Esfera Crudo 58',
    price: 130,
    sku: 'COL-010',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20crudo%2058.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-rojo-58',
    name: 'Collar Esfera Rojo 58',
    price: 130,
    sku: 'COL-011',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20rojo%2058.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-salmon-42',
    name: 'Collar Esfera Salmón 42',
    price: 120,
    sku: 'COL-012',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Salmon%2042.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-salmon-58',
    name: 'Collar Esfera Salmón 58',
    price: 130,
    sku: 'COL-013',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Salmon%2058.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-turquesa-42',
    name: 'Collar Esfera Turquesa 42',
    price: 120,
    sku: 'COL-014',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20turquesa%2042.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-turquesa-58',
    name: 'Collar Esfera Turquesa 58',
    price: 130,
    sku: 'COL-015',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20turquesa%2058.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-verde-botella-42',
    name: 'Collar Esfera Verde Botella 42',
    price: 120,
    sku: 'COL-016',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Verde%20Botella%2042.jpg'],
    createdAt: '2026-03-11',
  },
  {
    id: 'collar-esfera-verde-botella-58',
    name: 'Collar Esfera Verde Botella 58',
    price: 130,
    sku: 'COL-017',
    stock: 8,
    status: 'published',
    category: 'collares',
    collection: 'Corales',
    images: ['https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Esfera%20Verde%20Botella%2058.jpg'],
    createdAt: '2026-03-11',
  },
]

const COLOR_SUFFIXES = [
  'Electric Blue',
  'Bottle Green',
  'Verde Botella',
  'Pistachio',
  'Pistacho',
  'Turquesas',
  'Turquesa',
  'Naranjas',
  'Negros',
  'Rojos',
  'Blancos',
  'Cocoa',
  'Ivory',
  'Sky',
  'Salmón',
  'Salmon',
  'Azul Real',
  'Azul',
  'Vino',
  'Rosa',
  'Jade',
  'Aguamarina',
  'Noir',
  'Rubí',
  'Carmín',
  'Marfil',
  'Nácar',
  'Esmeralda',
  'Fucsia',
  'Crudos',
  'Coral Antiguo',
  'Coral',
].sort((a, b) => b.length - a.length)

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function collectionNameToSlug(name: string) {
  const map: Record<string, string> = {
    'descará': 'descara',
    'marebo': 'marebo',
    'corales': 'corales',
    'filipa': 'filipa',
    'jaipur': 'jaipur',
  }
  const key = name.trim().toLowerCase()
  return map[key] ?? slugify(name)
}

function parseRootAndColor(name: string) {
  const normalized = name.replace(/\s+/g, ' ').trim()

  if (/^pendientes?\s+aura\s+(nacar|nácar|noir)$/i.test(normalized)) {
    return { root: normalized, colorName: '' }
  }

  if (/^pendientes?\s+lágrimas?\s+de\s+coral$/i.test(normalized)) {
    return { root: 'Pendientes Lágrimas de Coral', colorName: '' }
  }

  if (/^pendientes?\s+ecos\s+de\s+coral$/i.test(normalized)) {
    return { root: 'Pendientes Ecos de Coral', colorName: '' }
  }

  const lagrimaImperialColors = [
    'Buganvilla Real',
    'Rosa Empolvado',
    'Marfil Dorado',
    'Jade Dorado',
    'Coral Dorado',
    'Vino Imperial',
    'Azul',
  ] as const

  const lagrimaImperialDirect = normalized.match(/^pendientes?\s+lágrima\s+imperial(?:\s+(.+))?$/i)
  if (lagrimaImperialDirect) {
    const colorName = (lagrimaImperialDirect[1] || '').trim()
    if (!colorName) return { root: 'Pendiente Lágrima Imperial', colorName: '' }

    const match = lagrimaImperialColors.find(c => c.toLowerCase() === colorName.toLowerCase())
    if (match) return { root: 'Pendiente Lágrima Imperial', colorName: match }
  }

  const lagrimaImperialMissing = normalized.match(
    /^pendientes?\s+lágrima\s+(buganvilla real|rosa empolvado|marfil dorado|jade dorado|coral dorado|vino imperial)$/i,
  )
  if (lagrimaImperialMissing) {
    const colorName = lagrimaImperialMissing[1].trim()
    const match = lagrimaImperialColors.find(c => c.toLowerCase() === colorName.toLowerCase())
    if (match) return { root: 'Pendiente Lágrima Imperial', colorName: match }
  }

  const parenMatch = normalized.match(/^(.*)\s*\(([^()]+)\)\s*$/)
  if (parenMatch) {
    const root = parenMatch[1].trim()
    const colorName = parenMatch[2].trim()
    return { root, colorName }
  }

  for (const suffix of COLOR_SUFFIXES) {
    const re = new RegExp(`\\s+${escapeRegExp(suffix)}\\s*$`, 'i')
    if (re.test(normalized)) {
      const root = normalized.replace(re, '').trim()
      return { root, colorName: suffix }
    }
  }

  return { root: normalized, colorName: '' }
}

function groupIntoParents(raw: RawProduct[]): Product[] {
  const parents = new Map<
    string,
    Omit<Product, 'variants'> & { variants: Map<string, ProductVariant> }
  >()

  const usedIds = new Set<string>()

  for (const item of raw) {
    const { root, colorName } = parseRootAndColor(item.name)
    const resolvedColorName = colorName || 'Único'
    const collectionSlug = collectionNameToSlug(item.collection)
    const rootSlug = slugify(root)
    const isSoberanaSplit =
      rootSlug === 'pendientes-soberana' &&
      collectionSlug === 'marebo' &&
      resolvedColorName === 'Único' &&
      item.images.length >= 2

    const key = `${collectionSlug}::${item.category}::${rootSlug}`
    const existing = parents.get(key)

    if (!existing) {
      let parentId = rootSlug
      if (usedIds.has(parentId)) parentId = `${rootSlug}-${collectionSlug}`
      if (usedIds.has(parentId)) parentId = `${rootSlug}-${collectionSlug}-${item.category}`
      usedIds.add(parentId)

      const initialVariants = isSoberanaSplit
        ? new Map<string, ProductVariant>([
            ['grandes', { colorName: 'Grandes', images: [item.images[0]] }],
            ['pequenos', { colorName: 'Pequeños', images: [item.images[1]] }],
          ])
        : new Map<string, ProductVariant>([
            [
              resolvedColorName.toLowerCase(),
              { colorName: resolvedColorName, images: [...item.images] },
            ],
          ])

      if (isSoberanaSplit && item.images.length > 2) {
        const grandes = initialVariants.get('grandes')
        if (grandes) {
          for (const img of item.images.slice(2)) {
            if (!grandes.images.includes(img)) grandes.images.push(img)
          }
        }
      }

      parents.set(key, {
        id: parentId,
        name: root,
        price: item.price,
        sku: item.sku,
        stock: item.stock,
        status: item.status,
        category: item.category,
        collection: item.collection,
        collectionSlug,
        createdAt: item.createdAt,
        variants: initialVariants,
      })
      continue
    }

    existing.price = Math.min(existing.price, item.price)
    existing.stock += item.stock
    existing.status = existing.status === 'published' || item.status === 'published' ? 'published' : 'draft'
    existing.createdAt = existing.createdAt >= item.createdAt ? existing.createdAt : item.createdAt

    if (isSoberanaSplit) {
      const large = existing.variants.get('grandes')
      if (large && item.images[0] && !large.images.includes(item.images[0])) {
        large.images.push(item.images[0])
      }
      const small = existing.variants.get('pequenos')
      if (small && item.images[1] && !small.images.includes(item.images[1])) {
        small.images.push(item.images[1])
      }
      if (large && item.images.length > 2) {
        for (const img of item.images.slice(2)) {
          if (!large.images.includes(img)) large.images.push(img)
        }
      }
      continue
    }

    const variantKey = resolvedColorName.toLowerCase()
    const currentVariant = existing.variants.get(variantKey)
    if (!currentVariant) {
      existing.variants.set(variantKey, { colorName: resolvedColorName, images: [...item.images] })
    } else {
      for (const img of item.images) {
        if (!currentVariant.images.includes(img)) currentVariant.images.push(img)
      }
    }
  }

  return Array.from(parents.values()).map(parent => ({
    ...parent,
    variants: Array.from(parent.variants.values()),
  }))
}

const INITIAL_PRODUCTS: Product[] = groupIntoParents(INITIAL_RAW_PRODUCTS)

const ProductsContext = createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [hydrated, setHydrated] = useState(false)
  const missingStripeProductsRef = useRef<Set<string>>(new Set())

  // Load from localStorage on mount; seed with INITIAL_PRODUCTS if empty
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setProducts(INITIAL_PRODUCTS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS))
    } catch {
      setProducts(INITIAL_PRODUCTS)
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever products change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [products, hydrated])

  useEffect(() => {
    if (!hydrated) return
    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch('/api/stripe/prices')
        if (!res.ok) return
        const json = (await res.json()) as { prices?: Record<string, number>; enabled?: boolean }
        if (json.enabled === false) return
        const prices = json.prices ?? {}

        if (cancelled) return

        setProducts(prev =>
          prev.map(p => {
            const stripePrice = prices[p.name]
            if (typeof stripePrice === 'number') return { ...p, price: stripePrice }

            if (!missingStripeProductsRef.current.has(p.name)) {
              missingStripeProductsRef.current.add(p.name)
              console.error(`[Stripe] Producto no encontrado por nombre exacto: "${p.name}"`)
            }
            return p
          })
        )
      } catch {
        return
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [hydrated])

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
    }
    setProducts(prev => [newProduct, ...prev])
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider')
  return ctx
}
