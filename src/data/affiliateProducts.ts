import { SITE_CONFIG } from '../config'
import type { AestheticId } from '../types'

export interface AffiliateProduct {
  id: string
  name: string
  description: string
  search: string
}

export const affiliateProducts: Record<AestheticId, AffiliateProduct[]> = {
  'cozy-minimalist': [
    { id: 'warm-lamp', name: 'Warm bedside lamp', description: 'Soft, dimmable light for a calmer evening atmosphere.', search: 'warm dimmable bedside lamp bedroom' },
    { id: 'neutral-bedding', name: 'Neutral bedding', description: 'Cream or oatmeal layers that make the room feel restful.', search: 'beige comforter set queen bedroom' },
    { id: 'woven-storage', name: 'Woven storage baskets', description: 'Hide everyday clutter without adding visual noise.', search: 'woven storage baskets bedroom' },
  ],
  'clean-girl': [
    { id: 'vanity-organizer', name: 'Clear vanity organizer', description: 'Give skincare and daily essentials one polished home.', search: 'clear vanity organizer skincare makeup' },
    { id: 'lighted-mirror', name: 'Lighted tabletop mirror', description: 'A practical focal point for a simple self-care corner.', search: 'lighted vanity mirror tabletop' },
    { id: 'desk-organizer', name: 'White desk organizer', description: 'Keep a bright workspace clear and easy to reset.', search: 'white desk organizer aesthetic bedroom' },
  ],
  'dark-academia': [
    { id: 'bankers-lamp', name: 'Green banker lamp', description: 'Classic amber-toned task lighting for reading and study.', search: 'green banker desk lamp vintage' },
    { id: 'vintage-frames', name: 'Vintage-style frames', description: 'Build a collected gallery wall with old-library character.', search: 'vintage gold picture frames set wall' },
    { id: 'velvet-pillows', name: 'Dark velvet pillow covers', description: 'Add burgundy, forest, or espresso depth without repainting.', search: 'dark green burgundy velvet throw pillow covers' },
  ],
  'soft-girl': [
    { id: 'pastel-bedding', name: 'Pastel bedding', description: 'Make the bed a soft, colorful focal point.', search: 'pastel pink comforter set bedroom' },
    { id: 'fairy-lights', name: 'Warm fairy lights', description: 'Create a dreamy glow without harsh overhead lighting.', search: 'warm white fairy lights bedroom' },
    { id: 'mushroom-lamp', name: 'Pastel mushroom lamp', description: 'A playful accent that still feels useful and intentional.', search: 'pink mushroom table lamp bedroom' },
  ],
  'modern-boho': [
    { id: 'rattan-shelf', name: 'Rattan wall shelf', description: 'Bring in natural texture while keeping the floor open.', search: 'rattan wall shelf bedroom boho' },
    { id: 'terracotta-pillows', name: 'Terracotta pillow covers', description: 'Add an earthy color layer with an easy, low-commitment swap.', search: 'terracotta throw pillow covers boho' },
    { id: 'trailing-plant', name: 'Trailing faux plant', description: 'Introduce greenery where a live plant may be hard to maintain.', search: 'realistic faux trailing plant bedroom' },
  ],
  'moody-maximalist': [
    { id: 'jewel-pillows', name: 'Jewel-tone velvet pillows', description: 'Layer emerald, navy, or wine tones around one clear palette.', search: 'jewel tone velvet throw pillow covers' },
    { id: 'gold-mirror', name: 'Ornate gold mirror', description: 'Create a dramatic focal point that reflects warm light.', search: 'ornate gold wall mirror bedroom' },
    { id: 'gallery-frames', name: 'Eclectic gallery frames', description: 'Give favorite art a deliberate, collected structure.', search: 'eclectic gallery wall frames set' },
  ],
}

export function amazonSearchUrl(search: string) {
  const url = new URL('https://www.amazon.com/s')
  url.searchParams.set('k', search)
  url.searchParams.set('tag', SITE_CONFIG.amazonAssociateTag)
  return url.toString()
}
