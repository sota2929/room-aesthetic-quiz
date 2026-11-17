import { captureAttribution } from './attribution'
import { initializeTracking, trackEvent } from './tracking'

type Owner = 'me' | 'roommate' | 'split' | 'skip'
type DormItem = { id: string; name: string; fit: string; estimate: number; owner: Owner }

const starterItems: DormItem[] = [
  { id: 'rug', name: 'Washable rug', fit: 'Measure the open floor—not the full room.', estimate: 45, owner: 'split' },
  { id: 'lamp', name: 'Shared task lamp', fit: 'Choose one that does not use floor area.', estimate: 25, owner: 'me' },
  { id: 'cleaning', name: 'Cleaning kit', fit: 'One shared caddy is usually enough.', estimate: 20, owner: 'roommate' },
  { id: 'fridge', name: 'Mini fridge', fit: 'Confirm housing rules and ventilation.', estimate: 90, owner: 'skip' },
  { id: 'storage', name: 'Shared vertical storage', fit: 'Check height, outlet, and door swing.', estimate: 40, owner: 'split' },
  { id: 'mirror', name: 'Full-length mirror', fit: 'Use over-door only if rules allow it.', estimate: 25, owner: 'roommate' },
  { id: 'curtain', name: 'Light-filtering curtain', fit: 'Confirm window and housing rules.', estimate: 30, owner: 'skip' },
  { id: 'seating', name: 'Extra seating', fit: 'Skip unless a 30 in path remains.', estimate: 45, owner: 'skip' },
]

const table = document.querySelector<HTMLTableSectionElement>('#item-table')
let currentItems = starterItems.map((item) => ({ ...item }))
const money = (value: number) => `$${Math.max(0, value).toFixed(0)}`

function renderTable() {
  if (!table) return
  table.innerHTML = currentItems.map((item) => `<tr data-id="${item.id}"><td><strong>${item.name}</strong></td><td>${item.fit}</td><td><select class="owner" aria-label="Owner for ${item.name}"><option value="me" ${item.owner === 'me' ? 'selected' : ''}>Me</option><option value="roommate" ${item.owner === 'roommate' ? 'selected' : ''}>Roommate</option><option value="split" ${item.owner === 'split' ? 'selected' : ''}>Split 50/50</option><option value="skip" ${item.owner === 'skip' ? 'selected' : ''}>Skip</option></select></td><td><input class="estimate" aria-label="Estimate for ${item.name}" type="number" min="0" max="2000" value="${item.estimate}"/></td></tr>`).join('')
}

function collectItems() {
  document.querySelectorAll<HTMLTableRowElement>('#item-table tr').forEach((row) => {
    const item = currentItems.find((candidate) => candidate.id === row.dataset.id)
    if (!item) return
    item.owner = row.querySelector<HTMLSelectElement>('.owner')?.value as Owner || 'skip'
    item.estimate = Math.max(0, Number(row.querySelector<HTMLInputElement>('.estimate')?.value || 0))
  })
}

function calculate() {
  collectItems()
  let totalA = 0
  let totalB = 0
  currentItems.forEach((item) => {
    if (item.owner === 'me') totalA += item.estimate
    if (item.owner === 'roommate') totalB += item.estimate
    if (item.owner === 'split') { totalA += item.estimate / 2; totalB += item.estimate / 2 }
  })
  const budgetA = Math.max(0, Number(document.querySelector<HTMLInputElement>('#budget-a')?.value || 0))
  const budgetB = Math.max(0, Number(document.querySelector<HTMLInputElement>('#budget-b')?.value || 0))
  const skipped = currentItems.filter((item) => item.owner === 'skip').length
  const text = (id: string, value: string) => { const node = document.querySelector<HTMLElement>(`#${id}`); if (node) node.textContent = value }
  text('total-a', money(totalA)); text('total-b', money(totalB)); text('skip-count', `${skipped} items`)
  text('budget-status-a', totalA <= budgetA ? `${money(budgetA - totalA)} left` : `${money(totalA - budgetA)} over budget`)
  text('budget-status-b', totalB <= budgetB ? `${money(budgetB - totalB)} left` : `${money(totalB - budgetB)} over budget`)
  const actions = document.querySelector<HTMLElement>('#split-actions')
  if (actions) actions.innerHTML = [
    ['Before shopping', 'Check the housing-provided furniture list and prohibited-item rules together.'],
    ['Before ordering', 'Run exact desk, dresser, and storage dimensions through the Room Prescription.'],
    ['On move-in day', 'Keep receipts separate until every shared item passes the real-room fit test.'],
  ].map(([title, copy], index) => `<article><span>0${index + 1}</span><h3>${title}</h3><p>${copy}</p></article>`).join('')
  const results = document.querySelector<HTMLElement>('#split-results')
  if (results) results.hidden = false
  results?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  trackEvent('dorm_split_plan_complete', { item_count: currentItems.length, skipped_count: skipped, me_budget_status: totalA <= budgetA ? 'within' : 'over', roommate_budget_status: totalB <= budgetB ? 'within' : 'over' }, { pinterest: false })
}

document.querySelector<HTMLButtonElement>('#calculate-split')?.addEventListener('click', calculate)
document.querySelector<HTMLButtonElement>('#reset-plan')?.addEventListener('click', () => { currentItems = starterItems.map((item) => ({ ...item })); renderTable(); const results = document.querySelector<HTMLElement>('#split-results'); if (results) results.hidden = true })
document.querySelector<HTMLButtonElement>('#print-split')?.addEventListener('click', () => { trackEvent('dorm_split_plan_saved', { method: 'print' }, { pinterest: false }); window.print() })
document.querySelector<HTMLButtonElement>('#download-csv')?.addEventListener('click', () => {
  collectItems()
  const rows = [['Item','Owner','Estimated cost','Fit check'], ...currentItems.map((item) => [item.name,item.owner,String(item.estimate),item.fit])]
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"','""')}"`).join(',')).join('\n')
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'dorm-roommate-split-plan.csv'; link.click(); URL.revokeObjectURL(link.href)
  trackEvent('dorm_split_plan_saved', { method: 'csv' }, { pinterest: false })
})

captureAttribution(); initializeTracking({ page_type: 'interactive_tool', tool: 'dorm_roommate_planner', content_group: 'planning_tools' }); renderTable()
