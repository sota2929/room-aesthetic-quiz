const ATTRIBUTION_KEY = 'room-aesthetic-attribution'

export const attributionKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'pin_id',
  'entry',
  'start',
] as const

export type AttributionKey = typeof attributionKeys[number]
type AttributionContextKey = 'attribution_method' | 'landing_path' | 'referrer_host' | 'traffic_source_group'
export type Attribution = Partial<Record<AttributionKey | AttributionContextKey, string>>

let memoryAttribution: Attribution = {}

function readStoredAttribution(): Attribution {
  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY)
    return stored ? JSON.parse(stored) as Attribution : {}
  } catch {
    return memoryAttribution
  }
}

function getReferrerHost() {
  if (!document.referrer) return ''
  try {
    return new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isPinterestSource(value?: string) {
  return Boolean(value?.toLowerCase().includes('pinterest'))
}

function normalizeAttribution(captured: Attribution, referrerHost: string) {
  const normalized = { ...captured }
  if (normalized.utm_source) normalized.utm_source = normalized.utm_source.toLowerCase()
  if (normalized.utm_medium) normalized.utm_medium = normalized.utm_medium.toLowerCase()

  const pinterestVisit = isPinterestSource(normalized.utm_source) || isPinterestSource(referrerHost)
  if (pinterestVisit) {
    normalized.utm_source = 'pinterest'
    if (!normalized.utm_medium || ['organic', 'referral', 'social'].includes(normalized.utm_medium)) {
      normalized.utm_medium = 'organic_social'
    }
    normalized.utm_campaign ||= 'pinterest_referral'
    normalized.traffic_source_group = 'pinterest_organic'
  } else if (normalized.utm_source) {
    normalized.traffic_source_group = 'other_campaign'
  }
  return normalized
}

export function captureAttribution() {
  const params = new URLSearchParams(window.location.search)
  const queryAttribution = Object.fromEntries(attributionKeys.flatMap((key) => {
    const value = params.get(key)?.trim()
    return value ? [[key, value]] : []
  })) as Attribution
  const referrerHost = getReferrerHost()
  const hasExplicitCampaign = Boolean(queryAttribution.utm_source || queryAttribution.utm_campaign || queryAttribution.utm_content)
  const inferredPinterestVisit = !hasExplicitCampaign && isPinterestSource(referrerHost)
  const captured = normalizeAttribution(queryAttribution, referrerHost)
  const storedAttribution = readStoredAttribution()
  const visitContext: Attribution = {
    attribution_method: hasExplicitCampaign ? 'utm' : inferredPinterestVisit ? 'referrer' : 'none',
    landing_path: window.location.pathname,
    traffic_source_group: captured.traffic_source_group ?? 'direct_or_other_referral',
    ...(referrerHost ? { referrer_host: referrerHost } : {}),
  }
  const isNewCampaignVisit = hasExplicitCampaign || inferredPinterestVisit
  memoryAttribution = isNewCampaignVisit
    ? { ...captured, ...visitContext }
    : { ...storedAttribution, ...captured, ...(Object.keys(storedAttribution).length ? {} : visitContext) }
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
