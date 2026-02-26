import {
  Building2,
  Briefcase,
  Calendar,
  Camera,
  ShoppingBag,
  Target,
  Users
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import './CategoryPlaceholderMedia.css'

type CategoryVisual = {
  color: string
  label: string
  icon: LucideIcon
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  'creation-contenu': { color: '#667eea', label: 'Creation', icon: Camera },
  'casting-role': { color: '#2196f3', label: 'Casting', icon: Users },
  emploi: { color: '#9c27b0', label: 'Emploi', icon: Briefcase },
  'studio-lieu': { color: '#f59e0b', label: 'Lieu', icon: Building2 },
  services: { color: '#43e97b', label: 'Service', icon: Target },
  evenements: { color: '#06b6d4', label: 'Evenement', icon: Calendar },
  vente: { color: '#f093fb', label: 'Vente', icon: ShoppingBag }
}

const DEFAULT_VISUAL: CategoryVisual = {
  color: '#6b7280',
  label: 'Annonce',
  icon: Camera
}

interface CategoryPlaceholderMediaProps {
  categorySlug?: string | null
  className?: string
}

export default function CategoryPlaceholderMedia({
  categorySlug,
  className
}: CategoryPlaceholderMediaProps) {
  const visual = (categorySlug ? CATEGORY_VISUALS[categorySlug] : null) || DEFAULT_VISUAL
  const Icon = visual.icon

  return (
    <div
      className={`category-placeholder-media ${className || ''}`.trim()}
      style={{ '--category-accent': visual.color } as CSSProperties}
      aria-hidden="true"
    >
      <div className="category-placeholder-shape shape-one" />
      <div className="category-placeholder-shape shape-two" />
      <div className="category-placeholder-icon-wrap">
        <Icon size={28} strokeWidth={2.1} />
      </div>
    </div>
  )
}
