const STOP_WORDS = new Set([
  'a',
  'about',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'our',
  'should',
  'that',
  'the',
  'their',
  'this',
  'to',
  'we',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'you',
  'your',
])

const TERM_EXPANSIONS: Record<string, string[]> = {
  autonomous: ['auto', 'opmode', 'programming'],
  code: ['java', 'blocks', 'onbot', 'programming', 'sdk'],
  control: ['control hub', 'driver hub', 'robot controller'],
  drive: ['drivetrain', 'mecanum', 'teleop'],
  judging: ['award', 'interview', 'portfolio'],
  program: ['java', 'blocks', 'onbot', 'programming', 'sdk'],
  programming: ['java', 'blocks', 'onbot', 'opmode', 'sdk'],
  ranking: ['rp'],
  register: ['registration', 'team'],
  rp: ['ranking', 'points'],
  rules: ['competition manual', 'game manual', 'penalty'],
  score: ['scoring', 'points'],
}

export function tokenize(value: string): string[] {
  const terms = value.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]*/g) ?? []
  const expanded = new Set<string>()

  for (const term of terms) {
    if (term.length > 1 && !STOP_WORDS.has(term)) {
      expanded.add(term)
      for (const related of TERM_EXPANSIONS[term] ?? []) {
        expanded.add(related)
      }
    }
  }

  return Array.from(expanded)
}

export function scoreText(query: string, text: string): number {
  const normalizedText = text.toLowerCase()
  const terms = tokenize(query)
  let score = 0

  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matches = normalizedText.match(new RegExp(`\\b${escaped}\\b`, 'g'))
    if (matches) {
      score += Math.min(matches.length, 8)
    }
  }

  const normalizedQuery = query.toLowerCase().trim()
  if (normalizedQuery.length >= 8 && normalizedText.includes(normalizedQuery)) {
    score += 12
  }

  return score
}
