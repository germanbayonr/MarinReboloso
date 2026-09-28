#!/usr/bin/env node
/**
 * Sube el logo de marca a Bunny (Logo/) y genera icono cuadrado 512px para favicon / Google.
 * Uso: BUNNY_STORAGE_ACCESS_KEY=... node scripts/upload-brand-logo.mjs [ruta-imagen.jpg]
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const STORAGE_ZONE = 'marebo'
const ACCESS_KEY =
  process.env.BUNNY_STORAGE_ACCESS_KEY?.trim() ||
  process.env.BUNNY_ACCESS_KEY?.trim() ||
  ''

const DEFAULT_SOURCE = path.resolve(
  '/Users/Wincoaching1/.cursor/projects/Users-Wincoaching1-Proyectos-Desarrollador-MarinReboloso/assets/WhatsApp_Image_2026-09-23_at_11.26.42-3e2b2c4c-4495-4a46-bb6e-00ee2ad9bb24.jpg',
)

async function uploadToBunny(relativePath, buffer, contentType) {
  const url = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${relativePath}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: ACCESS_KEY,
      'Content-Type': contentType,
    },
    body: buffer,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Bunny PUT ${relativePath} → ${res.status} ${text}`)
  }
}

async function main() {
  if (!ACCESS_KEY) {
    console.error('Falta BUNNY_STORAGE_ACCESS_KEY (o BUNNY_ACCESS_KEY).')
    process.exit(1)
  }

  const sourcePath = path.resolve(process.argv[2] || DEFAULT_SOURCE)
  const source = await fs.readFile(sourcePath)

  const logoPath = 'Logo/marebo-marca-marina-marin-reboloso-2026.jpg'
  const iconPath = 'Logo/marebo-icon-512.jpg'

  const iconBuffer = await sharp(source)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()

  await uploadToBunny(logoPath, source, 'image/jpeg')
  await uploadToBunny(iconPath, iconBuffer, 'image/jpeg')

  const publicDir = path.join(process.cwd(), 'public', 'brand')
  await fs.mkdir(publicDir, { recursive: true })
  await fs.writeFile(path.join(publicDir, 'marebo-marca-2026.jpg'), source)
  await fs.writeFile(path.join(publicDir, 'marebo-icon-512.jpg'), iconBuffer)

  console.log('✅ Logo subido:')
  console.log(`   https://marebo.b-cdn.net/${logoPath}`)
  console.log(`   https://marebo.b-cdn.net/${iconPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
