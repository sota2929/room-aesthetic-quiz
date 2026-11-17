import { captureAttribution } from './attribution'
import { initializeTracking, trackEvent } from './tracking'

const pageType = document.body.dataset.pageType || 'resource'
const contentGroup = document.body.dataset.contentGroup || 'planning_resources'
captureAttribution()
initializeTracking({ page_type: pageType, content_group: contentGroup })
document.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a')
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
  if (link) {
    const destination = new URL(link.href, window.location.href)
    trackEvent('planning_page_cta_click', { page_type: pageType, destination_host: destination.hostname, destination_path: destination.pathname }, { pinterest: false })
  }
  if (button) trackEvent('planning_resource_action', { page_type: pageType, action: button.textContent?.trim().slice(0, 50) || 'button' }, { pinterest: false })
})
