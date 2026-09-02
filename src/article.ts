import { captureAttribution } from './attribution'
import { SITE_CONFIG, TRACKING_EVENTS } from './config'
import { initializeTracking, trackEvent } from './tracking'

const articleSlug = document.body.dataset.articleSlug || 'articles-index'
const articleCategories: Record<string, string> = {
  'articles-index': 'articles_index',
  '10x10-bedroom-layout': 'measured_layouts',
  '8x10-bedroom-full-bed-desk': 'measured_layouts',
  '9x10-bedroom-queen-bed': 'measured_layouts',
  'small-bedroom-desk-dresser': 'measured_layouts',
  'bedroom-layout-clearance-guide': 'measurement_planning',
  'bedside-storage-under-12-inches': 'storage_furniture',
  'desks-under-36-inches': 'storage_furniture',
  'narrow-dressers-under-24-inches': 'storage_furniture',
  'storage-bed-drawers-vs-lift-up': 'storage_furniture',
  'dorm-room-shopping-plan-under-300': 'dorm_budget',
}
const articleCategory = articleCategories[articleSlug] || 'room_guides'

captureAttribution()
initializeTracking({
  page_type: articleSlug === 'articles-index' ? 'articles_index' : 'article',
  article_slug: articleSlug,
  article_category: articleCategory,
  content_group: articleCategory,
})

document.querySelectorAll<HTMLAnchorElement>('[data-track-link]').forEach((link) => {
  link.addEventListener('click', () => {
    trackEvent(link.dataset.event || 'article_link_click', {
      article_slug: articleSlug,
      location: link.dataset.location || 'article',
      click_target: link.dataset.trackLink || 'link',
      destination: link.dataset.destination || new URL(link.href, window.location.href).hostname,
      ...(link.dataset.productCategory ? { product_category: link.dataset.productCategory } : {}),
      ...(link.dataset.searchTerm ? { search_term: link.dataset.searchTerm } : {}),
      ...(link.dataset.asin ? { product_asin: link.dataset.asin } : {}),
      ...(link.closest('.product-card')?.querySelector('h3')?.textContent?.trim()
        ? { product_name: link.closest('.product-card')?.querySelector('h3')?.textContent?.trim() }
        : {}),
    }, { pinterest: link.dataset.event === TRACKING_EVENTS.affiliateProductClicked })
  })
})

const article = document.querySelector<HTMLElement>('[data-article]')
if (article && 'IntersectionObserver' in window) {
  const sectionsSeen = new Set<string>()
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const section = (entry.target as HTMLElement).dataset.articleSection
      if (!section || sectionsSeen.has(section)) return
      sectionsSeen.add(section)
      trackEvent(TRACKING_EVENTS.sectionViewed, {
        page_type: 'article',
        article_slug: articleSlug,
        section,
      }, { pinterest: false })
      observer.unobserve(entry.target)
    })
  }, { threshold: 0.35 })
  article.querySelectorAll<HTMLElement>('[data-article-section]').forEach((section) => observer.observe(section))
}

document.querySelectorAll<HTMLAnchorElement>('[data-amazon-search]').forEach((link) => {
  const url = new URL('https://www.amazon.com/s')
  const searchTerm = link.dataset.amazonSearch || ''
  url.searchParams.set('k', searchTerm)
  url.searchParams.set('tag', SITE_CONFIG.amazonAssociateTag)
  link.href = url.toString()
  link.dataset.searchTerm = searchTerm
})

document.querySelectorAll<HTMLButtonElement>('[data-print-guide]').forEach((button) => {
  button.addEventListener('click', () => {
    trackEvent('article_print_requested', {
      article_slug: articleSlug,
      location: button.dataset.location || 'article',
    }, { pinterest: false })
    window.print()
  })
})
