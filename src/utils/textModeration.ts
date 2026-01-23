type ModerationReason = 'insulte' | 'nudite' | 'pedo'

interface ModerationRule {
  reason: ModerationReason
  score: number
  pattern: RegExp
}

interface ModerationResult {
  score: number
  reasons: ModerationReason[]
  shouldBlock: boolean
}

const REPLACEMENTS: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's'
}

const RULES: ModerationRule[] = [
  {
    reason: 'pedo',
    score: 100,
    pattern: /\b(pedo|p[ée]dophil(e|ie)|mineur(e|s)?|enfant|13\s?ans|12\s?ans|11\s?ans|10\s?ans|9\s?ans)\b/
  },
  {
    reason: 'nudite',
    score: 60,
    pattern: /\b(nu|nue|nudite|nude|porn|porno|xxx|sex(e|uel|uelle)?|anal|baise|sodomie)\b/
  },
  {
    reason: 'insulte',
    score: 30,
    pattern: /\b(connard|conne|salope|pute|fdp|enfoire|batard|bastard|pd|encule|sale|raciste)\b/
  }
]

const BLOCK_THRESHOLD = 60

function normalizeText(raw: string): string {
  const lower = raw.toLowerCase()
  const deaccented = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const replaced = deaccented.replace(/[013457@$]/g, (char) => REPLACEMENTS[char] || char)
  return replaced.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function evaluateTextModeration(text: string): ModerationResult {
  const normalized = normalizeText(text)
  let score = 0
  const reasons: ModerationReason[] = []

  RULES.forEach((rule) => {
    if (rule.pattern.test(normalized)) {
      score += rule.score
      if (!reasons.includes(rule.reason)) {
        reasons.push(rule.reason)
      }
    }
  })

  return {
    score,
    reasons,
    shouldBlock: score >= BLOCK_THRESHOLD
  }
}
