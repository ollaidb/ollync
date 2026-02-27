/**
 * Crée une image recadrée à partir d'une source et des coordonnées de crop.
 * Utilisé pour l'avatar après react-easy-crop.
 */

export interface CroppedAreaPixels {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Retourne un Blob JPEG recadré à partir de l'image source et de la zone de crop en pixels.
 */
export async function createCroppedImage(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  outputType: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality = 0.9
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2d non disponible')
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Échec toBlob'))
      },
      outputType,
      quality
    )
  })
}
