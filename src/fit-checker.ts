import { captureAttribution, withAttribution } from './attribution'
import { SITE_CONFIG, TRACKING_EVENTS } from './config'
import { calculateFurnitureFit, type FitLevel } from './fit-calculator'
import { initializeTracking, trackEvent } from './tracking'

type Priority = 'workspace' | 'storage' | 'lighting'

const beds = {
  twin: { label: 'Twin', width: 38, length: 75 },
  'twin-xl': { label: 'Twin XL', width: 38, length: 80 },
  full: { label: 'Full', width: 54, length: 75 },
  queen: { label: 'Queen', width: 60, length: 80 },
} as const

const amazonSearches: Record<Priority, string> = {
  workspace: 'small desk 40 inch wide 20 inch deep bedroom',
  storage: 'low profile under bed storage bins with wheels',
  lighting: 'dimmable plug in wall sconce bedroom',
}

const guides: Record<Priority, string> = {
  workspace: '../../articles/desks-under-36-inches/',
  storage: '../../articles/bedside-storage-under-12-inches/',
  lighting: '../../articles/bedroom-layout-clearance-guide/',
}

const form = document.querySelector<HTMLFormElement>('#fit-form')
const results = document.querySelector<HTMLElement>('#fit-results')
const beforeCheck = document.querySelector<HTMLElement>('#before-check')
const error = document.querySelector<HTMLElement>('#form-error')
const sharedPlanParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
const initialPlanParams = sharedPlanParams

// A saved plan lives in the URL fragment, which is not sent in the HTTP request.
// Remove it from the visible URL before analytics initializes as an extra guard.
if (sharedPlanParams.has('result')) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)

captureAttribution()
initializeTracking({ page_type: 'interactive_tool', tool: 'room_fit_checker', content_group: 'planning_tools' })

const value = (id: string) => Number(document.querySelector<HTMLInputElement>(`#${id}`)?.value || 0)
const text = (id: string, content: string) => { const node = document.querySelector<HTMLElement>(`#${id}`); if (node) node.textContent = content }
const selected = <T extends string>(name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value as T

function formatClearance(inches: number) {
  return `${Math.max(0, Math.round(inches))} in / ${Math.max(0, Math.round(inches * 2.54))} cm`
}

function amazonUrl(search: string) {
  const url = new URL('https://www.amazon.com/s')
  url.searchParams.set('k', search)
  url.searchParams.set('tag', SITE_CONFIG.amazonAssociateTag)
  return url.toString()
}

function getBuyOrder(priority: Priority, budget: number, level: FitLevel, deskWidth: number, deskDepth: number) {
  const first = level === 'replan'
    ? 'Do not buy furniture yet. Mark the door swing, closet opening, and the full bed-frame footprint with painter’s tape.'
    : level === 'tight'
      ? 'Confirm the tight zone with painter’s tape and test whether the door, closet, and chair can move at the same time.'
      : 'Confirm the stronger orientation with the actual bed frame—not only the mattress dimensions.'
  const priorityStep: Record<Priority, string> = {
    workspace: `Compare desks no larger than about ${deskWidth} in wide × ${deskDepth} in deep, then choose a chair that tucks completely underneath.`,
    storage: 'Measure under-bed height and the narrowest bedside gap before comparing storage. Closed or mobile storage usually protects the walkway better.',
    lighting: 'Start with a plug-in wall light or compact bedside lamp so the first improvement uses almost no floor area.',
  }
  const budgetStep = budget <= 50
    ? 'Use the first $50 for one constraint only. Keep the rest of the room unchanged until you know the fix works.'
    : budget <= 100
      ? 'Use the $100 path for one functional anchor plus a low-cost support item; avoid splitting it across decorative extras.'
      : 'Use the $200 path for the priority item and one supporting layer, while reserving part of the budget for returns or dimension changes.'
  return [first, priorityStep[priority], budgetStep]
}

function writeShareUrl(params: Record<string, string | number>) {
  const url = new URL(window.location.href)
  const plan = new URLSearchParams()
  Object.entries(params).forEach(([key, item]) => plan.set(key, String(item)))
  url.hash = plan.toString()
  return url.toString()
}

function populateFromUrl() {
  const params = initialPlanParams
  const numericIds = ['room-width-ft','room-width-in','room-length-ft','room-length-in','desk-width','desk-depth','dresser-depth']
  numericIds.forEach((id) => {
    const param = params.get(id.replaceAll('-', '_'))
    const input = document.querySelector<HTMLInputElement>(`#${id}`)
    if (param && input && Number.isFinite(Number(param))) input.value = param
  })
  const bed = params.get('bed')
  if (bed && bed in beds) (document.querySelector<HTMLSelectElement>('#bed-size')!).value = bed
  ;(['priority','budget'] as const).forEach((name) => {
    const param = params.get(name)
    const radio = param ? document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${param}"]`) : null
    if (radio) radio.checked = true
  })
  if (params.get('result') === '1') setTimeout(() => form?.requestSubmit(), 0)
}

form?.addEventListener('submit', (event) => {
  event.preventDefault()
  const roomWidthFt = value('room-width-ft')
  const roomWidthIn = value('room-width-in')
  const roomLengthFt = value('room-length-ft')
  const roomLengthIn = value('room-length-in')
  const roomWidth = roomWidthFt * 12 + roomWidthIn
  const roomLength = roomLengthFt * 12 + roomLengthIn
  const deskWidth = value('desk-width')
  const deskDepth = value('desk-depth')
  const dresserDepth = value('dresser-depth')
  const bedKey = document.querySelector<HTMLSelectElement>('#bed-size')?.value as keyof typeof beds
  const bed = beds[bedKey]
  const priority = selected<Priority>('priority') || 'workspace'
  const budget = Number(selected<string>('budget') || 100)

  const invalidRoom = roomWidthFt < 6 || roomWidthFt > 30 || roomLengthFt < 6 || roomLengthFt > 30 || roomWidthIn < 0 || roomWidthIn > 11 || roomLengthIn < 0 || roomLengthIn > 11
  const invalidFurniture = deskWidth < 24 || deskWidth > 84 || deskDepth < 12 || deskDepth > 40 || dresserDepth < 0 || dresserDepth > 40
  if (!bed || invalidRoom || invalidFurniture) {
    if (error) error.textContent = 'Use 6–30 feet, 0–11 extra inches, a 24–84 inch desk width, and a 12–40 inch desk depth.'
    if (results) results.hidden = true
    if (beforeCheck) beforeCheck.hidden = false
    return
  }
  if (error) error.textContent = ''

  const { clearanceA, clearanceB, bestClearance, level, bestOrientation } = calculateFurnitureFit({
    roomWidth, roomLength, bedWidth: bed.width, bedLength: bed.length, deskDepth, dresserDepth,
  })
  const titles: Record<FitLevel, string> = {
    works: `Promising fit—test orientation ${bestOrientation} first.`,
    tight: `Possible, but the room is working with a tight zone.`,
    replan: `Replan before buying the desk or dresser.`,
  }
  const summaries: Record<FitLevel, string> = {
    works: 'The simplified math reaches the stronger 30-inch target in at least one orientation. Door swing, closet access, chair movement, and the finished bed frame can still change the answer.',
    tight: 'The best simplified orientation lands between 24 and 29 inches. Treat that as a compact-room compromise and tape the footprints before ordering.',
    replan: 'Neither simplified orientation reaches 24 inches. A shallower desk, smaller bed, wall-mounted lighting, or fewer floor pieces is the safer next move.',
  }

  text('status-label', level === 'works' ? 'PROMISING' : level === 'tight' ? 'TIGHT FIT' : 'REPLAN FIRST')
  text('result-title', titles[level])
  text('result-summary', summaries[level])
  text('metric-room', `${roomWidth} × ${roomLength} in`)
  text('metric-clearance', formatClearance(bestClearance))
  text('metric-status', level === 'works' ? '30″+ target reached' : level === 'tight' ? '24–29″ compromise' : 'Under 24″')
  text('orientation-a', formatClearance(clearanceA))
  text('orientation-b', formatClearance(clearanceB))
  text('orientation-a-copy', `${bed.label} bed aligned with the room length; desk and optional dresser depth are screened across the opposite zone.`)
  text('orientation-b-copy', 'The same furniture is rotated. This can reveal useful width that a single layout assumption hides.')
  text('buy-order-title', `${priority[0].toUpperCase()}${priority.slice(1)} first · $${budget} path`)
  const list = document.querySelector<HTMLOListElement>('#buy-order-list')
  if (list) list.innerHTML = getBuyOrder(priority, budget, level, deskWidth, deskDepth).map((item) => `<li>${item}</li>`).join('')

  const amazon = document.querySelector<HTMLAnchorElement>('#amazon-result-link')
  if (amazon) {
    amazon.href = amazonUrl(amazonSearches[priority])
    amazon.textContent = level === 'replan' ? 'Compare smaller-footprint options ↗' : `Compare ${priority} options ↗`
    amazon.dataset.priority = priority
    amazon.dataset.fitLevel = level
  }
  const guide = document.querySelector<HTMLAnchorElement>('#guide-result-link')
  if (guide) guide.href = guides[priority]
  const gumroad = document.querySelector<HTMLAnchorElement>('#gumroad-result-link')
  if (gumroad) gumroad.href = withAttribution(SITE_CONFIG.productUrl)

  const shareUrl = writeShareUrl({
    room_width_ft: roomWidthFt, room_width_in: roomWidthIn, room_length_ft: roomLengthFt, room_length_in: roomLengthIn,
    bed: bedKey, desk_width: deskWidth, desk_depth: deskDepth, dresser_depth: dresserDepth, priority, budget, result: 1,
  })
  document.querySelector<HTMLButtonElement>('#copy-plan')!.dataset.shareUrl = shareUrl

  if (beforeCheck) beforeCheck.hidden = true
  if (results) results.hidden = false
  trackEvent('fit_checker_complete', {
    fit_level: level, best_orientation: bestOrientation, clearance_bucket: bestClearance >= 30 ? '30_plus' : bestClearance >= 24 ? '24_29' : 'under_24',
    bed_size: bedKey, priority, budget_path: budget, has_dresser: dresserDepth > 0,
  }, { pinterest: false })
  results?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

document.querySelector<HTMLAnchorElement>('#amazon-result-link')?.addEventListener('click', (event) => {
  const link = event.currentTarget as HTMLAnchorElement
  trackEvent(TRACKING_EVENTS.affiliateProductClicked, { location: 'fit_checker_result', destination: 'amazon', product_category: link.dataset.priority || 'unknown', fit_level: link.dataset.fitLevel || 'unknown', link_type: 'search', click_target: 'cta' })
})
document.querySelector<HTMLAnchorElement>('#guide-result-link')?.addEventListener('click', () => trackEvent('article_link_click', { location: 'fit_checker_result', click_target: 'matching_guide' }, { pinterest: false }))
document.querySelector<HTMLAnchorElement>('#gumroad-result-link')?.addEventListener('click', () => trackEvent(TRACKING_EVENTS.productCtaClicked, { location: 'fit_checker_result', destination: 'gumroad', product_name: SITE_CONFIG.productName, price_usd: 7 }))
document.querySelector<HTMLButtonElement>('#copy-plan')?.addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement
  const status = document.querySelector<HTMLElement>('#save-status')
  try {
    await navigator.clipboard.writeText(button.dataset.shareUrl || window.location.href)
    if (status) status.textContent = 'Plan link copied. It contains measurements only—no personal information.'
    trackEvent('fit_checker_saved', { method: 'copy_link' }, { pinterest: false })
  } catch {
    if (status) status.textContent = 'Copy was blocked. Use your browser address bar to copy this result URL.'
  }
})
document.querySelector<HTMLButtonElement>('#print-plan')?.addEventListener('click', () => {
  trackEvent('fit_checker_saved', { method: 'print' }, { pinterest: false })
  window.print()
})

trackEvent('fit_checker_start', { start_method: initialPlanParams.get('result') === '1' ? 'shared_result' : 'page_load' }, { pinterest: false })
populateFromUrl()
