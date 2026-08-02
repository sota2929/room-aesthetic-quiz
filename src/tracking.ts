type EventProperties = Record<string, string | number | boolean>

type PinterestEventData = EventProperties & { event_id: string }

type PinterestTracker = {
  (...args: unknown[]): void
  queue: unknown[][]
  version: string
}

declare global {
  interface Window {
    pintrk?: PinterestTracker
  }
}

const pinterestTagId = import.meta.env.VITE_PINTEREST_TAG_ID?.trim()

const pinterestEventNames: Record<string, string> = {
  quiz_started: 'quiz_started',
  quiz_completed: 'lead',
  result_viewed: 'viewcontent',
  product_cta_clicked: 'product_cta_clicked',
  retake_quiz_clicked: 'retake_quiz_clicked',
  result_shared: 'result_shared',
}

function eventId(eventName: string) {
  const randomPart = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
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

export function initializeTracking() {
  if (!pinterestTagId) return

  const pintrk = ensurePinterestTracker()
  pintrk('load', pinterestTagId)
  pintrk('page')
}

export function trackEvent(eventName: string, properties: EventProperties = {}) {
  if (!pinterestTagId) return

  const pintrk = ensurePinterestTracker()
  const pinterestEventName = pinterestEventNames[eventName] ?? eventName
  const data: PinterestEventData = {
    ...properties,
    event_id: eventId(eventName),
  }
  if (pinterestEventName === 'lead') data.lead_type = 'room_aesthetic_quiz_completed'
  pintrk('track', pinterestEventName, data)
}
