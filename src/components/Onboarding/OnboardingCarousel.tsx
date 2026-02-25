import { useState, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { OnboardingGuide } from '../../constants/onboardingGuides'
import { OnboardingSlide } from './OnboardingSlide'
import './OnboardingCarousel.css'

interface OnboardingCarouselProps {
  guide: OnboardingGuide
  onComplete: () => void
  /** Dernier slide ouverture : Inscris-toi → inscription */
  onCtaRegister?: () => void
  /** Dernier slide ouverture : Se connecter → connexion */
  onCtaLogin?: () => void
}

const SWIPE_THRESHOLD = 50
const MAX_DRAG = 120

export function OnboardingCarousel({ guide, onComplete, onCtaRegister, onCtaLogin }: OnboardingCarouselProps) {
  const { i18n } = useTranslation()
  const nextLabel = i18n.language === 'fr' ? 'Continuer' : 'Next'
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const touchStartX = useRef(0)
  const isOpening = guide.id === 'opening'
  const slides = guide.slides
  const isLast = index === slides.length - 1

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete()
    } else {
      setIndex((i) => Math.min(i + 1, slides.length - 1))
    }
  }, [isLast, onComplete, slides.length])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const handleSkip = useCallback(() => {
    if (isOpening) {
      setIndex(slides.length - 1)
    } else {
      onComplete()
    }
  }, [isOpening, onComplete, slides.length])

  const handleCtaRegister = useCallback(() => {
    if (onCtaRegister) onCtaRegister()
    else onComplete()
  }, [onCtaRegister, onComplete])

  const handleCtaLogin = useCallback(() => {
    if (onCtaLogin) onCtaLogin()
    else onComplete()
  }, [onCtaLogin, onComplete])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const x = e.touches[0].clientX
    const delta = x - touchStartX.current
    const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, delta))
    setDragX(clamped)
  }

  const handleTouchEnd = () => {
    if (dragX < -SWIPE_THRESHOLD) {
      goNext()
    } else if (dragX > SWIPE_THRESHOLD) {
      goPrev()
    }
    setDragX(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return
    const delta = e.clientX - touchStartX.current
    const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, delta))
    setDragX(clamped)
  }

  const handleMouseUp = () => {
    if (dragX < -SWIPE_THRESHOLD) goNext()
    else if (dragX > SWIPE_THRESHOLD) goPrev()
    setDragX(0)
  }

  const handleMouseLeave = () => {
    setDragX(0)
  }

  return (
    <div
      className="onboarding-carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="onboarding-carousel__track"
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragX}px))`,
          transition: dragX !== 0 ? 'none' : undefined
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="onboarding-carousel__slide-wrap">
            <OnboardingSlide
              slide={slide}
              onSkip={handleSkip}
              onNext={goNext}
              isActive={i === index}
              isLastAndOpening={isOpening && isLast}
              onCtaRegister={isLast ? handleCtaRegister : undefined}
              onCtaLogin={isLast ? handleCtaLogin : undefined}
            />
          </div>
        ))}
      </div>

      {/* Flèche retour */}
      {index > 0 && (
        <button
          type="button"
          className="onboarding-carousel__arrow onboarding-carousel__arrow--prev"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Slide précédent"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Flèche suivant */}
      <button
        type="button"
        className="onboarding-carousel__arrow onboarding-carousel__arrow--next"
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        aria-label={isLast ? 'Terminer' : 'Slide suivant'}
      >
        <ChevronRight size={28} strokeWidth={2.5} />
      </button>

      {/* Bloc bas : points au-dessus du bouton pill (style référence) */}
      <div className="onboarding-carousel__footer">
        <div className="onboarding-carousel__dots" aria-hidden>
          {slides.map((_, i) => (
            <span
              key={i}
              className={`onboarding-carousel__dot ${i === index ? 'onboarding-carousel__dot--active' : ''}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="onboarding-carousel__next-btn"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label={nextLabel}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
