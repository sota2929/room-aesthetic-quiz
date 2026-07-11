type EventProperties = Record<string, string | number | boolean>

/**
 * Privacy-friendly placeholder. Replace this body with your analytics provider
 * later; no personal information is collected by the MVP.
 */
export function trackEvent(eventName: string, properties: EventProperties = {}) {
  console.log('[Room Aesthetic Quiz event]', eventName, properties)
}
