/** Comprime una imagen a WebP en el navegador antes de subirla a Storage. */
export async function compressProductImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1500
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('No se pudo comprimir la imagen'))
          },
          'image/webp',
          0.8,
        )
      }
      img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
  })
}
