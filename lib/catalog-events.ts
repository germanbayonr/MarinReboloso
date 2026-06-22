export const CATALOG_CHANGED_EVENT = 'marebo:catalog-changed'

export function notifySiteCatalogChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CATALOG_CHANGED_EVENT))
}
