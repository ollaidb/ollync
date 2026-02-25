import { Helmet } from 'react-helmet-async'

const getAbsoluteImageUrl = (image: string | undefined | null): string => {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  if (!image) return `${origin}/og-image.png`
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return `${origin}${image.startsWith('/') ? image : `/${image}`}`
}

export interface PageMetaProps {
  /** Titre de la page (suffixe ou titre complet selon prependSiteName) */
  title: string
  /** Description pour meta description et og:description */
  description?: string | null
  /** URL d'image pour og:image (relative ou absolue). Si absent, utilise l'image par défaut. */
  image?: string | null
  /** Si true, le titre affiché sera "{{title}} | Ollync". Sinon titre tel quel. */
  prependSiteName?: boolean
}

const SITE_NAME = 'Ollync'

export function PageMeta({
  title,
  description = null,
  image = null,
  prependSiteName = true
}: PageMetaProps) {
  const fullTitle = prependSiteName ? `${title} | ${SITE_NAME}` : title
  const metaDescription = description || undefined
  const imageUrl = getAbsoluteImageUrl(image ?? undefined)

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {metaDescription && <meta name="description" content={metaDescription} />}
      <meta property="og:title" content={fullTitle} />
      {metaDescription && <meta property="og:description" content={metaDescription} />}
      <meta property="og:image" content={imageUrl} />
    </Helmet>
  )
}
