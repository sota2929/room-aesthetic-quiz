import { captureAttribution } from './attribution'
import { SITE_CONFIG, TRACKING_EVENTS } from './config'
import { initializeTracking, trackEvent } from './tracking'

const articleSlug = document.body.dataset.articleSlug || 'articles-index'

captureAttribution()
initializeTracking({
  page_type: articleSlug === 'articles-index' ? 'articles_index' : 'article',
  article_slug: articleSlug,
  content_group: 'small_bedroom_layouts',
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
