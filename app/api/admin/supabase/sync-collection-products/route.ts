import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseServiceClient(): any {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key =
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '').trim()

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeSoft(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function compact(value: unknown) {
  return normalizeSoft(value).replace(/\s+/g, '')
}

const STOPWORDS = new Set([
  'edicion',
  'edicionlimitada',
  'limitada',
  'limited',
  'edition',
  'coleccion',
  'collection',
  'de',
  'del',
  'la',
  'el',
  'y',
])

function tokens(value: unknown) {
  return normalizeSoft(value)
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 2)
    .filter((t) => !STOPWORDS.has(t) && !STOPWORDS.has(t.replace(/\s+/g, '')))
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a)
  const B = new Set(b)
  if (A.size === 0 && B.size === 0) return 1
  let inter = 0
  for (const x of A) if (B.has(x)) inter += 1
  const union = A.size + B.size - inter
  return union === 0 ? 0 : inter / union
}

function scorePair(aName: string, bName: string) {
  const aSoft = normalizeSoft(aName)
  const bSoft = normalizeSoft(bName)
  if (aSoft === bSoft) return 1

  const aCompact = compact(aName)
  const bCompact = compact(bName)
  const includes = aCompact.includes(bCompact) || bCompact.includes(aCompact)

  const aTokens = tokens(aName)
  const bTokens = tokens(bName)
  const tokenScore = jaccard(aTokens, bTokens)

  return Math.min(1, tokenScore + (includes ? 0.25 : 0))
}

type UpdateItem = { name: string; image_url: string }

const COLLECTION_UPDATES: Record<string, UpdateItem[]> = {
  corales: [
    {
      name: 'Pendientes Coralia Cocoa',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Coralia%20Cocoa.PNG',
    },
    {
      name: 'Pendientes Coralia Sky',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Coralia%20Sky.PNG',
    },
    {
      name: 'Pendientes Coralia Salmón',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Coralia%20Salmon.PNG',
    },
    {
      name: 'Pendientes Coralia Electric Blue',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Coralia%20Electric%20Blue.PNG',
    },
    {
      name: 'Pendientes Coralia Bottle Green',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Coralia%20Bottle%20Green.PNG',
    },
    {
      name: 'Pendientes Coralia Ivory',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Coralia%20Ivory.PNG',
    },
    {
      name: 'Pendientes Coralia Pistachio',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Coralia%20Pistachio.PNG',
    },
    {
      name: 'Pendientes Lágrimas de Coral',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20_Lagrimas%20de%20coral_%20.PNG',
    },
    {
      name: 'Pendientes Ecos de Coral',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/pendientes%20ecos%20de%20coral.PNG',
    },
    {
      name: 'Pendientes Aura Coralina Coral Antiguo',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20_Aura%20Coralina_%20coral%20antiguo.PNG',
    },
    {
      name: 'Pendientes Aura Coralina Rojos',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20_Aura%20Coralina_%20rojos.PNG',
    },
    {
      name: 'Pendientes Lágrimas Coralinas',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/pendientes%20lagrimas%20de%20Coralinas.PNG',
    },
    {
      name: 'Pendientes Lágrimas Coralinas Crudo',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/pendientes%20lagrimas%20coralinas%20crudo.PNG',
    },
    {
      name: 'Pendientes Pastora Crudos',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Pastora%20Crudos.JPG',
    },
    {
      name: 'Pendientes Pastora Pistacho',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Pastora%20%28Pistacho.PNG',
    },
    {
      name: 'Pendientes Pastora Azul',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Pastora%20%28Azul%29.PNG',
    },
    {
      name: 'Pendientes Pastora Verde Botella',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Pastora%20%28Verde%20Botella%29.PNG',
    },
    {
      name: 'Pendientes Soleá Rojos',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Solea%20Rojos.PNG',
    },
    {
      name: 'Pendientes Soleá Naranjas',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Solea%20naranjas.PNG',
    },
    {
      name: 'Pendientes Soleá Negros',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Solea%20negros.PNG',
    },
  ],
  descara: [
    {
      name: 'Pendientes Reina Isabela Marfil',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Reina%20Isabela%20Marfil.PNG',
    },
    {
      name: 'Pendientes Descará Córdoba Coral',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Cordoba%20Coral.PNG',
    },
    {
      name: 'Pendientes Descará Coral',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Coral.PNG',
    },
    {
      name: 'Pendientes Descará Dorados',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Dorados.PNG',
    },
    {
      name: 'Pendientes Descará Imperio',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Imperio.PNG',
    },
    {
      name: 'Pendientes Descará Pasión',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Pasion.PNG',
    },
    {
      name: 'Pendientes Descará Alhambra',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Alhambra.PNG',
    },
    {
      name: 'Pendientes Descará Córdoba',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Cordoba.PNG',
    },
    {
      name: 'Pendientes Descará Moneda',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Moneda.PNG',
    },
    {
      name: 'Pendientes Descará Cristal',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Cristal.PNG',
    },
    {
      name: 'Pendientes Descará Esmeralda',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Descara%20Esmeralda.PNG',
    },
    {
      name: 'Pendientes Folklore Blancos',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20folklore%20blancos.PNG',
    },
    {
      name: 'Pendientes Folklore Fucsia',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20folklore%20fucsia.PNG',
    },
    {
      name: 'Pendientes Folklore Negros',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20folklore%20negros.PNG',
    },
    {
      name: 'Pendientes Folklore Turquesas',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20folklore%20turquesas.PNG',
    },
    {
      name: 'Pulseras Folklore Fucsia',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pulseras%20folklore%20fucsia.PNG',
    },
    {
      name: 'Pulseras Folklore Negras',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pulseras%20Folklore%20negras.PNG',
    },
    {
      name: 'Pulseras Folklore Turquesas',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pulseras%20folklore%20turquesas.PNG',
    },
  ],
  filipa: [
    {
      name: 'Pendientes Linaje Carmesí',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Linaje%20Carmesi.jpg',
    },
    {
      name: 'Pendientes Herencia Imperial',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Herencia%20Imperial.jpg',
    },
    {
      name: 'Pendientes Legado Bizantino',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Legado%20Bizantino.PNG',
    },
    {
      name: 'Pendientes Noche Barroca',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Noche%20Barroca.jpg',
    },
    {
      name: 'Pendientes Flor de Perlas',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20flor%20de%20perlas.PNG',
    },
    {
      name: 'Pendientes Jardín Imperial',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Jardin%20Imperial.PNG',
    },
    {
      name: 'Collar Duquesa Blanca',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Duquesa%20Blanca.PNG',
    },
    {
      name: 'Collar Filipa',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Filipa.PNG',
    },
  ],
  marebo: [
    {
      name: 'Pendiente Flor MAREBO Doré',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Flor%20MAREBO%20Dore.png',
    },
    {
      name: 'Pendiente Flor Noir MAREBO Doré',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Flor%20Noir%20MAREBO%20Dore.png',
    },
    {
      name: 'Pendiente Flor Esmeralda',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Flor%20Esmeralda.PNG',
    },
    {
      name: 'Pendiente Triángulo Rubí',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Triangulo%20Rubi.png',
    },
    {
      name: 'Pendiente Triángulo Noir',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Triangulo%20Noir.png',
    },
    {
      name: 'Pendiente Triángulo Esmeralda',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Triangulo%20esmeralda.png',
    },
    {
      name: 'Pendiente Aura Carmín',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Aura%20Carmin.png',
    },
    {
      name: 'Pendiente Aura Turquesa',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Aura%20turquesa.png',
    },
    {
      name: 'Pendiente Aura Marfil',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Aura%20marfil.png',
    },
    {
      name: 'Pendiente Aura Nácar',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Aura%20nacar.png',
    },
    {
      name: 'Pendiente Aura Noir',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Aura%20Noir.png',
    },
    {
      name: 'Pendiente Corona',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Corona.png',
    },
    {
      name: 'Pendiente Imperial',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendiente%20Imperial.PNG',
    },
    {
      name: 'Pendientes Lágrima Imperial Azul',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Lagrima%20Imperial%20Azul.PNG',
    },
    {
      name: 'Pendientes Lágrima Esmeralda Profunda',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Lagrima%20Esmeralda%20Profunda.PNG',
    },
    {
      name: 'Pendientes Lágrima Buganvilla Real',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Lagrima%20Buganvilla%20Real%20.PNG',
    },
    {
      name: 'Pendientes Lágrima Rosa Empolvado',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Lagrima%20Rosa%20Empolvado%20.PNG',
    },
    {
      name: 'Pendientes Lágrima Marfil Dorado',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Lagrima%20Marfil%20Dorado.PNG',
    },
    {
      name: 'Pendientes Lágrima Jade Dorado',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Lagrima%20Jade%20Dorado.PNG',
    },
    {
      name: 'Pendientes Lágrima Coral Dorado',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20lagrima%20Coral%20Dorado.PNG',
    },
    {
      name: 'Pendientes Lágrima Vino Imperial',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Lagrima%20Vino%20Imperial.PNG',
    },
    {
      name: 'Pendientes Geometría Azul Real',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Geometria%20Azul%20Real.PNG',
    },
    {
      name: 'Pendientes Geometría Esmeralda',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Geometria%20Esmeralda.jpg',
    },
    {
      name: 'Pendientes Isabela Aguamarina',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Isabela%20Aguamarina.PNG',
    },
    {
      name: 'Pendientes Isabela Vino',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Isabela%20Vino.PNG',
    },
    {
      name: 'Pendientes Soberana Grandes',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Soberana%20Grandes.PNG',
    },
    {
      name: 'Pendientes Soberana Pequeños',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20soberana%20little.PNG',
    },
    {
      name: 'Pendientes Isolde',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Isolde.PNG',
    },
  ],
}

const CATEGORY_UPDATES: Record<string, UpdateItem[]> = {
  mantones: [
    {
      name: 'Mantón Agua de Mujer',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Agua_%20de%20mujer.PNG',
    },
    {
      name: 'Mantón Agua de Niña',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Agua_%20de%20mujer.PNG',
    },
    {
      name: 'Mantón Blanca',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Blanca_.jpg',
    },
    {
      name: 'Mantón Candela',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20de%20mujer%20Candela.PNG',
    },
    {
      name: 'Mantón Carmesí',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Carmesi%20.PNG',
    },
    {
      name: 'Mantón Carmesí - Edición Limitada',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Carmesi%20.PNG',
    },
    {
      name: 'Mantón de niña Candela',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20de%20mujer%20Candela.PNG',
    },
    {
      name: 'Mantón Dolores',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Dolores_%20.PNG',
    },
    {
      name: 'Mantón Dolores - Edición Limitada',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Dolores_%20.PNG',
    },
    {
      name: 'Mantón Isabella',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Isabella.PNG',
    },
    {
      name: 'Mantón Isabella - Edición Limitada',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Isabella.PNG',
    },
    {
      name: 'Mantón Lima - Edición Limitada',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Piquillo%20LIMA.PNG',
    },
    {
      name: 'Mantón Melocotón Sevilla',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Melocoton%20Sevilla.PNG',
    },
    {
      name: 'Mantón Noche de Sevilla',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Noche%20de%20Sevilla_.PNG',
    },
    {
      name: 'Mantón Noir',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Noir.PNG',
    },
    {
      name: 'Mantón Noir de Mujer',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Noir%20de%20mujer.PNG',
    },
    {
      name: 'Mantón Noir de Niña',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Noir%20de%20mujer.PNG',
    },
    {
      name: 'Mantón Oliva',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Oliva.PNG',
    },
    {
      name: 'Mantón Oliva - Edición Limitada',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20Oliva.PNG',
    },
    {
      name: 'Mantón Rosa de Triana',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Rosa%20de%20Triana_.PNG',
    },
    {
      name: 'Mantón Valentina',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Valentina_.PNG',
    },
    {
      name: 'Mantón Valeria',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Manton%20_Valeria_.PNG',
    },
  ],
  collares: [
    {
      name: 'Collar Alba',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Alba.PNG',
    },
    {
      name: 'Collar Cruz Corrallium',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Cruz%20Corrallium.PNG',
    },
    {
      name: 'Collar Esfera Azul Eléctrico 42',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Azul%20Electrico%2042.jpg',
    },
    {
      name: 'Collar Esfera Burdeos 42',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Burdeos%2042.jpg',
    },
    {
      name: 'Collar Esfera Coral-Teja 42',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Coral-Teja%2042.PNG',
    },
    {
      name: 'Collar Esfera Coral-Teja 58',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Coral-Teja%2058.PNG',
    },
    {
      name: 'Collar Esfera Crudo 42',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Crudo%2042.jpg',
    },
    {
      name: 'Collar Esfera Crudo 58',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20crudo%2058.jpg',
    },
    {
      name: 'Collar Esfera Rojo 58',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20rojo%2058.jpg',
    },
    {
      name: 'Collar Esfera Salmón 42',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Salmon%2042.jpg',
    },
    {
      name: 'Collar Esfera Salmón 58',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Salmon%2058.jpg',
    },
    {
      name: 'Collar Esfera Turquesa 42',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20turquesa%2042.jpg',
    },
    {
      name: 'Collar Esfera Turquesa 58',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20turquesa%2058.jpg',
    },
    {
      name: 'Collar Esfera Verde Botella 42',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Verde%20Botella%2042.jpg',
    },
    {
      name: 'Collar Esfera Verde Botella 58',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Collar%20Esfera%20Verde%20Botella%2058.jpg',
    },
  ],
  bolsos: [
    {
      name: 'Bolso Agua Borde',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Bolso%20Agua%20Borde.PNG',
    },
    {
      name: 'Bolso Carmesí Borde',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Bolso%20Carmesi%20Borde.PNG',
    },
    {
      name: 'Bolso Clavel Noir',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Bolso%20Clavel%20Noir.PNG',
    },
    {
      name: 'Bolso Flor de Noche',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Bolso%20Flor%20de%20Noche.PNG',
    },
    {
      name: 'Bolso Ivory Jardin',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Bolso%20Ivory%20Jardin.PNG',
    },
    {
      name: 'Bolso Noir Imperial',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Bolso%20Noir%20Imperial.PNG',
    },
    {
      name: 'Bolso Oriental Noir',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Bolso%20Oriental%20Noir.PNG',
    },
  ],
  peinecillos: [
    {
      name: 'Peinecillos Azul Vintage',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Peinecillos%20Azul%20Vintage.PNG',
    },
    {
      name: 'Peinecillos Coral y Crudo',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Peinecillos%20Coral%20y%20Crudo.PNG',
    },
    {
      name: 'Peinecillos Ébano',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Peinecillos%20Ebano.PNG',
    },
    {
      name: 'Peinecillos Noir Filigrana',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Pendientes%20Noir%20Filigrana.PNG',
    },
    {
      name: 'Peinecillos Rosa Nude',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Peinecillos%20Rosa%20Nude.PNG',
    },
    {
      name: 'Peinecillos Rosa Nude y Crudo',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Peinecillos%20Rosa%20Nude%20y%20Crudo.PNG',
    },
    {
      name: 'Peinecillos Verde Agua',
      image_url:
        'https://marebo.b-cdn.net/Colecciones/Peinecillos%20Verde%20Agua.PNG',
    },
  ],
}

export async function POST(req: Request) {
  const token = req.headers.get('x-sync-token') || ''
  const requiredToken = process.env.SYNC_TOKEN || 'MareboReverse2026'
  if (token !== requiredToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServiceClient()
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase service_role_key not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') !== '0'

  const updated: Array<{
    scope_type: 'collection' | 'category'
    scope_value: string
    supabase_id: string
    before_name: string
    after_name: string
    before_image_url: string | null
    after_image_url: string
    score: number
  }> = []
  const errors: Array<{
    scope_type: 'collection' | 'category'
    scope_value: string
    target_name: string
    reason: string
    candidates?: any[]
  }> = []

  const { data: allData, error: allError } = await supabase
    .from('products')
    .select('id,name,image_url,collection,category')
    .order('name', { ascending: true })
    .limit(5000)

  if (allError) {
    return NextResponse.json({ success: false, error: allError.message }, { status: 500 })
  }

  const allRows: Array<{ id: string; name: string; image_url: string | null; collection: string | null }> = (
    allData ?? []
  ).map((r: any) => ({
    id: String(r.id),
    name: String(r.name ?? ''),
    image_url: r.image_url ?? null,
    collection: r.collection ?? null,
    category: r.category ?? null,
  }))

  const usedGlobal = new Set<string>()

  const groups: Array<{ scope_type: 'collection' | 'category'; scope_value: string; items: UpdateItem[] }> = [
    ...Object.entries(COLLECTION_UPDATES).map(([scope_value, items]) => ({ scope_type: 'collection' as const, scope_value, items })),
    ...Object.entries(CATEGORY_UPDATES).map(([scope_value, items]) => ({ scope_type: 'category' as const, scope_value, items })),
  ]

  for (const group of groups) {
    const scopeValue = group.scope_value
    for (const item of group.items) {
      const kind = tokens(item.name)[0] ?? ''
      const kindAllow = new Set<string>(
        kind === 'pendientes' || kind === 'pendiente'
          ? ['pendientes', 'pendiente']
          : kind === 'pulseras' || kind === 'pulsera'
            ? ['pulseras', 'pulsera']
            : kind === 'collar' || kind === 'collares'
              ? ['collar', 'collares']
              : kind === 'manton' || kind === 'mantones'
                ? ['manton', 'mantones']
                : kind === 'bolso' || kind === 'bolsos'
                  ? ['bolso', 'bolsos']
                  : kind === 'peinecillo' || kind === 'peinecillos'
                    ? ['peinecillo', 'peinecillos']
                    : kind
                      ? [kind]
                      : [],
      )

      const scored = allRows
        .filter((r) => !usedGlobal.has(r.id))
        .map((r) => {
          const base = scorePair(item.name, r.name)
          if (base <= 0) return { row: r, score: 0 }

          if (kindAllow.size > 0) {
            const rt = new Set(tokens(r.name))
            let ok = false
            for (const k of kindAllow) if (rt.has(k)) ok = true
            if (!ok) return { row: r, score: 0 }
          }

          const currentScope =
            group.scope_type === 'collection'
              ? normalizeSoft((r as any).collection ?? '')
              : normalizeSoft((r as any).category ?? '')
          const bonus = currentScope === scopeValue ? 0.12 : !currentScope ? 0.06 : -0.12
          const score = Math.max(0, Math.min(1, base + bonus))
          return { row: r, score }
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)

      const best = scored[0]
      const second = scored[1]

      if (!best || best.score < 0.86 || (second && best.score - second.score < 0.08)) {
        errors.push({
          scope_type: group.scope_type,
          scope_value: scopeValue,
          target_name: item.name,
          reason: !best
            ? 'No candidates'
            : best.score < 0.86
              ? 'Low confidence match'
              : 'Ambiguous match',
          candidates: scored.slice(0, 5).map((c) => ({ id: c.row.id, name: c.row.name, score: c.score })),
        })
        continue
      }

      usedGlobal.add(best.row.id)

      if (!dryRun) {
        const patch: any = { name: item.name, image_url: item.image_url }
        if (group.scope_type === 'collection') patch.collection = scopeValue
        else patch.category = scopeValue
        const { error: updateError } = await supabase
          .from('products')
          .update(patch)
          .eq('id', best.row.id)
        if (updateError) {
          errors.push({ scope_type: group.scope_type, scope_value: scopeValue, target_name: item.name, reason: updateError.message })
          continue
        }
      }

      updated.push({
        scope_type: group.scope_type,
        scope_value: scopeValue,
        supabase_id: best.row.id,
        before_name: best.row.name,
        after_name: item.name,
        before_image_url: best.row.image_url,
        after_image_url: item.image_url,
        score: best.score,
      })
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    dryRun,
    updatedCount: updated.length,
    errorCount: errors.length,
    updated,
    errors,
  })
}
