/** Precarga imágenes en el navegador (caché) antes de mostrarlas en <Image>. */

export function preloadImageUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url?.trim()) {
      resolve()
      return
    }
    const img = new window.Image()
    img.decoding = 'async'
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

export async function preloadImageUrls(
  urls: string[],
  options?: { concurrency?: number },
): Promise<void> {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))]
  if (unique.length === 0) return

  const concurrency = Math.max(1, options?.concurrency ?? 6)
  let index = 0

  async function worker() {
    while (index < unique.length) {
      const current = unique[index]
      index += 1
      await preloadImageUrl(current)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, unique.length) }, () => worker())
  await Promise.all(workers)
}
