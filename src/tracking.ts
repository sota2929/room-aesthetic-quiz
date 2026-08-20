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
const debugModeParam = new URLSearchParams(window.location.search).get('debug_mode')
const gaDebugMode = debugModeParam === '1' || debugModeParam === 'true'
let googleAnalyticsConfigured = false

const pinterestEventNames: Record<string, string> = {
  quiz_start: 'custom',
  quiz_complete: 'lead',
  result_view: 'viewcontent',
  gumroad_click: 'custom',
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
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    // Google Tag expects an Arguments object, matching the official gtag snippet.
    // Pushing a normal array can leave queued commands unprocessed.
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments)
    }
  }
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaMeasurementId}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`
    document.head.appendChild(script)
  }
  if (!googleAnalyticsConfigured) {
    window.gtag('js', new Date())
    window.gtag('config', gaMeasurementId, {
      send_page_view: false,
      debug_mode: gaDebugMode,
      linker: { domains: ['sota2929.github.io', 'gumroad.com'] },
    })
    googleAnalyticsConfigured = true
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
