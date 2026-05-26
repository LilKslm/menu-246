import { describe, it, expect } from 'vitest'
import {
  parseLocalDate,
  formatAmount,
  formatGroceryQty,
  formatGroceryUnit,
  buildGroceryList,
  getPeopleForDay,
  hasPerDayOverrides,
  generateCSV,
  buildMenuSummary,
  getOrderedSections,
  SECTION_ORDER,
} from './calculations.js'

// ---------------------------------------------------------------------------
// 1. parseLocalDate
// ---------------------------------------------------------------------------
describe('parseLocalDate', () => {
  it('returns a Date with matching year/month/day for a valid YYYY-MM-DD string', () => {
    const d = parseLocalDate('2024-04-05')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(3) // April = index 3
    expect(d.getDate()).toBe(5)
  })

  it('returns local midnight (not UTC midnight)', () => {
    const d = parseLocalDate('2024-01-15')
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
  })

  it('handles first day of year', () => {
    const d = parseLocalDate('2025-01-01')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(1)
  })

  it('handles last day of year', () => {
    const d = parseLocalDate('2025-12-31')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(11)
    expect(d.getDate()).toBe(31)
  })

  it('returns an invalid Date for empty string', () => {
    const d = parseLocalDate('')
    expect(isNaN(d.getTime())).toBe(true)
  })

  it('returns an invalid Date for null/undefined (falsy)', () => {
    expect(isNaN(parseLocalDate(null).getTime())).toBe(true)
    expect(isNaN(parseLocalDate(undefined).getTime())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. formatAmount
// ---------------------------------------------------------------------------
describe('formatAmount', () => {
  it('returns "0" for 0', () => {
    expect(formatAmount(0)).toBe('0')
  })

  it('returns "0" for falsy values (null, undefined, false)', () => {
    expect(formatAmount(null)).toBe('0')
    expect(formatAmount(undefined)).toBe('0')
    expect(formatAmount(false)).toBe('0')
  })

  it('rounds to integer for values >= 100', () => {
    expect(formatAmount(250.4)).toBe('250')
    expect(formatAmount(100)).toBe('100')
    expect(formatAmount(999.9)).toBe('1000')
    expect(formatAmount(100.6)).toBe('101')
  })

  it('rounds to 1 decimal for values >= 10 and < 100', () => {
    expect(formatAmount(12.34)).toBe('12.3')
    expect(formatAmount(10)).toBe('10.0')
    expect(formatAmount(99.99)).toBe('100.0')
    expect(formatAmount(15.0)).toBe('15.0')
  })

  it('rounds to up to 2 decimals, trimming trailing zeros, for values >= 1 and < 10', () => {
    expect(formatAmount(1.5)).toBe('1.5')
    expect(formatAmount(2)).toBe('2')
    expect(formatAmount(3.14)).toBe('3.14')
    expect(formatAmount(9.10)).toBe('9.1')
    expect(formatAmount(1.00)).toBe('1')
  })

  it('rounds to up to 3 decimals, trimming trailing zeros, for values < 1', () => {
    expect(formatAmount(0.125)).toBe('0.125')
    expect(formatAmount(0.5)).toBe('0.5')
    expect(formatAmount(0.100)).toBe('0.1')
    expect(formatAmount(0.001)).toBe('0.001')
  })
})

// ---------------------------------------------------------------------------
// 3. formatGroceryQty & formatGroceryUnit
// ---------------------------------------------------------------------------
describe('formatGroceryQty', () => {
  it('converts g to kg display when totalAmount >= 1000', () => {
    // 1500 g → display 1.5 (kg)
    expect(formatGroceryQty(1500, 'g')).toBe('1.5')
  })

  it('converts ml to L display when totalAmount >= 1000', () => {
    // 2000 ml → display 2 (L)
    expect(formatGroceryQty(2000, 'ml')).toBe('2')
  })

  it('keeps g as-is when totalAmount < 1000', () => {
    expect(formatGroceryQty(500, 'g')).toBe('500')
  })

  it('keeps ml as-is when totalAmount < 1000', () => {
    expect(formatGroceryQty(750, 'ml')).toBe('750')
  })

  it('passes through container units unchanged', () => {
    expect(formatGroceryQty(3, 'sac')).toBe('3')
  })

  it('returns formatted 0 for 0 amount', () => {
    expect(formatGroceryQty(0, 'g')).toBe('0')
  })
})

describe('formatGroceryUnit', () => {
  it('returns "kg" when baseUnit is "g" and totalAmount >= 1000', () => {
    expect(formatGroceryUnit(1500, 'g')).toBe('kg')
  })

  it('returns "L" when baseUnit is "ml" and totalAmount >= 1000', () => {
    expect(formatGroceryUnit(2000, 'ml')).toBe('L')
  })

  it('returns "g" when baseUnit is "g" and totalAmount < 1000', () => {
    expect(formatGroceryUnit(500, 'g')).toBe('g')
  })

  it('returns "ml" when baseUnit is "ml" and totalAmount < 1000', () => {
    expect(formatGroceryUnit(750, 'ml')).toBe('ml')
  })

  it('pluralizes "sac" to "sacs" when amount != 1', () => {
    expect(formatGroceryUnit(3, 'sac')).toBe('sacs')
    expect(formatGroceryUnit(2, 'sac')).toBe('sacs')
    expect(formatGroceryUnit(0, 'sac')).toBe('sacs')
  })

  it('keeps "sac" singular when amount is exactly 1', () => {
    expect(formatGroceryUnit(1, 'sac')).toBe('sac')
  })

  it('pluralizes "unité" to "unités" when amount != 1', () => {
    expect(formatGroceryUnit(4, 'unité')).toBe('unités')
  })

  it('keeps "unité" singular when amount is exactly 1', () => {
    expect(formatGroceryUnit(1, 'unité')).toBe('unité')
  })

  it('pluralizes "sachet" to "sachets"', () => {
    expect(formatGroceryUnit(5, 'sachet')).toBe('sachets')
  })

  it('returns unknown units as-is', () => {
    expect(formatGroceryUnit(3, 'pinch')).toBe('pinch')
  })
})

// ---------------------------------------------------------------------------
// 4. buildGroceryList
// ---------------------------------------------------------------------------
describe('buildGroceryList', () => {
  // Helper factory for a minimal recipe
  function makeRecipe(id, ingredients) {
    return { id, name: `Recipe ${id}`, mealType: 'dinner', ingredients }
  }

  it('single day, single recipe: total = portion × numPeople', () => {
    const mealPlan = {
      0: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r1', [
          { ingredient: 'Tomate', section: 'Fruits et légumes', portion: 2, unit: '' },
        ])],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 5)
    const items = bySection['Fruits et légumes']
    expect(items).toHaveLength(1)
    expect(items[0].ingredient).toBe('Tomate')
    expect(items[0].totalAmount).toBe(10) // 2 × 5
  })

  it('kg → g conversion: 2 kg portion with numPeople=3 → 6000 g', () => {
    const mealPlan = {
      0: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r1', [
          { ingredient: 'Farine', section: 'Produits céréaliers', portion: 2, unit: 'kg' },
        ])],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 3)
    const items = bySection['Produits céréaliers']
    expect(items[0].totalAmount).toBe(6000) // 2 kg × 1000 × 3 people
    expect(items[0].unit).toBe('g')
  })

  it('same ingredient across two recipes sums together', () => {
    const mealPlan = {
      0: {
        breakfast: [makeRecipe('r1', [
          { ingredient: 'Carotte', section: 'Fruits et légumes', portion: 1, unit: 'g' },
        ])],
        lunch: [makeRecipe('r2', [
          { ingredient: 'Carotte', section: 'Fruits et légumes', portion: 2, unit: 'g' },
        ])],
        dinner: [],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 4)
    const items = bySection['Fruits et légumes']
    expect(items).toHaveLength(1)
    expect(items[0].totalAmount).toBe(12) // (1+2) × 4
  })

  it('"Tomate" and "Tomates" collapse to one entry', () => {
    const mealPlan = {
      0: {
        breakfast: [makeRecipe('r1', [
          { ingredient: 'Tomate', section: 'Fruits et légumes', portion: 1, unit: '' },
        ])],
        lunch: [makeRecipe('r2', [
          { ingredient: 'Tomates', section: 'Fruits et légumes', portion: 1, unit: '' },
        ])],
        dinner: [],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 2)
    const items = bySection['Fruits et légumes']
    expect(items).toHaveLength(1)
    expect(items[0].totalAmount).toBe(4) // (1+1) × 2
  })

  it('"kg" and "g" units collapse into one grams entry', () => {
    const mealPlan = {
      0: {
        breakfast: [makeRecipe('r1', [
          { ingredient: 'Beurre', section: 'Produits laitiers', portion: 0.5, unit: 'kg' },
        ])],
        lunch: [makeRecipe('r2', [
          { ingredient: 'Beurre', section: 'Produits laitiers', portion: 200, unit: 'g' },
        ])],
        dinner: [],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 2)
    const items = bySection['Produits laitiers']
    expect(items).toHaveLength(1)
    // 0.5 kg × 1000 × 2 + 200 g × 2 = 1000 + 400 = 1400
    expect(items[0].totalAmount).toBe(1400)
    expect(items[0].unit).toBe('g')
  })

  it('per-day override: day 0 uses global numPeople, day 1 uses override', () => {
    const numPeople = 24
    const numPeopleByDay = { 1: 20 } // day 1 has override; note: Object.entries gives string keys
    const portion = 1
    const mealPlan = {
      0: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r1', [
          { ingredient: 'Pain', section: 'Produits céréaliers', portion, unit: '' },
        ])],
        snack: [],
      },
      1: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r2', [
          { ingredient: 'Pain', section: 'Produits céréaliers', portion, unit: '' },
        ])],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, numPeople, numPeopleByDay)
    const items = bySection['Produits céréaliers']
    expect(items).toHaveLength(1)
    // day 0: portion × 24 = 24; day 1: portion × 20 = 20; total = 44
    expect(items[0].totalAmount).toBe(44)
  })

  it('numPeopleByDay omitted → all days use global numPeople', () => {
    const mealPlan = {
      0: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r1', [
          { ingredient: 'Pomme', section: 'Fruits et légumes', portion: 1, unit: '' },
        ])],
        snack: [],
      },
      1: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r2', [
          { ingredient: 'Pomme', section: 'Fruits et légumes', portion: 1, unit: '' },
        ])],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 10)
    const items = bySection['Fruits et légumes']
    expect(items[0].totalAmount).toBe(20) // 1 × 10 × 2 days
  })

  it('ingredient with no section defaults to "Varia"', () => {
    const mealPlan = {
      0: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r1', [
          { ingredient: 'Sel', section: undefined, portion: 5, unit: 'g' },
        ])],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 2)
    expect(bySection['Varia']).toBeDefined()
    expect(bySection['Varia'][0].ingredient).toBe('Sel')
  })

  it('items within a section are sorted alphabetically (fr)', () => {
    const mealPlan = {
      0: {
        breakfast: [],
        lunch: [],
        dinner: [makeRecipe('r1', [
          { ingredient: 'Zucchini', section: 'Fruits et légumes', portion: 1, unit: '' },
          { ingredient: 'Ananas', section: 'Fruits et légumes', portion: 1, unit: '' },
          { ingredient: 'Mangue', section: 'Fruits et légumes', portion: 1, unit: '' },
        ])],
        snack: [],
      },
    }
    const { bySection } = buildGroceryList(mealPlan, 1)
    const names = bySection['Fruits et légumes'].map(i => i.ingredient)
    expect(names[0]).toBe('Ananas')
    expect(names[1]).toBe('Mangue')
    expect(names[2]).toBe('Zucchini')
  })

  it('returns the constant sectionOrder array', () => {
    const { sectionOrder } = buildGroceryList({}, 10)
    expect(sectionOrder).toEqual(SECTION_ORDER)
  })

  it('empty mealPlan returns empty bySection', () => {
    const { bySection } = buildGroceryList({}, 10)
    expect(Object.keys(bySection)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 5. getPeopleForDay
// ---------------------------------------------------------------------------
describe('getPeopleForDay', () => {
  it('returns global numPeople when numPeopleByDay is undefined', () => {
    expect(getPeopleForDay(24, undefined, 0)).toBe(24)
  })

  it('returns global numPeople when numPeopleByDay is empty object', () => {
    expect(getPeopleForDay(24, {}, 0)).toBe(24)
  })

  it('returns override value when present for that dayIndex (numeric key)', () => {
    expect(getPeopleForDay(24, { 1: 20 }, 1)).toBe(20)
  })

  it('returns override value when present for that dayIndex (string key)', () => {
    // Object.entries gives string keys; function must handle this
    expect(getPeopleForDay(24, { '2': 15 }, '2')).toBe(15)
  })

  it('returns global when dayIndex not in overrides', () => {
    expect(getPeopleForDay(24, { 1: 20 }, 3)).toBe(24)
  })

  it('respects an override of 0 (does not treat it as falsy)', () => {
    // override == null check means 0 is considered set (0 != null is true)
    expect(getPeopleForDay(24, { 0: 0 }, 0)).toBe(0)
  })

  it('returns global numPeople when numPeopleByDay is null', () => {
    expect(getPeopleForDay(10, null, 0)).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// 6. hasPerDayOverrides
// ---------------------------------------------------------------------------
describe('hasPerDayOverrides', () => {
  it('returns false when numPeopleByDay is undefined', () => {
    expect(hasPerDayOverrides(24, undefined)).toBe(false)
  })

  it('returns false when numPeopleByDay is null', () => {
    expect(hasPerDayOverrides(24, null)).toBe(false)
  })

  it('returns false when numPeopleByDay is empty object', () => {
    expect(hasPerDayOverrides(24, {})).toBe(false)
  })

  it('returns false when all values equal global numPeople', () => {
    expect(hasPerDayOverrides(24, { 0: 24, 1: 24 })).toBe(false)
  })

  it('returns true when at least one day differs from global', () => {
    expect(hasPerDayOverrides(24, { 0: 24, 1: 20 })).toBe(true)
  })

  it('returns true when a single day differs', () => {
    expect(hasPerDayOverrides(10, { 0: 8 })).toBe(true)
  })

  it('ignores null values in the map', () => {
    // null values are excluded by the `n != null` guard
    expect(hasPerDayOverrides(24, { 0: null })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 7. generateCSV
// ---------------------------------------------------------------------------
describe('generateCSV', () => {
  function makeSimpleMealPlan() {
    return {
      0: {
        breakfast: [],
        lunch: [],
        dinner: [{
          id: 'r1', name: 'Spaghetti', mealType: 'dinner',
          ingredients: [
            { ingredient: 'Tomate', section: 'Fruits et légumes', portion: 1, unit: '' },
            { ingredient: 'Pâte', section: 'Produits céréaliers', portion: 100, unit: 'g' },
          ],
        }],
        snack: [],
      },
    }
  }

  const baseCampSetup = {
    campName: 'Camp Aigle',
    startDate: '2025-07-01',
    endDate: '2025-07-07',
    numPeople: 24,
    numDays: 7,
    numPeopleByDay: undefined,
  }

  it('starts with UTF-8 BOM character', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv.startsWith('﻿')).toBe(true)
  })

  it('contains the camp name in the header', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv).toContain('Camp Aigle')
  })

  it('contains the people count', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv).toContain('24 personne')
  })

  it('does NOT include "variable par jour" when there are no per-day overrides', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv).not.toContain('variable par jour')
  })

  it('includes "variable par jour" when numPeopleByDay has a differing value', () => {
    const campSetup = {
      ...baseCampSetup,
      numPeopleByDay: { 1: 20 },
    }
    const csv = generateCSV(campSetup, makeSimpleMealPlan())
    expect(csv).toContain('variable par jour')
  })

  it('contains section names', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv).toContain('Fruits et légumes')
    expect(csv).toContain('Produits céréaliers')
  })

  it('contains a TOTAL: line', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv).toContain('TOTAL:')
  })

  it('contains ingredient names', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv).toContain('Tomate')
    expect(csv).toContain('Pâte')
  })

  it('contains section subtotal article lines', () => {
    const csv = generateCSV(baseCampSetup, makeSimpleMealPlan())
    expect(csv).toContain('article')
  })

  it('handles empty mealPlan gracefully (no crash, still has BOM and header)', () => {
    const csv = generateCSV(baseCampSetup, {})
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('Camp Aigle')
    expect(csv).toContain('TOTAL:')
  })

  it('uses fallback camp name "Camp scout" when campName is empty', () => {
    const campSetup = { ...baseCampSetup, campName: '' }
    const csv = generateCSV(campSetup, {})
    expect(csv).toContain('Camp scout')
  })
})

// ---------------------------------------------------------------------------
// 8. buildMenuSummary
// ---------------------------------------------------------------------------
describe('buildMenuSummary', () => {
  const campSetup = {
    campName: 'Test Camp',
    startDate: '2025-07-01',
    endDate: '2025-07-03',
    numPeople: 10,
    numDays: 3,
  }

  it('returns array of length numDays', () => {
    const summary = buildMenuSummary(campSetup, {})
    expect(summary).toHaveLength(3)
  })

  it('each entry has dayIndex matching loop index', () => {
    const summary = buildMenuSummary(campSetup, {})
    expect(summary[0].dayIndex).toBe(0)
    expect(summary[1].dayIndex).toBe(1)
    expect(summary[2].dayIndex).toBe(2)
  })

  it('each entry has a Date object for date', () => {
    const summary = buildMenuSummary(campSetup, {})
    for (const entry of summary) {
      expect(entry.date).toBeInstanceOf(Date)
    }
  })

  it('dates are sequential local dates starting from startDate', () => {
    const summary = buildMenuSummary(campSetup, {})
    expect(summary[0].date.getDate()).toBe(1)
    expect(summary[0].date.getMonth()).toBe(6) // July
    expect(summary[1].date.getDate()).toBe(2)
    expect(summary[2].date.getDate()).toBe(3)
  })

  it('each entry has a dayLabel string', () => {
    const summary = buildMenuSummary(campSetup, {})
    for (const entry of summary) {
      expect(typeof entry.dayLabel).toBe('string')
      expect(entry.dayLabel.length).toBeGreaterThan(0)
    }
  })

  it('each entry has meals object with breakfast/lunch/dinner/snack arrays', () => {
    const summary = buildMenuSummary(campSetup, {})
    for (const entry of summary) {
      expect(Array.isArray(entry.meals.breakfast)).toBe(true)
      expect(Array.isArray(entry.meals.lunch)).toBe(true)
      expect(Array.isArray(entry.meals.dinner)).toBe(true)
      expect(Array.isArray(entry.meals.snack)).toBe(true)
    }
  })

  it('empty mealPlan slots become empty arrays', () => {
    const summary = buildMenuSummary(campSetup, {})
    expect(summary[0].meals.breakfast).toEqual([])
    expect(summary[0].meals.dinner).toEqual([])
  })

  it('populates meals from mealPlan correctly', () => {
    const recipe = { id: 'r1', name: 'Gruau', mealType: 'breakfast', ingredients: [] }
    const mealPlan = {
      1: { breakfast: [recipe], lunch: [], dinner: [], snack: [] },
    }
    const summary = buildMenuSummary(campSetup, mealPlan)
    expect(summary[1].meals.breakfast).toHaveLength(1)
    expect(summary[1].meals.breakfast[0].name).toBe('Gruau')
  })

  it('handles numDays=1 correctly', () => {
    const singleDayCamp = { ...campSetup, numDays: 1 }
    const summary = buildMenuSummary(singleDayCamp, {})
    expect(summary).toHaveLength(1)
    expect(summary[0].dayIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 9. getOrderedSections
// ---------------------------------------------------------------------------
describe('getOrderedSections', () => {
  it('returns sections in SECTION_ORDER order when all are present', () => {
    const bySection = {
      'Varia': [{ ingredient: 'Sel' }],
      'Fruits et légumes': [{ ingredient: 'Tomate' }],
      'Produits laitiers': [{ ingredient: 'Fromage' }],
    }
    const result = getOrderedSections(bySection)
    expect(result[0]).toBe('Fruits et légumes')
    expect(result[1]).toBe('Produits laitiers')
    expect(result[2]).toBe('Varia')
  })

  it('skips sections not present in bySection', () => {
    const bySection = {
      'Viandes': [{ ingredient: 'Poulet' }],
    }
    const result = getOrderedSections(bySection)
    expect(result).toEqual(['Viandes'])
  })

  it('skips sections with empty arrays', () => {
    const bySection = {
      'Fruits et légumes': [],
      'Viandes': [{ ingredient: 'Poulet' }],
    }
    const result = getOrderedSections(bySection)
    expect(result).not.toContain('Fruits et légumes')
    expect(result).toContain('Viandes')
  })

  it('appends extra sections not in SECTION_ORDER after known sections', () => {
    const bySection = {
      'Varia': [{ ingredient: 'Sel' }],
      'Épices': [{ ingredient: 'Cumin' }],
    }
    const result = getOrderedSections(bySection)
    expect(result[0]).toBe('Varia')
    expect(result[1]).toBe('Épices')
  })

  it('returns empty array for empty bySection', () => {
    expect(getOrderedSections({})).toEqual([])
  })

  it('all SECTION_ORDER sections come before extras', () => {
    const bySection = {
      'Épices': [{ ingredient: 'Cumin' }],
      'Varia - Congelés': [{ ingredient: 'Légumes surgelés' }],
      'Fruits et légumes': [{ ingredient: 'Tomate' }],
    }
    const result = getOrderedSections(bySection)
    const idxFruits = result.indexOf('Fruits et légumes')
    const idxVarConge = result.indexOf('Varia - Congelés')
    const idxEpices = result.indexOf('Épices')
    expect(idxFruits).toBeLessThan(idxEpices)
    expect(idxVarConge).toBeLessThan(idxEpices)
  })
})
