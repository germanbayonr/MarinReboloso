/** Invitado: solo sessionStorage (se limpia al cerrar la pestaña). Usuario: localStorage por id. */
export const CART_SESSION_KEY = 'marebo_cart_v1'
export const WISHLIST_SESSION_KEY = 'marebo_wishlist_v1'
/** Claves antiguas en localStorage que ya no deben usar los invitados (evita cestas “fantasma”). */
export const CART_LEGACY_LOCAL_KEY = 'marebo_cart_v1'
export const WISHLIST_LEGACY_LOCAL_KEY = 'marebo_wishlist_v1'

export function cartStorageKeyForUser(userId: string) {
  return `marebo_cart_v1_u_${userId}`
}

export function wishlistStorageKeyForUser(userId: string) {
  return `marebo_wishlist_v1_u_${userId}`
}

export function isProductUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
