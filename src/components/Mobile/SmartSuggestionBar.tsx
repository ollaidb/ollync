import { useEffect, useMemo, useState } from 'react'
import './SmartSuggestionBar.css'

type SmartSuggestionContext = 'message' | 'publish'

interface SmartSuggestionBarProps {
  value: string
  cursorPosition?: number
  context: SmartSuggestionContext
  onSelectSuggestion: (suggestion: string) => void
  disabled?: boolean
}

const STORAGE_KEY = 'ollync-smart-suggestions-v1'
const MAX_STORED_WORDS = 140
const MAX_SUGGESTIONS = 6

const COMMON_FR_WORDS = [
  'bonjour', 'salut', 'merci', 'ok', 'super', 'disponible', 'rapidement', 'aujourdhui', 'demain', 'soir',
  'matin', 'apres-midi', 'horaire', 'details', 'precisions', 'interesse', 'interessee', 'possible', 'parfait',
  'validation', 'confirmation', 'proposition', 'collaboration', 'projet', 'annonce', 'rencontre'
]

const MESSAGE_WORDS = [
  'rdv', 'rendez-vous', 'envoyer', 'partager', 'transfert', 'photo', 'video', 'document', 'merci-beaucoup',
  'dispo', 'oui', 'non', 'reponse', 'question', 'adresse', 'coordonnees', 'telephone', 'whatsapp'
]

const PUBLISH_WORDS = [
  'mission', 'description', 'profil', 'experience', 'objectif', 'format', 'livrable', 'duree', 'budget',
  'remuneration', 'echange', 'visibilite', 'co-creation', 'contrat', 'deadline', 'publication', 'reseaux',
  'instagram', 'tiktok', 'youtube', 'community-manager', 'montage', 'shooting', 'casting'
]

const WORD_REGEX = /[A-Za-zÀ-ÖØ-öø-ÿ0-9'-]{2,}/g
const TOKEN_AT_END_REGEX = /([A-Za-zÀ-ÖØ-öø-ÿ0-9'-]{1,32})$/

const normalizeWord = (word: string) => word.trim().toLowerCase()

const uniqueWords = (words: string[]) => {
  const seen = new Set<string>()
  const result: string[] = []
  words.forEach((raw) => {
    const word = normalizeWord(raw)
    if (!word || seen.has(word)) return
    seen.add(word)
    result.push(word)
  })
  return result
}

const parseWords = (value: string) => {
  const matches = value.match(WORD_REGEX) || []
  return uniqueWords(matches)
}

export function SmartSuggestionBar({
  value,
  cursorPosition,
  context,
  onSelectSuggestion,
  disabled = false
}: SmartSuggestionBarProps) {
  const [storedWords, setStoredWords] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setStoredWords(uniqueWords(parsed.map((item) => String(item || ''))))
      }
    } catch {
      // ignore parse/storage errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const words = parseWords(value).filter((word) => word.length >= 4 && word.length <= 28)
    if (words.length === 0) return
    const merged = uniqueWords([...words, ...storedWords]).slice(0, MAX_STORED_WORDS)
    if (merged.join('|') === storedWords.join('|')) return
    setStoredWords(merged)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch {
      // ignore storage errors
    }
  }, [value, storedWords])

  const contextWords = context === 'message' ? MESSAGE_WORDS : PUBLISH_WORDS
  const dictionary = useMemo(
    () => uniqueWords([...contextWords, ...COMMON_FR_WORDS, ...storedWords]),
    [contextWords, storedWords]
  )

  const beforeCursor = value.slice(0, Math.max(0, cursorPosition ?? value.length))
  const currentToken = (beforeCursor.match(TOKEN_AT_END_REGEX)?.[1] || '').toLowerCase()

  const suggestions = useMemo(() => {
    if (!currentToken) return dictionary.slice(0, MAX_SUGGESTIONS)
    return dictionary
      .filter((word) => word.startsWith(currentToken) && word !== currentToken)
      .slice(0, MAX_SUGGESTIONS)
  }, [dictionary, currentToken])

  if (suggestions.length === 0) return null

  return (
    <div className="smart-suggestion-bar" role="listbox" aria-label="Suggestions de saisie">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          className="smart-suggestion-chip"
          onClick={() => onSelectSuggestion(suggestion)}
          disabled={disabled}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

