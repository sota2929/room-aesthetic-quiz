export const aestheticIds = [
  'cozy-minimalist',
  'clean-girl',
  'dark-academia',
  'soft-girl',
  'modern-boho',
  'moody-maximalist',
] as const

export type AestheticId = (typeof aestheticIds)[number]
export type ScoreWeights = Partial<Record<AestheticId, number>>

export interface QuizAnswer {
  id: string
  text: string
  detail?: string
  emoji: string
  swatches?: string[]
  scores: ScoreWeights
}

export interface QuizQuestion {
  id: string
  eyebrow: string
  text: string
  answers: QuizAnswer[]
}

export interface AestheticResult {
  id: AestheticId
  name: string
  tagline: string
  description: string
  vibe: string[]
  colors: { name: string; hex: string }[]
  decor: string[]
  avoid: string[]
  steps: string[]
  kitBestFor: string[]
  accent: string
  softAccent: string
  symbol: string
}
