import { useState, useEffect } from 'react'
import {
  Sparkles,
  Compass,
  MessageCircle,
  User,
  LogIn,
  Zap,
  Edit3,
  Image,
  Send,
  Home,
  Filter,
  PlusCircle,
  Calendar,
  SlidersHorizontal,
  Inbox,
  FileText,
  Settings,
  LucideIcon
} from 'lucide-react'
import type { OnboardingSlideData } from '../../constants/onboardingGuides'
import './OnboardingSlide.css'

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Compass,
  MessageCircle,
  User,
  LogIn,
  Zap,
  Edit3,
  Image,
  Send,
  Home,
  Filter,
  PlusCircle,
  Calendar,
  SlidersHorizontal,
  Inbox,
  FileText,
  Settings
}

const DEFAULT_SLIDE_COLOR = '#FF6B35'

interface OnboardingSlideProps {
  slide: OnboardingSlideData
  onSkip: () => void
  onNext?: () => void
  isActive: boolean
  isLastAndOpening?: boolean
  onCtaRegister?: () => void
  onCtaLogin?: () => void
}

export function OnboardingSlide({
  slide,
  onSkip,
  onNext,
  isActive,
  isLastAndOpening,
  onCtaRegister,
  onCtaLogin
}: OnboardingSlideProps) {
  const [animatedIndex, setAnimatedIndex] = useState(-1)
  const hasAnimatedPhrases = slide.animatedPhrases && slide.animatedPhrases.length > 0
  const bgColor = slide.color ?? DEFAULT_SLIDE_COLOR

  useEffect(() => {
    if (!isActive) {
      setAnimatedIndex(-1)
      return
    }
    if (!hasAnimatedPhrases) {
      setAnimatedIndex(0)
      return
    }
    setAnimatedIndex(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    slide.animatedPhrases!.forEach((_, i) => {
      timers.push(setTimeout(() => setAnimatedIndex(i), 350 + i * 550))
    })
    return () => timers.forEach(clearTimeout)
  }, [isActive, hasAnimatedPhrases, slide.animatedPhrases])

  const IconComponent = slide.icon ? ICON_MAP[slide.icon] : null
  const hasGradient = slide.gradient && slide.gradient.length >= 2
  const isWelcomeLayout = slide.layout === 'welcome'
  const slideStyle = isWelcomeLayout
    ? { backgroundColor: '#FF6F61' }
    : hasGradient
      ? {
          background: `linear-gradient(135deg, ${slide.gradient!.join(', ')})`,
          backgroundColor: bgColor
        }
      : { backgroundColor: bgColor }

  return (
    <div
      className={`onboarding-slide ${isWelcomeLayout ? 'onboarding-slide--welcome' : ''} ${isWelcomeLayout && isActive ? 'onboarding-slide--blobs-run' : ''}`}
      data-active={isActive}
      style={slideStyle}
    >
      {isWelcomeLayout && (
        <>
          <div className="onboarding-slide__blob onboarding-slide__blob--1" aria-hidden />
          <div className="onboarding-slide__blob onboarding-slide__blob--2" aria-hidden />
          <div className="onboarding-slide__blob onboarding-slide__blob--3" aria-hidden />
          <div className="onboarding-slide__screensaver-ball" aria-hidden />
        </>
      )}

      <div
        className="onboarding-slide__content"
        onClick={() => onNext?.()}
        role="button"
        tabIndex={0}
        aria-label="Passer au slide suivant"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNext?.() }}
      >
        {isWelcomeLayout ? (
          <div className="onboarding-slide__welcome">
            <div className="onboarding-slide__welcome-line">BIENVENUE SUR</div>
            <svg
              className="onboarding-slide__welcome-arrow"
              viewBox="0 0 80 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M 55 8 Q 72 28 48 42 Q 28 52 18 48"
                stroke="#1a1a1a"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 55 8 Q 72 28 48 42 Q 28 52 18 48"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="onboarding-slide__welcome-brand">Ollync</div>
            {hasAnimatedPhrases && (
              <div className="onboarding-slide__animated-phrases onboarding-slide__animated-phrases--welcome">
                {slide.animatedPhrases!.map((phrase, i) => (
                  <span
                    key={i}
                    className={`onboarding-slide__phrase ${animatedIndex >= i ? 'onboarding-slide__phrase--visible' : ''}`}
                  >
                    {phrase}
                    {i < slide.animatedPhrases!.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {IconComponent && (
              <div className="onboarding-slide__icon-wrap" aria-hidden>
                <IconComponent className="onboarding-slide__icon" size={48} strokeWidth={1.8} />
              </div>
            )}

            <h2 className="onboarding-slide__title">{slide.title}</h2>

            {hasAnimatedPhrases ? (
              <div className="onboarding-slide__animated-phrases">
                {slide.animatedPhrases!.map((phrase, i) => (
                  <span
                    key={i}
                    className={`onboarding-slide__phrase ${animatedIndex >= i ? 'onboarding-slide__phrase--visible' : ''}`}
                  >
                    {phrase}
                    {i < slide.animatedPhrases!.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </div>
            ) : null}

            {slide.content ? (
              <p className="onboarding-slide__body">{slide.content}</p>
            ) : isLastAndOpening && (onCtaRegister || onCtaLogin) ? (
              <div className="onboarding-slide__cta-wrap">
                {onCtaRegister && (
                  <button type="button" className="onboarding-slide__cta" onClick={(e) => { e.stopPropagation(); onCtaRegister(); }}>
                    Inscris-toi
                  </button>
                )}
                {onCtaLogin && (
                  <button type="button" className="onboarding-slide__cta onboarding-slide__cta--secondary" onClick={(e) => { e.stopPropagation(); onCtaLogin(); }}>
                    Se connecter
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      <button
        type="button"
        className="onboarding-slide__skip"
        onClick={(e) => { e.stopPropagation(); onSkip(); }}
        aria-label="Passer le guide"
      >
        Passer
      </button>
    </div>
  )
}
