// Ordered sections for the grocery list display
export const SECTION_ORDER = [
  'Fruits et légumes',
  'Produits céréaliers',
  'Produits laitiers',
  'Viandes',
  'Varia',
  'Varia - Congelés',
]

// Normalize unit strings for aggregation matching
function normalizeUnitForAgg(unit) {
  if (!unit) return ''
  const u = unit.trim().toLowerCase()
  const map = {
    'g': 'g', 'gr': 'g',
    'ml': 'ml',
    'l': 'L', 'L': 'L',
    'kg': 'kg',
    'unité': 'unité', 'unite': 'unité', 'unités': 'unité', 'unites': 'unité',
    'sachet': 'sachet', 'sachets': 'sachet',
    'sac': 'sac', 'sacs': 'sac',
    'boîte': 'boîte', 'boite': 'boîte', 'boîtes': 'boîte', 'boites': 'boîte',
    'conserve': 'conserve', 'conserves': 'conserve',
    'casseaux': 'casseaux',
    'portion': 'portion', 'portions': 'portion',
    'tranche': 'tranche', 'tranches': 'tranche',
    'paquet': 'paquet', 'paquets': 'paquet',
    'contenant': 'contenant', 'contenants': 'contenant',
    'tasse': 'tasse', 'tasses': 'tasse',
  }
  return map[u] ?? u
}

/**
 * Formats a quantity for display, rounding to sensible precision.
 */
export function formatAmount(amount) {
  if (!amount || amount === 0) return '0'
  const abs = Math.abs(amount)
  if (abs >= 100) return String(Math.round(amount))
  if (abs >= 10) return (Math.round(amount * 10) / 10).toFixed(1)
  if (abs >= 1) return (Math.round(amount * 100) / 100).toFixed(2).replace(/\.?0+$/, '')
  return (Math.round(amount * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '')
}

// Helper: iterate recipes from a mealPlan slot (handles both [] and legacy null)
function iterRecipes(slot) {
  if (!slot) return []
  if (Array.isArray(slot)) return slot
  return [slot] // legacy single-recipe fallback
}

/**
 * Aggregates a meal plan into a structured grocery list.
 *
 * @param {Object} mealPlan - { [dayIndex]: { breakfast: recipe[], ... } }
 * @param {number} numPeople
 * @returns {{ bySection: Object, sectionOrder: string[] }}
 */
export function buildGroceryList(mealPlan, numPeople) {
  const aggregated = new Map()

  for (const dayMeals of Object.values(mealPlan)) {
    for (const slot of Object.values(dayMeals)) {
      for (const recipe of iterRecipes(slot)) {
        for (const ingr of recipe.ingredients) {
          const normUnit = normalizeUnitForAgg(ingr.unit)
          const key = `${ingr.ingredient.toLowerCase().trim()}|||${normUnit}`

          if (!aggregated.has(key)) {
            aggregated.set(key, {
              ingredient: ingr.ingredient,
              section: ingr.section || 'Varia',
              unit: ingr.unit || '',
              totalAmount: 0,
            })
          }
          aggregated.get(key).totalAmount += ingr.portion * numPeople
        }
      }
    }
  }

  const bySection = {}
  for (const item of aggregated.values()) {
    const section = item.section || 'Varia'
    if (!bySection[section]) bySection[section] = []
    bySection[section].push(item)
  }

  for (const section of Object.keys(bySection)) {
    bySection[section].sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'fr'))
  }

  return { bySection, sectionOrder: SECTION_ORDER }
}

/**
 * Generates ordered sections array (sections with data first in defined order,
 * then any extra sections not in SECTION_ORDER).
 */
export function getOrderedSections(bySection) {
  const inOrder = SECTION_ORDER.filter(s => bySection[s] && bySection[s].length > 0)
  const extra = Object.keys(bySection).filter(
    s => !SECTION_ORDER.includes(s) && bySection[s]?.length > 0
  )
  return [...inOrder, ...extra]
}

/**
 * Generates a professional UTF-8 CSV string for the grocery list (with BOM).
 * Includes camp header, section subtotals, and total item count.
 */
export function generateCSV(campSetup, mealPlan) {
  const { bySection } = buildGroceryList(mealPlan, campSetup.numPeople)
  const sections = getOrderedSections(bySection)
  const esc = v => `"${String(v).replace(/"/g, '""')}"`

  const lines = []

  // Camp header block
  const campName = campSetup.campName || 'Camp scout'
  lines.push(esc(`Liste d'épicerie — ${campName}`))
  if (campSetup.startDate && campSetup.endDate) {
    const fmt = d => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
    lines.push(esc(`Dates: ${fmt(campSetup.startDate)} au ${fmt(campSetup.endDate)} — ${campSetup.numPeople} personne${campSetup.numPeople > 1 ? 's' : ''}`))
  }
  lines.push('')
  lines.push(`${esc('Section')},${esc('Ingrédient')},${esc('Quantité')},${esc('Unité')}`)

  let totalItems = 0
  for (const section of sections) {
    const items = bySection[section]
    for (const item of items) {
      lines.push(`${esc(section)},${esc(item.ingredient)},${formatAmount(item.totalAmount)},${esc(item.unit)}`)
    }
    lines.push(`${esc('')},${esc(`— ${items.length} article${items.length > 1 ? 's' : ''} (${section})`)},${esc('')},${esc('')}`)
    lines.push('')
    totalItems += items.length
  }

  lines.push(`${esc('')},${esc(`TOTAL: ${totalItems} article${totalItems > 1 ? 's' : ''}`)},${esc('')},${esc('')}`)

  return '\ufeff' + lines.join('\n')
}

/**
 * Builds the meal plan summary for menu outputs.
 * Returns array of { dayIndex, date, dayLabel, meals: { breakfast: recipe[], ... } }
 */
export function buildMenuSummary(campSetup, mealPlan) {
  const summary = []
  const start = new Date(campSetup.startDate)

  for (let i = 0; i < campSetup.numDays; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const slot = mealPlan[i] || {}
    summary.push({
      dayIndex: i,
      date,
      dayLabel: date.toLocaleDateString('fr-CA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      meals: {
        breakfast: iterRecipes(slot.breakfast),
        lunch: iterRecipes(slot.lunch),
        dinner: iterRecipes(slot.dinner),
        snack: iterRecipes(slot.snack),
      },
    })
  }

  return summary
}
