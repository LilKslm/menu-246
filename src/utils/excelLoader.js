// xlsx is lazy-loaded on first call to avoid blocking initial render
let _XLSX = null
async function getXLSX() {
  if (!_XLSX) _XLSX = await import('xlsx')
  return _XLSX
}

// Maps Excel category values to internal mealType keys
const CATEGORY_MAP = {
  '1. Déjeuner': 'breakfast',
  '2. Diner': 'lunch',
  '3. Souper': 'dinner',
  'Collation': 'snack',
}

// Normalize inconsistent unit spellings from the Excel file
function normalizeUnit(raw) {
  if (!raw && raw !== 0) return ''
  const u = String(raw).trim()
  const lower = u.toLowerCase()

  const map = {
    'gr': 'g',
    'g': 'g',
    'ml': 'ml',
    'mL': 'ml',
    'l': 'L',
    'L': 'L',
    'kg': 'kg',
    'unité': 'Unité',
    'unite': 'Unité',
    'unites': 'Unité',
    'unités': 'Unité',
    'sachet': 'Sachet',
    'sachets': 'Sachet',
    'sac': 'Sac',
    'sacs': 'Sac',
    'boite': 'Boîte',
    'boîte': 'Boîte',
    'bo\u00eete': 'Boîte',
    'boites': 'Boîte',
    'boîtes': 'Boîte',
    'conserve': 'Conserve',
    'conserves': 'Conserve',
    'casseaux': 'Casseaux',
    'caseaux': 'Casseaux',
    'portion': 'Portion',
    'portions': 'Portion',
    'tranche': 'Tranche',
    'tranches': 'Tranche',
    'paquet': 'Paquet',
    'paquets': 'Paquet',
    'contenant': 'Contenant',
    'contenants': 'Contenant',
    'tasse': 'Tasse',
    'tasses': 'Tasse',
    'c. à soupe': 'c. à soupe',
    'c. à thé': 'c. à thé',
    'boîte de conserve': 'Boîte de conserve',
  }

  return map[u] ?? map[lower] ?? u
}

// Normalize section names (trim, fix trailing spaces, etc.)
function normalizeSection(raw) {
  if (!raw) return 'Varia'
  return String(raw).trim() || 'Varia'
}

/**
 * Loads recipe data from the Excel file in /public/.
 * Returns { breakfast: [...], lunch: [...], dinner: [...], snack: [] }
 * Each recipe: { id, name, category, mealType, ingredients: [{ ingredient, section, portion, unit }] }
 */
export async function loadRecipes() {
  const XLSX = await getXLSX()
  let arrayBuffer
  if (typeof window !== 'undefined' && window.electronAPI?.loadExcelFile) {
    arrayBuffer = await window.electronAPI.loadExcelFile()
  } else {
    const response = await fetch('/Menu Template.xlsx')
    if (!response.ok) throw new Error(`Failed to fetch Excel file: ${response.status}`)
    arrayBuffer = await response.arrayBuffer()
  }

  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  // Find the recipe library sheet — look for one containing "BIBLIOTH" or use index 1
  let sheetName = workbook.SheetNames.find(
    n => n.toUpperCase().includes('BIBLIOTH') || n.toUpperCase().includes('LIBRARY')
  )
  if (!sheetName) {
    // Fall back to second sheet if present, otherwise first
    sheetName = workbook.SheetNames[1] ?? workbook.SheetNames[0]
  }

  const sheet = workbook.Sheets[sheetName]

  // Use header:1 to get raw arrays — avoids Unicode issues with accented headers
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Detect header row index (look for a row that has "PLAT" or "CAT" somewhere)
  let headerIdx = 0
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = rows[i].join('|').toUpperCase()
    if (rowStr.includes('PLAT') || rowStr.includes('CAT')) {
      headerIdx = i
      break
    }
  }

  // Detect column positions from the header row
  const headerRow = rows[headerIdx].map(h => String(h).trim().toUpperCase())

  function findCol(...candidates) {
    for (const c of candidates) {
      const idx = headerRow.findIndex(h => h.includes(c.toUpperCase()))
      if (idx !== -1) return idx
    }
    return -1
  }

  const colCat = findCol('CAT') // CATÉGORIE
  const colPlat = findCol('PLAT') // recipe name
  const colIngr = findCol('INGR') // INGRÉDIENT
  const colSection = findCol('SECTION')
  const colPortion = findCol('PORTION')
  const colUnit = findCol('MESURE', 'UNIT', 'UNI')

  // Fallback to hardcoded indices if detection fails (col B=1, C=2, D=3, E=4, F=5, G=6)
  const CI_CAT = colCat !== -1 ? colCat : 1
  const CI_PLAT = colPlat !== -1 ? colPlat : 2
  const CI_INGR = colIngr !== -1 ? colIngr : 3
  const CI_SECTION = colSection !== -1 ? colSection : 4
  const CI_PORTION = colPortion !== -1 ? colPortion : 5
  const CI_UNIT = colUnit !== -1 ? colUnit : 6

  // Group rows into recipes
  const recipeMap = new Map() // key → recipe object

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const cat = String(row[CI_CAT] || '').trim()
    const mealType = CATEGORY_MAP[cat]
    if (!mealType) continue // skip '0. Autre', 'yujuuu', empty rows

    const recipeName = String(row[CI_PLAT] || '').trim()
    if (!recipeName) continue

    const key = `${cat}|||${recipeName}`

    if (!recipeMap.has(key)) {
      recipeMap.set(key, {
        id: key,
        name: recipeName,
        category: cat,
        mealType,
        isCustom: false,
        ingredients: [],
      })
    }

    const recipe = recipeMap.get(key)
    const ingredient = String(row[CI_INGR] || '').trim()
    const section = normalizeSection(row[CI_SECTION])
    const portionRaw = row[CI_PORTION]
    const portion =
      typeof portionRaw === 'number' ? portionRaw : parseFloat(String(portionRaw).replace(',', '.')) || 0
    const unit = normalizeUnit(row[CI_UNIT])

    if (ingredient) {
      recipe.ingredients.push({ ingredient, section, portion, unit })
    }
  }

  // Organize into categories and sort alphabetically
  const result = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const recipe of recipeMap.values()) {
    result[recipe.mealType].push(recipe)
  }
  for (const key of Object.keys(result)) {
    result[key].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  return result
}

/**
 * Loads custom recipes from localStorage and merges them into an existing recipes object.
 */
export function loadCustomRecipes(baseRecipes) {
  try {
    const stored = localStorage.getItem('scoutMenuCustomRecipes')
    if (!stored) return baseRecipes

    const custom = JSON.parse(stored)
    const merged = {
      breakfast: [...baseRecipes.breakfast],
      lunch: [...baseRecipes.lunch],
      dinner: [...baseRecipes.dinner],
      snack: [...baseRecipes.snack],
    }

    for (const recipe of custom) {
      if (merged[recipe.mealType]) {
        merged[recipe.mealType].push(recipe)
        merged[recipe.mealType].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      }
    }

    return merged
  } catch {
    return baseRecipes
  }
}

/**
 * Saves a new custom recipe to localStorage.
 * Returns the updated custom recipes array.
 */
export function saveCustomRecipe(recipe) {
  try {
    const stored = localStorage.getItem('scoutMenuCustomRecipes')
    const existing = stored ? JSON.parse(stored) : []
    const updated = [...existing, recipe]
    localStorage.setItem('scoutMenuCustomRecipes', JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

/**
 * Deletes a custom recipe from localStorage by id.
 */
export function deleteCustomRecipe(recipeId) {
  try {
    const stored = localStorage.getItem('scoutMenuCustomRecipes')
    if (!stored) return
    const existing = JSON.parse(stored)
    const updated = existing.filter(r => r.id !== recipeId)
    localStorage.setItem('scoutMenuCustomRecipes', JSON.stringify(updated))
  } catch {
    // ignore
  }
}

/**
 * Updates an existing custom recipe in localStorage.
 */
export function updateCustomRecipe(updatedRecipe) {
  try {
    const stored = localStorage.getItem('scoutMenuCustomRecipes')
    const existing = stored ? JSON.parse(stored) : []
    const updated = existing.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
    localStorage.setItem('scoutMenuCustomRecipes', JSON.stringify(updated))
  } catch {
    // ignore
  }
}

/**
 * Saves imported recipes (from JSON file import) to localStorage.
 */
export function saveImportedRecipes(recipesObj) {
  try {
    localStorage.setItem('scoutMenuImportedRecipes', JSON.stringify(recipesObj))
  } catch {}
}

/**
 * Loads previously imported recipes from localStorage and merges into baseRecipes.
 */
export function loadImportedRecipes(baseRecipes) {
  try {
    const stored = localStorage.getItem('scoutMenuImportedRecipes')
    if (!stored) return baseRecipes
    const imported = JSON.parse(stored)
    const merged = {
      breakfast: [...baseRecipes.breakfast],
      lunch: [...baseRecipes.lunch],
      dinner: [...baseRecipes.dinner],
      snack: [...baseRecipes.snack],
    }
    for (const mealType of Object.keys(merged)) {
      if (!Array.isArray(imported[mealType])) continue
      const existingIds = new Set(merged[mealType].map(r => r.id))
      for (const recipe of imported[mealType]) {
        if (!existingIds.has(recipe.id)) {
          merged[mealType].push({ ...recipe, isImported: true })
        }
      }
      merged[mealType].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }
    return merged
  } catch {
    return baseRecipes
  }
}

/**
 * Returns all custom recipes as a flat array.
 */
export function getAllCustomRecipes() {
  try {
    const stored = localStorage.getItem('scoutMenuCustomRecipes')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Exports all custom + imported recipes as a JSON string (downloadable).
 * Format: { breakfast: [...], lunch: [...], dinner: [...], snack: [...] }
 */
export function exportRecipesAsJSON(recipes) {
  const exportable = {
    breakfast: recipes.breakfast.filter(r => r.isCustom || r.isImported),
    lunch: recipes.lunch.filter(r => r.isCustom || r.isImported),
    dinner: recipes.dinner.filter(r => r.isCustom || r.isImported),
    snack: recipes.snack.filter(r => r.isCustom || r.isImported),
  }
  return JSON.stringify(exportable, null, 2)
}

/**
 * Exports all custom + imported recipes as a UTF-8 CSV string with BOM.
 * Columns: mealType, name, ingredient, section, portion, unit
 */
export function exportRecipesAsCSV(recipes) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = ['\ufeff' + [esc('Type de repas'), esc('Recette'), esc('Ingrédient'), esc('Section'), esc('Portion'), esc('Unité')].join(',')]

  const MEAL_LABELS = { breakfast: 'Déjeuner', lunch: 'Dîner', dinner: 'Souper', snack: 'Collation' }
  for (const [mealType, recipeList] of Object.entries(recipes)) {
    for (const recipe of recipeList.filter(r => r.isCustom || r.isImported)) {
      for (const ingr of recipe.ingredients) {
        lines.push([esc(MEAL_LABELS[mealType] || mealType), esc(recipe.name), esc(ingr.ingredient), esc(ingr.section), ingr.portion, esc(ingr.unit)].join(','))
      }
    }
  }
  return lines.join('\n')
}
