import { captureAttribution } from './attribution'
import { initializeTracking, trackEvent } from './tracking'

type Recipe = { id: string; size: '8x10'|'9x10'|'10x10'; style: string; group: 'evergreen'|'trend'; budget: 100|200|300; bed: string; priority: string; protect: string; buy: string[]; skip: string; colors: [string,string,string] }
const recipes: Recipe[] = [
  { id:'8x10-clean-study',size:'8x10',style:'Clean Girl Study-First',group:'evergreen',budget:100,bed:'Full bed',priority:'One shallow desk; no second deep piece',protect:'Door-to-bed path and chair tuck-in space',buy:['Task light that uses no floor area','One cable-control solution','Soft layer only after the desk works'],skip:'Extra accent chair',colors:['#f2eee8','#c8d1c2','#b68d79'] },
  { id:'8x10-celestial',size:'8x10',style:'Extra Celestial Sleep-First',group:'trend',budget:200,bed:'Twin XL',priority:'Bed as anchor; vertical light effects',protect:'One clear long-side path',buy:['Plug-in or projection lighting','One iridescent textile layer','Under-bed storage only if height works'],skip:'Deep nightstands on both sides',colors:['#252340','#8f84b8','#d8d2ea'] },
  { id:'9x10-cozy',size:'9x10',style:'Cozy Minimalist Storage-First',group:'evergreen',budget:200,bed:'Queen bed',priority:'Under-bed capacity before another dresser',protect:'Bed corner and closet opening',buy:['Low-profile storage sized to frame clearance','Warm wall or bedside light','One washable texture'],skip:'Wide freestanding dresser',colors:['#e8ddcf','#a8a18b','#765e4f'] },
  { id:'9x10-funhaus',size:'9x10',style:'FunHaus One-Focal-Wall',group:'trend',budget:100,bed:'Full bed',priority:'Color on the wall, not more floor objects',protect:'Desk and main path',buy:['Removable graphic wall layer','One sculptural lamp','One high-contrast textile'],skip:'Multiple novelty side tables',colors:['#e3573f','#f2c94c','#2d6c73'] },
  { id:'10x10-boho',size:'10x10',style:'Modern Boho Balanced',group:'evergreen',budget:300,bed:'Queen bed',priority:'Queen + 36 in desk; choose only one dresser zone',protect:'30 in main path where possible',buy:['Shallow desk with tuck-under chair','Vertical texture or art','Closed storage before baskets'],skip:'Oversized floor mirror in the path',colors:['#d9c7ac','#95745c','#75816a'] },
  { id:'10x10-neo-deco',size:'10x10',style:'Neo Deco Buy-Less Statement',group:'trend',budget:300,bed:'Queen bed',priority:'One curved statement; everything else restrained',protect:'Symmetry without blocking circulation',buy:['One compact curved lamp or mirror','One geometric textile','Slim closed storage'],skip:'Matching bulky nightstands',colors:['#1e3538','#c39b58','#eadfcf'] },
]

const grid = document.querySelector<HTMLElement>('#recipe-grid')
const planPackUrls: Record<Recipe['size'], string> = {
  '8x10': 'https://sotahara.gumroad.com/l/8x10-small-bedroom-plan-pack',
  '9x10': 'https://sotahara.gumroad.com/l/9x10-small-bedroom-plan-pack',
  '10x10': 'https://sotahara.gumroad.com/l/10x10-small-bedroom-plan-pack',
}
const selected = (id: string) => document.querySelector<HTMLSelectElement>(`#${id}`)?.value || 'all'
function render() {
  const size = selected('recipe-size'); const group = selected('recipe-style'); const budget = selected('recipe-budget')
  const visible = recipes.filter((item) => (size === 'all' || item.size === size) && (group === 'all' || item.group === group) && (budget === 'all' || item.budget <= Number(budget)))
  if (grid) grid.innerHTML = visible.map((item) => `<article class="recipe-card"><div class="recipe-plan" style="background:linear-gradient(135deg,${item.colors[0]},${item.colors[1]})"><span class="bed">${item.bed.toUpperCase()}</span><span class="desk">DESK</span><span class="path">PROTECT PATH</span></div><div class="recipe-copy"><span class="kicker">${item.size.replace('x','×')} ft · ${item.group === 'trend' ? 'Trend direction' : 'Evergreen'} · $${item.budget} path</span><h2>${item.style}</h2><div class="recipe-meta"><span>${item.bed}</span><span>${item.priority}</span></div><p><strong>Protect:</strong> ${item.protect}.</p><ol>${item.buy.map((step) => `<li>${step}</li>`).join('')}</ol><p><strong>Skip:</strong> ${item.skip}.</p><div class="button-row"><a class="primary-button" href="../tools/room-fit-checker/?entry=recipe-${item.id}&room=${item.size}">Test my dimensions →</a><a class="secondary-button" href="${planPackUrls[item.size]}" target="_blank" rel="noreferrer">Get the ${item.size.replace('x','×')} Plan Pack ↗</a><a class="secondary-button" href="../articles/${item.size === '10x10' ? '10x10-bedroom-layout' : item.size === '9x10' ? '9x10-bedroom-queen-bed' : '8x10-bedroom-full-bed-desk'}/">Read measured guide</a></div></div></article>`).join('')
  const count = document.querySelector<HTMLElement>('#recipe-count'); if (count) count.textContent = `${visible.length} recipe${visible.length === 1 ? '' : 's'} shown. Product prices change; budgets are allocation frameworks, not live price claims.`
  trackEvent('room_recipe_filtered', { size_filter:size, style_filter:group, budget_filter:budget, result_count:visible.length }, { pinterest:false })
}
document.querySelectorAll<HTMLSelectElement>('.recipe-controls select').forEach((input) => input.addEventListener('change', render))
document.querySelector<HTMLElement>('#recipe-grid')?.addEventListener('click', (event) => { const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a'); if (link) trackEvent('room_recipe_click', { destination:link.href.includes('room-fit-checker') ? 'prescription' : link.hostname.includes('gumroad.com') ? 'plan_pack' : 'guide' }, { pinterest:false }) })
captureAttribution(); initializeTracking({ page_type:'collection', content_group:'room_recipes' }); render()
