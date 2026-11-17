import { captureAttribution, withAttribution } from './attribution'
import { SITE_CONFIG, TRACKING_EVENTS } from './config'
import { calculateFurnitureFit, type FitLevel } from './fit-calculator'
import { initializeTracking, trackEvent } from './tracking'

type Priority = 'workspace' | 'storage' | 'lighting'
type RoomStyle = 'cozy-minimalist' | 'clean-girl' | 'dark-academia' | 'soft-girl' | 'modern-boho' | 'moody-maximalist' | 'neo-deco' | 'funhaus' | 'extra-celestial'

type SavedPrescription = {
  level: FitLevel
  bestOrientation: 'A' | 'B'
  bestClearance: number
  roomWidth: number
  roomLength: number
  bedLabel: string
  deskWidth: number
  deskDepth: number
  deskDepthCap: number
  priority: Priority
  budget: number
  style: RoomStyle
}

let lastPrescription: SavedPrescription | null = null

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

const styleLabels: Record<RoomStyle, string> = {
  'cozy-minimalist': 'Cozy Minimalist',
  'clean-girl': 'Clean Girl',
  'dark-academia': 'Dark Academia',
  'soft-girl': 'Soft Girl / Pastel',
  'modern-boho': 'Modern Boho',
  'moody-maximalist': 'Moody Maximalist',
  'neo-deco': 'Neo Deco',
  funhaus: 'FunHaus',
  'extra-celestial': 'Extra Celestial',
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
const checked = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)?.checked ?? false
const selectedValue = <T extends string>(id: string) => document.querySelector<HTMLSelectElement>(`#${id}`)?.value as T

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

function getPrescriptions(priority: Priority, level: FitLevel, bestOrientation: 'A' | 'B', deskDepthCap: number) {
  const cap = Math.max(12, Math.floor(deskDepthCap))
  return [
    {
      name: 'Sleep-first',
      signal: bestOrientation === 'A' ? 'Best starting point' : 'Strong alternative',
      copy: `Use orientation ${bestOrientation}. Keep the bed as the visual anchor and place only one floor piece in the opposite zone.`,
    },
    {
      name: 'Study-first',
      signal: priority === 'workspace' ? 'Matches your priority' : level === 'replan' ? 'Needs a smaller desk' : 'Useful alternate',
      copy: `Keep the desk at or below about ${cap} in deep. Let the chair tuck fully under it and avoid adding a second deep storage piece across the aisle.`,
    },
    {
      name: 'Storage-first',
      signal: priority === 'storage' ? 'Matches your priority' : 'Lowest-floor-area path',
      copy: 'Use under-bed, wall, or over-door storage before adding another dresser. Protect one continuous path from the door to the bed.',
    },
  ]
}

function drawResultCard(result: SavedPrescription) {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 1500
  const context = canvas.getContext('2d')
  if (!context) return
  const accent = result.level === 'works' ? '#819273' : result.level === 'tight' ? '#b98271' : '#9a5c52'
  context.fillStyle = '#fbf7f0'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#332f2b'
  context.fillRect(70, 70, 860, 1360)
  context.fillStyle = '#efc1b0'
  context.font = '700 25px sans-serif'
  context.fillText('MY SMALL-ROOM PRESCRIPTION', 125, 155)
  context.fillStyle = '#ffffff'
  context.font = '700 78px Georgia, serif'
  context.fillText(result.level === 'works' ? 'Promising fit' : result.level === 'tight' ? 'Tight—tape test it' : 'Replan before buying', 125, 270)
  context.fillStyle = accent
  context.fillRect(125, 330, 750, 8)
  context.fillStyle = '#ded3c9'
  context.font = '400 30px sans-serif'
  context.fillText(`${result.bedLabel} · ${styleLabels[result.style]} · $${result.budget} path`, 125, 405)
  context.fillStyle = '#ffffff'
  context.font = '700 45px sans-serif'
  context.fillText(`Orientation ${result.bestOrientation}`, 125, 520)
  context.fillText(`${Math.max(0, Math.round(result.bestClearance))} in screened clearance`, 125, 590)
  context.fillText(`Desk depth cap: ~${Math.max(0, Math.floor(result.deskDepthCap))} in`, 125, 660)
  context.fillStyle = '#ded3c9'
  context.font = '400 27px sans-serif'
  const lines = [
    '1  Tape the bed and furniture footprints.',
    '2  Test the door, closet, and chair together.',
    '3  Buy only after the real-room test works.',
  ]
  lines.forEach((line, index) => context.fillText(line, 125, 810 + index * 70))
  context.fillStyle = '#efc1b0'
  context.font = '700 31px sans-serif'
  context.fillText('ROOMAESTHETICQUIZ.COM  ·  FREE TOOL', 125, 1290)
  context.fillStyle = '#b9aaa0'
  context.font = '400 20px sans-serif'
  context.fillText('Screening result only. Verify all finished dimensions in the room.', 125, 1350)
  const link = document.createElement('a')
  link.download = 'my-room-prescription.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
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
  ;(['door-reserve','closet-reserve','chair-reserve'] as const).forEach((id) => {
    const param = params.get(id.replaceAll('-', '_'))
    const input = document.querySelector<HTMLInputElement>(`#${id}`)
    if (param !== null && input) input.checked = param === '1'
  })
  ;(['room-style','life-event'] as const).forEach((id) => {
    const param = params.get(id.replaceAll('-', '_'))
    const input = document.querySelector<HTMLSelectElement>(`#${id}`)
    if (param && input && [...input.options].some((option) => option.value === param)) input.value = param
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
  const style = selectedValue<RoomStyle>('room-style') || 'cozy-minimalist'
  const lifeEvent = selectedValue<string>('life-event') || 'refresh'
  const hasDoorReserve = checked('door-reserve')
  const hasClosetReserve = checked('closet-reserve')
  const hasChairReserve = checked('chair-reserve')

  const invalidRoom = roomWidthFt < 6 || roomWidthFt > 30 || roomLengthFt < 6 || roomLengthFt > 30 || roomWidthIn < 0 || roomWidthIn > 11 || roomLengthIn < 0 || roomLengthIn > 11
  const invalidFurniture = deskWidth < 24 || deskWidth > 84 || deskDepth < 12 || deskDepth > 40 || dresserDepth < 0 || dresserDepth > 40
  if (!bed || invalidRoom || invalidFurniture) {
    if (error) error.textContent = 'Use 6–30 feet, 0–11 extra inches, a 24–84 inch desk width, and a 12–40 inch desk depth.'
    if (results) results.hidden = true
    if (beforeCheck) beforeCheck.hidden = false
    return
  }
  if (error) error.textContent = ''

  const { clearanceA, clearanceB, bestClearance, level, bestOrientation, maxDeskDepthA, maxDeskDepthB, deskWallFitsA, deskWallFitsB } = calculateFurnitureFit({
    roomWidth,
    roomLength,
    bedWidth: bed.width,
    bedLength: bed.length,
    deskWidth,
    deskDepth,
    dresserDepth,
    doorReserve: hasDoorReserve ? 30 : 0,
    closetReserve: hasClosetReserve ? 24 : 0,
    chairReserve: hasChairReserve ? 18 : 0,
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
  const deskDepthCap = bestOrientation === 'A' ? maxDeskDepthA : maxDeskDepthB
  const deskWallFits = bestOrientation === 'A' ? deskWallFitsA : deskWallFitsB
  text('desk-depth-cap', `${Math.max(0, Math.floor(deskDepthCap))} in / ${Math.max(0, Math.floor(deskDepthCap * 2.54))} cm`)
  text('desk-width-check', deskWallFits ? `Your ${deskWidth} in desk width passes this simplified wall-length screen.` : `Your ${deskWidth} in desk is too wide for the screened wall after the selected reserve.`)
  text('size-limit-copy', `For orientation ${bestOrientation}, keep the next desk at or below the depth cap and verify its finished width, baseboards, outlets, and chair movement. A smaller number is safer.`)

  const prescriptionGrid = document.querySelector<HTMLElement>('#prescription-grid')
  if (prescriptionGrid) prescriptionGrid.innerHTML = getPrescriptions(priority, level, bestOrientation, deskDepthCap).map((plan, index) => `
    <article class="prescription-card ${index === 0 ? 'recommended' : ''}">
      <span>${plan.signal}</span><div class="mini-layout layout-${index + 1}" aria-hidden="true"><i>BED</i><b>DESK</b><em>PATH</em></div><h4>${plan.name}</h4><p>${plan.copy}</p>
    </article>`).join('')

  const noBuyTitle = level === 'works' && deskWallFits
    ? 'You may not need to buy anything yet.'
    : level === 'tight'
      ? 'Buy only after a full-size tape test.'
      : 'Do not buy the current desk or dresser yet.'
  const noBuyCopy = level === 'works' && deskWallFits
    ? 'The measurements do not reveal an urgent furniture gap. Try orientation changes, remove one low-use floor item, and improve lighting before adding another piece.'
    : level === 'tight'
      ? 'The screen finds a compromise, not a comfortable guarantee. Tape every footprint, pull the chair out, and open the door and closet at the same time.'
      : 'The current combination fails the minimum screened path. Reduce desk depth, remove the dresser from the opposite zone, or reconsider the bed size before shopping.'
  text('no-buy-title', noBuyTitle)
  text('no-buy-copy', noBuyCopy)
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
    bed: bedKey, desk_width: deskWidth, desk_depth: deskDepth, dresser_depth: dresserDepth, priority, budget,
    room_style: style, life_event: lifeEvent, door_reserve: hasDoorReserve ? 1 : 0, closet_reserve: hasClosetReserve ? 1 : 0,
    chair_reserve: hasChairReserve ? 1 : 0, result: 1,
  })
  document.querySelector<HTMLButtonElement>('#copy-plan')!.dataset.shareUrl = shareUrl

  lastPrescription = {
    level,
    bestOrientation,
    bestClearance,
    roomWidth,
    roomLength,
    bedLabel: bed.label,
    deskWidth,
    deskDepth,
    deskDepthCap,
    priority,
    budget,
    style,
  }

  if (beforeCheck) beforeCheck.hidden = true
  if (results) results.hidden = false
  trackEvent('fit_checker_complete', {
    fit_level: level, best_orientation: bestOrientation, clearance_bucket: bestClearance >= 30 ? '30_plus' : bestClearance >= 24 ? '24_29' : 'under_24',
    bed_size: bedKey, priority, budget_path: budget, has_dresser: dresserDepth > 0, room_style: style, life_event: lifeEvent,
    door_reserve: hasDoorReserve, closet_reserve: hasClosetReserve, chair_reserve: hasChairReserve,
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
document.querySelector<HTMLButtonElement>('#download-card')?.addEventListener('click', () => {
  const status = document.querySelector<HTMLElement>('#save-status')
  if (!lastPrescription) {
    if (status) status.textContent = 'Calculate your prescription first.'
    return
  }
  drawResultCard(lastPrescription)
  if (status) status.textContent = 'Privacy-safe result card downloaded.'
  trackEvent('fit_checker_saved', { method: 'download_card', fit_level: lastPrescription.level }, { pinterest: false })
})

document.querySelector<HTMLButtonElement>('#check-candidate')?.addEventListener('click', () => {
  const result = document.querySelector<HTMLElement>('#candidate-result')
  const width = value('candidate-width')
  const depth = value('candidate-depth')
  const itemType = selectedValue<'desk' | 'dresser' | 'nightstand'>('candidate-type') || 'desk'
  if (!lastPrescription || width < 6 || depth < 4) {
    if (result) result.hidden = false
    text('candidate-verdict', lastPrescription ? 'Use valid finished dimensions.' : 'Calculate the room prescription first.')
    text('candidate-copy', 'The item check needs the room result and the finished width and depth from the listing.')
    return
  }
  const depthLimit = itemType === 'desk' ? lastPrescription.deskDepthCap : Math.max(8, lastPrescription.deskDepthCap - (itemType === 'dresser' ? 2 : 6))
  const widthLimit = lastPrescription.bestOrientation === 'A' ? lastPrescription.roomLength : lastPrescription.roomWidth
  const depthPass = depth <= depthLimit
  const widthPass = width <= widthLimit - 30
  const passes = depthPass && widthPass && lastPrescription.level !== 'replan'
  const borderline = !passes && depth <= depthLimit + 3 && width <= widthLimit - 24 && lastPrescription.level !== 'replan'
  text('candidate-verdict', passes ? 'PASS THE TAPE TEST FIRST' : borderline ? 'BORDERLINE—DO NOT ORDER YET' : 'DO NOT BUY THIS SIZE YET')
  text('candidate-copy', passes
    ? `The ${width} × ${depth} in ${itemType} passes this simplified screen. It is not approved until the full footprint, door, closet, and chair work in the real room.`
    : `This ${itemType} exceeds at least one conservative guardrail. Look for about ${Math.max(6, Math.floor(widthLimit - 30))} in wide or less and ${Math.max(4, Math.floor(depthLimit))} in deep or less, then tape-test it.`)
  const alternative = document.querySelector<HTMLAnchorElement>('#candidate-alternative')
  if (alternative) {
    alternative.href = amazonUrl(`small bedroom ${itemType} under ${Math.max(6, Math.floor(widthLimit - 30))} inches wide ${Math.max(4, Math.floor(depthLimit))} inches deep`)
    alternative.hidden = passes
  }
  if (result) result.hidden = false
  trackEvent('candidate_furniture_checked', {
    item_type: itemType,
    verdict: passes ? 'screen_pass' : borderline ? 'borderline' : 'do_not_buy',
    fit_level: lastPrescription.level,
  }, { pinterest: false })
})

document.querySelector<HTMLAnchorElement>('#candidate-alternative')?.addEventListener('click', () => {
  trackEvent(TRACKING_EVENTS.affiliateProductClicked, {
    location: 'candidate_checker', destination: 'amazon', product_category: selectedValue<string>('candidate-type') || 'unknown', link_type: 'search', click_target: 'alternative',
  })
})
document.querySelector<HTMLAnchorElement>('#fit-review-link')?.addEventListener('click', () => {
  trackEvent('fit_review_interest_click', { location: 'fit_checker_result', offer_price_usd: 29 }, { pinterest: false })
})

trackEvent('fit_checker_start', { start_method: initialPlanParams.get('result') === '1' ? 'shared_result' : 'page_load' }, { pinterest: false })
populateFromUrl()
