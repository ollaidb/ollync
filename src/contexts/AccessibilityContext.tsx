import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

const STORAGE_CONTRAST = 'accessibility-contrast'
const STORAGE_FONT_SIZE = 'accessibility-font-size'

export type ContrastMode = 'default' | 'high'
export type FontSizeMode = 'normal' | 'large'

interface AccessibilityState {
  contrast: ContrastMode
  fontSize: FontSizeMode
}

interface AccessibilityContextValue extends AccessibilityState {
  setContrast: (value: ContrastMode) => void
  setFontSize: (value: FontSizeMode) => void
}

const defaultValue: AccessibilityContextValue = {
  contrast: 'default',
  fontSize: 'normal',
  setContrast: () => {},
  setFontSize: () => {}
}

const AccessibilityContext = createContext<AccessibilityContextValue>(defaultValue)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [contrast, setContrastState] = useState<ContrastMode>(() => {
    const saved = localStorage.getItem(STORAGE_CONTRAST)
    return (saved === 'high' ? 'high' : 'default') as ContrastMode
  })
  const [fontSize, setFontSizeState] = useState<FontSizeMode>(() => {
    const saved = localStorage.getItem(STORAGE_FONT_SIZE)
    return (saved === 'large' ? 'large' : 'normal') as FontSizeMode
  })

  const setContrast = useCallback((value: ContrastMode) => {
    setContrastState(value)
    localStorage.setItem(STORAGE_CONTRAST, value)
    document.documentElement.setAttribute('data-accessibility-contrast', value)
  }, [])

  const setFontSize = useCallback((value: FontSizeMode) => {
    setFontSizeState(value)
    localStorage.setItem(STORAGE_FONT_SIZE, value)
    document.documentElement.setAttribute('data-accessibility-font-size', value)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-accessibility-contrast', contrast)
    document.documentElement.setAttribute('data-accessibility-font-size', fontSize)
  }, [contrast, fontSize])

  useEffect(() => {
    const savedContrast = localStorage.getItem(STORAGE_CONTRAST) as ContrastMode | null
    const savedFontSize = localStorage.getItem(STORAGE_FONT_SIZE) as FontSizeMode | null
    if (savedContrast === 'high' || savedContrast === 'default') {
      document.documentElement.setAttribute('data-accessibility-contrast', savedContrast)
    }
    if (savedFontSize === 'large' || savedFontSize === 'normal') {
      document.documentElement.setAttribute('data-accessibility-font-size', savedFontSize)
    }
  }, [])

  const value: AccessibilityContextValue = {
    contrast,
    fontSize,
    setContrast,
    setFontSize
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook export
export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  return ctx ?? defaultValue
}
