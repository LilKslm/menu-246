/**
 * Parse a YYYY-MM-DD date string in LOCAL timezone (not UTC).
 * `new Date('2024-04-05')` returns UTC midnight → shows April 4 in EST.
 * This function returns local midnight so the date always matches what the user typed.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date(NaN)
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return new Date(NaN)
  const [year, month, day] = parts
  return new Date(year, month - 1, day)
}

/**
 * Label parts for the Nth day of a camp (0-based), in local time / fr-CA.
 * @returns {{ weekday: string, day: number, month: string, full: string }}
 */
export function getDayLabel(startDate, dayIndex) {
  const date = parseLocalDate(startDate)
  date.setDate(date.getDate() + dayIndex)
  return {
    weekday: date.toLocaleDateString('fr-CA', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('fr-CA', { month: 'short' }),
    full: date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

// Ordered sections for the grocery list display
export const SECTION_ORDER = [
  'Fruits et légumes',
  'Produits céréaliers',
  'Produits laitiers',
  'Viandes',
  'Varia',
  'Varia - Congelés',
]

// French food nouns that are invariable (identical singular/plural) and must NOT be de-pluralized
const INVARIABLE_FOODS = new Set([
  'riz', 'maïs', 'mais', 'ananas', 'cassis', 'radis', 'pois',
  'fenouil', 'céleri', 'celeri', 'brocolis', 'concombres',
])

// Normalize ingredient names for aggregation: lowercases and strips common French plural suffixes
// so "Tomate" and "Tomates" share the same key, as do "Laitue romaine" / "Laitues romaines"
function normalizeIngredientName(name) {
  const s = name.toLowerCase().trim()
  if (s.endsWith('eaux')) return s.slice(0, -4) + 'eau'  // poireaux→poireau
  if (s.endsWith('s') && s.length > 3 && !INVARIABLE_FOODS.has(s)) return s.slice(0, -1)
  return s
}

// Normalize unit strings for aggregation — converts to base units so g+kg and ml+L share the same key
function normalizeUnitForAgg(unit) {
  if (!unit) return ''
  const u = unit.trim().toLowerCase()
  // Mass → g (base unit)
  if (['kg', 'kilo', 'kilos', 'kilogramme', 'kilogrammes'].includes(u)) return 'g'
  if (['g', 'gr', 'grs', 'gram', 'grams', 'gramme', 'grammes'].includes(u)) return 'g'
  // Volume → ml (base unit)
  if (['l', 'litre', 'litres', 'liter', 'liters'].includes(u)) return 'ml'
  if (['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters', 'cc'].includes(u)) return 'ml'
  // Container/count units → singular canonical form
  const map = {
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

// Convert a raw quantity to its base unit (g for mass, ml for volume; others unchanged)
function toBaseQty(qty, rawUnit) {
  if (!rawUnit) return qty
  const u = rawUnit.trim().toLowerCase()
  if (['kg', 'kilo', 'kilos', 'kilogramme', 'kilogrammes'].includes(u)) return qty * 1000
  if (['l', 'litre', 'litres', 'liter', 'liters'].includes(u)) return qty * 1000
  return qty
}

// Format a grocery quantity for display (converts g→kg if ≥1000, ml→L if ≥1000)
export function formatGroceryQty(totalAmount, baseUnit) {
  if (baseUnit === 'g' && totalAmount >= 1000) return formatAmount(totalAmount / 1000)
  if (baseUnit === 'ml' && totalAmount >= 1000) return formatAmount(totalAmount / 1000)
  return formatAmount(totalAmount)
}

// Format the display unit for a grocery item (upgrades to larger unit, pluralizes containers)
export function formatGroceryUnit(totalAmount, baseUnit) {
  if (baseUnit === 'g' && totalAmount >= 1000) return 'kg'
  if (baseUnit === 'ml' && totalAmount >= 1000) return 'L'
  const pluralMap = {
    sachet: 'sachets', sac: 'sacs', 'boîte': 'boîtes', conserve: 'conserves',
    portion: 'portions', tranche: 'tranches', paquet: 'paquets',
    contenant: 'contenants', tasse: 'tasses', 'unité': 'unités',
  }
  if (totalAmount !== 1 && pluralMap[baseUnit]) return pluralMap[baseUnit]
  return baseUnit
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
 * Resolve the headcount for a given day: a per-day override if set, else the global count.
 * @param {number} numPeople - global headcount
 * @param {Object} [numPeopleByDay] - sparse map { [dayIndex]: count }
 */
export function getPeopleForDay(numPeople, numPeopleByDay, dayIndex) {
  const override = numPeopleByDay?.[dayIndex]
  return override == null ? numPeople : override
}

/** True when at least one day has a headcount that differs from the global count. */
export function hasPerDayOverrides(numPeople, numPeopleByDay) {
  if (!numPeopleByDay) return false
  return Object.values(numPeopleByDay).some((n) => n != null && n !== numPeople)
}

/**
 * Aggregates a meal plan into a structured grocery list.
 *
 * @param {Object} mealPlan - { [dayIndex]: { breakfast: recipe[], ... } }
 * @param {number} numPeople - global headcount
 * @param {Object} [numPeopleByDay] - sparse per-day overrides { [dayIndex]: count }
 * @returns {{ bySection: Object, sectionOrder: string[] }}
 */
export function buildGroceryList(mealPlan, numPeople, numPeopleByDay) {
  const aggregated = new Map()

  for (const [dayIndex, dayMeals] of Object.entries(mealPlan)) {
    const people = getPeopleForDay(numPeople, numPeopleByDay, dayIndex)
    for (const slot of Object.values(dayMeals)) {
      for (const recipe of iterRecipes(slot)) {
        for (const ingr of (recipe.ingredients ?? [])) {
          const normUnit = normalizeUnitForAgg(ingr.unit)
          const key = `${normalizeIngredientName(ingr.ingredient)}|||${normUnit}`

          if (!aggregated.has(key)) {
            aggregated.set(key, {
              ingredient: ingr.ingredient,
              section: ingr.section || 'Varia',
              unit: normUnit,
              totalAmount: 0,
            })
          }
          aggregated.get(key).totalAmount += toBaseQty(ingr.portion, ingr.unit) * people
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
  const { bySection } = buildGroceryList(mealPlan, campSetup.numPeople, campSetup.numPeopleByDay)
  const sections = getOrderedSections(bySection)
  const esc = v => `"${String(v).replace(/"/g, '""')}"`

  const lines = []

  // Camp header block
  const campName = campSetup.campName || 'Camp scout'
  lines.push(esc(`Liste d'épicerie — ${campName}`))
  if (campSetup.startDate && campSetup.endDate) {
    const fmt = d => parseLocalDate(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
    const variable = hasPerDayOverrides(campSetup.numPeople, campSetup.numPeopleByDay)
    const people = `${campSetup.numPeople} personne${campSetup.numPeople > 1 ? 's' : ''}${variable ? ' (variable par jour)' : ''}`
    lines.push(esc(`Dates: ${fmt(campSetup.startDate)} au ${fmt(campSetup.endDate)} — ${people}`))
  }
  lines.push('')
  lines.push(`${esc('Section')},${esc('Ingrédient')},${esc('Quantité')},${esc('Unité')}`)

  let totalItems = 0
  for (const section of sections) {
    const items = bySection[section]
    for (const item of items) {
      lines.push(`${esc(section)},${esc(item.ingredient)},${esc(formatGroceryQty(item.totalAmount, item.unit))},${esc(formatGroceryUnit(item.totalAmount, item.unit))}`)
    }
    lines.push(`${esc('')},${esc(`— ${items.length} article${items.length > 1 ? 's' : ''} (${section})`)},${esc('')},${esc('')}`)
    lines.push('')
    totalItems += items.length
  }

  lines.push(`${esc('')},${esc(`TOTAL: ${totalItems} article${totalItems > 1 ? 's' : ''}`)},${esc('')},${esc('')}`)

  return '\ufeff' + lines.join('\r\n')
}

/**
 * Builds the meal plan summary for menu outputs.
 * Returns array of { dayIndex, date, dayLabel, meals: { breakfast: recipe[], ... } }
 */
export function buildMenuSummary(campSetup, mealPlan) {
  const summary = []
  const start = parseLocalDate(campSetup.startDate)

  for (let i = 0; i < campSetup.numDays; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
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
