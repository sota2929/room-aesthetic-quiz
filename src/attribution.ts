const ATTRIBUTION_KEY = 'room-aesthetic-attribution'

export const attributionKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'entry',
  'start',
] as const

export type AttributionKey = typeof attributionKeys[number]
export type Attribution = Partial<Record<AttributionKey, string>>

let memoryAttribution: Attribution = {}

function readStoredAttribution(): Attribution {
  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY)
    return stored ? JSON.parse(stored) as Attribution : {}
  } catch {
    return memoryAttribution
  }
}

export function captureAttribution() {
  const params = new URLSearchParams(window.location.search)
  const captured = Object.fromEntries(attributionKeys.flatMap((key) => {
    const value = params.get(key)?.trim()
    return value ? [[key, value]] : []
  })) as Attribution
  const isNewCampaignVisit = Boolean(captured.utm_source || captured.utm_campaign || captured.utm_content)
  memoryAttribution = isNewCampaignVisit ? captured : { ...readStoredAttribution(), ...captured }
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(memoryAttribution))
  } catch {
    // Tracking must never interrupt the quiz when browser storage is unavailable.
  }
  return memoryAttribution
}

export function getAttribution(): Attribution {
  return { ...readStoredAttribution(), ...memoryAttribution }
}

export function getCurrentEntry() {
  return new URLSearchParams(window.location.search).get('entry')?.trim() || getAttribution().entry
}

export function shouldStartImmediately() {
  return new URLSearchParams(window.location.search).get('start') === '1'
}

export function withAttribution(rawUrl: string) {
  const url = new URL(rawUrl, window.location.href)
  const attribution = getAttribution()
  attributionKeys.forEach((key) => {
    const value = attribution[key]
    if (value) url.searchParams.set(key, value)
  })
  return url.toString()
}
