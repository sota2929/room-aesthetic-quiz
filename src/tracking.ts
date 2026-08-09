import { getAttribution } from './attribution'

type EventProperties = Record<string, string | number | boolean>
type PinterestEventData = EventProperties & { event_id: string }
type PinterestTracker = { (...args: unknown[]): void; queue: unknown[][]; version: string }
type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    pintrk?: PinterestTracker
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

const pinterestTagId = import.meta.env.VITE_PINTEREST_TAG_ID?.trim() || '2613658758244'
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
const gaDebugMode = new URLSearchParams(window.location.search).get('debug_mode') === '1'

const pinterestEventNames: Record<string, string> = {
  quiz_started: 'custom',
  quiz_completed: 'lead',
  result_viewed: 'viewcontent',
  product_cta_clicked: 'custom',
  retake_quiz_clicked: 'custom',
  result_shared: 'custom',
}

function eventId(eventName: string) {
  const randomPart = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${eventName}-${randomPart}`
}

function ensurePinterestTracker() {
  if (window.pintrk) return window.pintrk
  const tracker = ((...args: unknown[]) => {
    tracker.queue.push(args)
  }) as PinterestTracker
  tracker.queue = []
  tracker.version = '3.0'
  window.pintrk = tracker
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://s.pinimg.com/ct/core.js'
  document.head.appendChild(script)
  return tracker
}

function ensureGoogleAnalytics() {
  if (!gaMeasurementId) return undefined
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || []
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`
    document.head.appendChild(script)
    window.gtag('js', new Date())
    window.gtag('config', gaMeasurementId, {
      send_page_view: false,
      debug_mode: gaDebugMode,
      linker: { domains: ['sota2929.github.io', 'gumroad.com'] },
    })
  }
  return window.gtag
}

export function initializeTracking() {
  const attribution = { ...getAttribution(), ...(gaDebugMode ? { debug_mode: true } : {}) }
  if (pinterestTagId) {
    const pintrk = ensurePinterestTracker()
    pintrk('load', pinterestTagId)
    pintrk('page', attribution)
  }
  ensureGoogleAnalytics()?.('event', 'page_view', attribution)
}

export function trackEvent(eventName: string, properties: EventProperties = {}) {
  const data = { ...getAttribution(), ...properties, ...(gaDebugMode ? { debug_mode: true } : {}) }
  if (pinterestTagId) {
    const pinterestEventName = pinterestEventNames[eventName] ?? eventName
    const pinterestData: PinterestEventData = { ...data, event_id: eventId(eventName) }
    if (pinterestEventName === 'lead') pinterestData.lead_type = 'room_aesthetic_quiz_completed'
    if (pinterestEventName === 'custom') pinterestData.event_name = eventName
    ensurePinterestTracker()('track', pinterestEventName, pinterestData)
  }
  ensureGoogleAnalytics()?.('event', eventName, data)
}
