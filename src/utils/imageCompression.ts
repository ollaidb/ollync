/**
 * Compression d'images côté client pour réduire la bande passante et le stockage.
 * Utilise Canvas pour redimensionner et compresser (JPEG/WebP).
 */

const DEFAULT_MAX_WIDTH = 1920
const DEFAULT_MAX_HEIGHT = 1920
const DEFAULT_QUALITY = 0.85
const AVATAR_MAX_SIZE = 400

export interface CompressionOptions {
  /** Largeur max (px). Défaut: 1920 */
  maxWidth?: number
  /** Hauteur max (px). Défaut: 1920 */
  maxHeight?: number
  /** Qualité 0–1 (JPEG/WebP). Défaut: 0.85 */
  quality?: number
  /** Type MIME de sortie: 'image/jpeg' | 'image/webp'. Défaut: webp si supporté, sinon jpeg */
  outputType?: 'image/jpeg' | 'image/webp'
}

function getOutputMime(preferWebP: boolean): 'image/jpeg' | 'image/webp' {
  if (preferWebP && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    if (canvas.getContext('2d')?.getImageData(0, 0, 1, 1)) {
      const dataUri = canvas.toDataURL('image/webp')
      if (dataUri && dataUri.indexOf('data:image/webp') === 0) return 'image/webp'
    }
  }
  return 'image/jpeg'
}

/**
 * Compresse une image (File) et retourne un Blob.
 * Redimensionne si plus grand que maxWidth/maxHeight, compresse en JPEG ou WebP.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT
  const quality = options.quality ?? DEFAULT_QUALITY
  const outputType = options.outputType ?? getOutputMime(true)

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width <= maxWidth && height <= maxHeight) {
        width = img.width
        height = img.height
      } else {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2d non disponible'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Échec toBlob'))
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Échec chargement image'))
    }

    img.src = url
  })
}

/**
 * Compresse une image pour affichage dans une annonce (photos de post).
 * Taille max 1920px, qualité 0.85.
 */
export async function compressImageForPost(file: File): Promise<Blob> {
  return compressImage(file, {
    maxWidth: DEFAULT_MAX_WIDTH,
    maxHeight: DEFAULT_MAX_HEIGHT,
    quality: DEFAULT_QUALITY
  })
}

/**
 * Compresse une image pour avatar (petite taille).
 * Taille max 400px.
 */
export async function compressImageForAvatar(file: File): Promise<Blob> {
  return compressImage(file, {
    maxWidth: AVATAR_MAX_SIZE,
    maxHeight: AVATAR_MAX_SIZE,
    quality: 0.9
  })
}

/**
 * Indique si le type de fichier peut être compressé (JPEG, PNG, WebP, GIF).
 */
export function isCompressibleImageType(mime: string): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(mime)
}
