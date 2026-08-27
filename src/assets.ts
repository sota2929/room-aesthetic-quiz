import heroRoom from './assets/rooms/hero-room.jpg'
import cleanGirl from './assets/rooms/clean-girl.jpg'
import cozyMinimalist from './assets/rooms/cozy-minimalist.jpg'
import darkAcademia from './assets/rooms/dark-academia.jpg'
import modernBoho from './assets/rooms/modern-boho.jpg'
import moodyMaximalist from './assets/rooms/moody-maximalist.jpg'
import softGirl from './assets/rooms/soft-girl.jpg'
import cleanGirlShop from './assets/shop/clean-girl-shop.webp'
import cozyMinimalistShop from './assets/shop/cozy-minimalist-shop.webp'
import darkAcademiaShop from './assets/shop/dark-academia-shop.webp'
import modernBohoShop from './assets/shop/modern-boho-shop.webp'
import moodyMaximalistShop from './assets/shop/moody-maximalist-shop.webp'
import softGirlShop from './assets/shop/soft-girl-shop.webp'
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

export const shopImages: Record<AestheticId, string> = {
  'cozy-minimalist': cozyMinimalistShop,
  'clean-girl': cleanGirlShop,
  'dark-academia': darkAcademiaShop,
  'soft-girl': softGirlShop,
  'modern-boho': modernBohoShop,
  'moody-maximalist': moodyMaximalistShop,
}
