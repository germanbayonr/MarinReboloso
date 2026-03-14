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
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Cocoa.PNG',
    },
    {
      name: 'Pendientes Coralia Sky',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Sky.PNG',
    },
    {
      name: 'Pendientes Coralia Salmón',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Salmon.PNG',
    },
    {
      name: 'Pendientes Coralia Electric Blue',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Electric%20Blue.PNG',
    },
    {
      name: 'Pendientes Coralia Bottle Green',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Bottle%20Green.PNG',
    },
    {
      name: 'Pendientes Coralia Ivory',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Ivory.PNG',
    },
    {
      name: 'Pendientes Coralia Pistachio',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Coralia%20Pistachio.PNG',
    },
    {
      name: 'Pendientes Lágrimas de Coral',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20_Lagrimas%20de%20coral_%20.PNG',
    },
    {
      name: 'Pendientes Ecos de Coral',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/pendientes%20ecos%20de%20coral.PNG',
    },
    {
      name: 'Pendientes Aura Coralina Coral Antiguo',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20_Aura%20Coralina_%20coral%20antiguo.PNG',
    },
    {
      name: 'Pendientes Aura Coralina Rojos',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20_Aura%20Coralina_%20rojos.PNG',
    },
    {
      name: 'Pendientes Lágrimas Coralinas',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/pendientes%20lagrimas%20de%20Coralinas.PNG',
    },
    {
      name: 'Pendientes Lágrimas Coralinas Crudo',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/pendientes%20lagrimas%20coralinas%20crudo.PNG',
    },
    {
      name: 'Pendientes Pastora Crudos',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20Crudos.JPG',
    },
    {
      name: 'Pendientes Pastora Pistacho',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20%28Pistacho.PNG',
    },
    {
      name: 'Pendientes Pastora Azul',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20%28Azul%29.PNG',
    },
    {
      name: 'Pendientes Pastora Verde Botella',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Pastora%20%28Verde%20Botella%29.PNG',
    },
    {
      name: 'Pendientes Soleá Rojos',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Solea%20Rojos.PNG',
    },
    {
      name: 'Pendientes Soleá Naranjas',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Solea%20naranjas.PNG',
    },
    {
      name: 'Pendientes Soleá Negros',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Solea%20negros.PNG',
    },
  ],
  descara: [
    {
      name: 'Pendientes Reina Isabela Marfil',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Reina%20Isabela%20Marfil.PNG',
    },
    {
      name: 'Pendientes Descará Córdoba Coral',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Cordoba%20Coral.PNG',
    },
    {
      name: 'Pendientes Descará Coral',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Coral.PNG',
    },
    {
      name: 'Pendientes Descará Dorados',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Dorados.PNG',
    },
    {
      name: 'Pendientes Descará Imperio',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Imperio.PNG',
    },
    {
      name: 'Pendientes Descará Pasión',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Pasion.PNG',
    },
    {
      name: 'Pendientes Descará Alhambra',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Alhambra.PNG',
    },
    {
      name: 'Pendientes Descará Córdoba',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Cordoba.PNG',
    },
    {
      name: 'Pendientes Descará Moneda',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Moneda.PNG',
    },
    {
      name: 'Pendientes Descará Cristal',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Cristal.PNG',
    },
    {
      name: 'Pendientes Descará Esmeralda',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Descara%20Esmeralda.PNG',
    },
    {
      name: 'Pendientes Folklore Blancos',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20blancos.PNG',
    },
    {
      name: 'Pendientes Folklore Fucsia',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20fucsia.PNG',
    },
    {
      name: 'Pendientes Folklore Negros',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20negros.PNG',
    },
    {
      name: 'Pendientes Folklore Turquesas',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20folklore%20turquesas.PNG',
    },
    {
      name: 'Pulseras Folklore Fucsia',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pulseras%20folklore%20fucsia.PNG',
    },
    {
      name: 'Pulseras Folklore Negras',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pulseras%20Folklore%20negras.PNG',
    },
    {
      name: 'Pulseras Folklore Turquesas',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pulseras%20folklore%20turquesas.PNG',
    },
  ],
  filipa: [
    {
      name: 'Pendientes Linaje Carmesí',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Linaje%20Carmesi.jpg',
    },
    {
      name: 'Pendientes Herencia Imperial',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Herencia%20Imperial.jpg',
    },
    {
      name: 'Pendientes Legado Bizantino',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Legado%20Bizantino.PNG',
    },
    {
      name: 'Pendientes Noche Barroca',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Noche%20Barroca.jpg',
    },
    {
      name: 'Pendientes Flor de Perlas',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20flor%20de%20perlas.PNG',
    },
    {
      name: 'Pendientes Jardín Imperial',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Jardin%20Imperial.PNG',
    },
    {
      name: 'Collar Duquesa Blanca',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Duquesa%20Blanca.PNG',
    },
    {
      name: 'Collar Filipa',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Collar%20Filipa.PNG',
    },
  ],
  marebo: [
    {
      name: 'Pendiente Flor MAREBO Doré',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Flor%20MAREBO%20Dore.png',
    },
    {
      name: 'Pendiente Flor Noir MAREBO Doré',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Flor%20Noir%20MAREBO%20Dore.png',
    },
    {
      name: 'Pendiente Flor Esmeralda',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Flor%20Esmeralda.PNG',
    },
    {
      name: 'Pendiente Triángulo Rubí',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Triangulo%20Rubi.png',
    },
    {
      name: 'Pendiente Triángulo Noir',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Triangulo%20Noir.png',
    },
    {
      name: 'Pendiente Triángulo Esmeralda',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Triangulo%20esmeralda.png',
    },
    {
      name: 'Pendiente Aura Carmín',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20Carmin.png',
    },
    {
      name: 'Pendiente Aura Turquesa',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20turquesa.png',
    },
    {
      name: 'Pendiente Aura Marfil',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20marfil.png',
    },
    {
      name: 'Pendiente Aura Nácar',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20nacar.png',
    },
    {
      name: 'Pendiente Aura Noir',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Aura%20Noir.png',
    },
    {
      name: 'Pendiente Corona',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Corona.png',
    },
    {
      name: 'Pendiente Imperial',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendiente%20Imperial.PNG',
    },
    {
      name: 'Pendientes Lágrima Imperial Azul',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Imperial%20Azul.PNG',
    },
    {
      name: 'Pendientes Lágrima Esmeralda Profunda',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Esmeralda%20Profunda.PNG',
    },
    {
      name: 'Pendientes Lágrima Buganvilla Real',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Buganvilla%20Real%20.PNG',
    },
    {
      name: 'Pendientes Lágrima Rosa Empolvado',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Rosa%20Empolvado%20.PNG',
    },
    {
      name: 'Pendientes Lágrima Marfil Dorado',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Marfil%20Dorado.PNG',
    },
    {
      name: 'Pendientes Lágrima Jade Dorado',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Jade%20Dorado.PNG',
    },
    {
      name: 'Pendientes Lágrima Coral Dorado',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20lagrima%20Coral%20Dorado.PNG',
    },
    {
      name: 'Pendientes Lágrima Vino Imperial',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Lagrima%20Vino%20Imperial.PNG',
    },
    {
      name: 'Pendientes Geometría Azul Real',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Geometria%20Azul%20Real.PNG',
    },
    {
      name: 'Pendientes Geometría Esmeralda',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Geometria%20Esmeralda.jpg',
    },
    {
      name: 'Pendientes Isabela Aguamarina',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Isabela%20Aguamarina.PNG',
    },
    {
      name: 'Pendientes Isabela Vino',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Isabela%20Vino.PNG',
    },
    {
      name: 'Pendientes Soberana Grandes',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Soberana%20Grandes.PNG',
    },
    {
      name: 'Pendientes Soberana Little',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20soberana%20little.PNG',
    },
    {
      name: 'Pendientes Isolde',
      image_url:
        'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/accesorios/Pendientes%20Isolde.PNG',
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
    collection: string
    supabase_id: string
    before_name: string
    after_name: string
    before_image_url: string | null
    after_image_url: string
    score: number
  }> = []
  const errors: Array<{ collection: string; target_name: string; reason: string; candidates?: any[] }> = []

  for (const [collection, items] of Object.entries(COLLECTION_UPDATES)) {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,image_url,collection')
      .ilike('collection', collection)
      .limit(5000)

    if (error) {
      errors.push({ collection, target_name: '*', reason: error.message })
      continue
    }

    const rows: Array<{ id: string; name: string; image_url: string | null }> = (data ?? []).map((r: any) => ({
      id: String(r.id),
      name: String(r.name ?? ''),
      image_url: r.image_url ?? null,
    }))

    const used = new Set<string>()

    for (const item of items) {
      const scored = rows
        .filter((r) => !used.has(r.id))
        .map((r) => ({ row: r, score: scorePair(item.name, r.name) }))
        .sort((a, b) => b.score - a.score)

      const best = scored[0]
      const second = scored[1]

      if (!best || best.score < 0.82 || (second && best.score - second.score < 0.08)) {
        errors.push({
          collection,
          target_name: item.name,
          reason: !best
            ? 'No candidates'
            : best.score < 0.82
              ? 'Low confidence match'
              : 'Ambiguous match',
          candidates: scored.slice(0, 5).map((c) => ({ id: c.row.id, name: c.row.name, score: c.score })),
        })
        continue
      }

      used.add(best.row.id)

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ name: item.name, image_url: item.image_url, collection })
          .eq('id', best.row.id)
        if (updateError) {
          errors.push({ collection, target_name: item.name, reason: updateError.message })
          continue
        }
      }

      updated.push({
        collection,
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

