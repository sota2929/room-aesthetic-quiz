import heroRoom from './assets/rooms/hero-room.jpg'
import cleanGirl from './assets/rooms/clean-girl.jpg'
import cozyMinimalist from './assets/rooms/cozy-minimalist.jpg'
import darkAcademia from './assets/rooms/dark-academia.jpg'
import modernBoho from './assets/rooms/modern-boho.jpg'
import moodyMaximalist from './assets/rooms/moody-maximalist.jpg'
import softGirl from './assets/rooms/soft-girl.jpg'
import type { AestheticId } from './types'

export { heroRoom }

export const roomImages: Record<AestheticId, string> = {
  'cozy-minimalist': cozyMinimalist,
  'clean-girl': cleanGirl,
  'dark-academia': darkAcademia,
  'soft-girl': softGirl,
  'modern-boho': modernBoho,
  'moody-maximalist': moodyMaximalist,
}
