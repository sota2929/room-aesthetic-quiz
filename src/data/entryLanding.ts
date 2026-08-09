import type { AestheticId } from '../types'

export type EntryKey = AestheticId | 'dorm' | 'small-room'

type EntryLanding = {
  eyebrow: string
  headline: string
  emphasis: string
  description: string
  cta: string
  image: AestheticId | 'hero'
  imageAlt: string
}

export const entryLandings: Record<EntryKey, EntryLanding> = {
  'cozy-minimalist': { eyebrow: 'Cozy, not cluttered', headline: 'Is Cozy Minimalist', emphasis: 'your room aesthetic?', description: 'Find out whether warm neutrals, soft texture, and room to breathe are your best style direction.', cta: 'Take the Free Quiz', image: 'cozy-minimalist', imageAlt: 'Warm neutral Cozy Minimalist bedroom' },
  'clean-girl': { eyebrow: 'Bright, calm, intentional', headline: 'Is Clean Girl Room', emphasis: 'your aesthetic?', description: 'See whether fresh bedding, a clear desk, and soft morning light match the room you want.', cta: 'Take the Free Quiz', image: 'clean-girl', imageAlt: 'Bright and organized Clean Girl bedroom' },
  'dark-academia': { eyebrow: 'Old-library energy', headline: 'Is Dark Academia', emphasis: 'your room aesthetic?', description: 'Find out whether books, deep color, vintage details, and amber light belong in your dream room.', cta: 'Take the Free Quiz', image: 'dark-academia', imageAlt: 'Moody Dark Academia bedroom with warm lighting' },
  'soft-girl': { eyebrow: 'Dreamy color, clear direction', headline: 'Is Soft Girl / Pastel', emphasis: 'your room aesthetic?', description: 'See whether an intentional pastel palette and cozy, playful details are your best match.', cta: 'Take the Free Quiz', image: 'soft-girl', imageAlt: 'Soft pastel bedroom with playful details' },
  'modern-boho': { eyebrow: 'Earthy, sunny, relaxed', headline: 'Is Modern Boho', emphasis: 'your room aesthetic?', description: 'Find out whether warm earth tones, natural texture, and relaxed light fit your space.', cta: 'Take the Free Quiz', image: 'modern-boho', imageAlt: 'Earthy Modern Boho bedroom with natural texture' },
  'moody-maximalist': { eyebrow: 'Bold color, meaningful layers', headline: 'Is Moody Maximalist', emphasis: 'your room aesthetic?', description: 'See whether jewel tones, collected art, and dramatic layers are the room direction for you.', cta: 'Take the Free Quiz', image: 'moody-maximalist', imageAlt: 'Layered Moody Maximalist bedroom with jewel tones' },
  dorm: { eyebrow: 'Before move-in shopping', headline: 'What’s Your Dorm Room', emphasis: 'Aesthetic?', description: 'Find a room style that works for a small space, a limited budget, and a room that still feels like you.', cta: 'Find My Dorm Style', image: 'clean-girl', imageAlt: 'Bright compact bedroom styled for a dorm' },
  'small-room': { eyebrow: 'Small room, clear point of view', headline: 'Find Your Small', emphasis: 'Bedroom Style', description: 'Before buying more decor, find the colors, mood, and pieces that actually fit your space.', cta: 'Take the Free Quiz', image: 'hero', imageAlt: 'Warm, thoughtfully planned small bedroom' },
}

export function getEntryLanding(entry?: string) {
  return entry && entry in entryLandings ? entryLandings[entry as EntryKey] : undefined
}
