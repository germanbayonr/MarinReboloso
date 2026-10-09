import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const root = process.cwd()
const env = Object.fromEntries(
  fs.readFileSync(`${root}/.env.local`, 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    }),
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  const webp = await sharp(png).webp().toBuffer()
  const path = `products/test-pipeline-${Date.now()}.webp`
  const { error } = await sb.storage.from('product-images').upload(path, webp, {
    contentType: 'image/webp',
    upsert: false,
  })
  if (error) {
    console.error('upload failed', error)
    process.exit(1)
  }
  const { data } = sb.storage.from('product-images').getPublicUrl(path)
  const url = data.publicUrl
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { cache: 'no-store' })
    console.log(`verify attempt ${i + 1}`, res.status)
    if (res.ok) break
    await new Promise((r) => setTimeout(r, 400))
  }
  await sb.storage.from('product-images').remove([path])
  console.log('pipeline OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
