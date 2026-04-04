/**
 * Crea o actualiza el usuario administrador en Supabase Auth.
 * Uso: node --env-file=.env.local scripts/seed-admin-user.mjs
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

const email = 'marebo.meri@gmail.com'
const password = 'admin123'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  })

  if (!createErr && created?.user) {
    console.log('Usuario admin creado:', created.user.email)
    return
  }

  if (createErr?.message?.toLowerCase().includes('already') || createErr?.status === 422) {
    let page = 1
    let found = null
    while (page <= 20 && !found) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (listErr) {
        console.error('listUsers:', listErr.message)
        process.exit(1)
      }
      found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
      if (found) break
      if (!list?.users?.length) break
      page += 1
    }
    if (!found) {
      console.error('No se pudo localizar el usuario existente:', createErr?.message)
      process.exit(1)
    }
    const { error: updErr } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      user_metadata: { ...found.user_metadata, role: 'admin' },
    })
    if (updErr) {
      console.error('updateUserById:', updErr.message)
      process.exit(1)
    }
    console.log('Usuario admin ya existía; contraseña y metadata actualizados:', email)
    return
  }

  console.error('createUser:', createErr?.message)
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
