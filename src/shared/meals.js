// Single source of truth for meal metadata, keyed by the app's meal keys.
// Replaces the MEAL_LABELS / MEAL_ICONS / MEAL_COLORS / MEAL_TYPES maps that
// were duplicated across App.jsx, DesktopPlanner, OutputGenerator, MealCalendar.

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export const MEALS = {
  breakfast: { key: 'breakfast', label: 'Déjeuner',  emoji: '🍳', color: 'var(--meal-dejeuner)',  soft: 'var(--meal-dejeuner-soft)',  ink: 'var(--meal-dejeuner-ink)' },
  lunch:     { key: 'lunch',     label: 'Dîner',     emoji: '🥪', color: 'var(--meal-diner)',     soft: 'var(--meal-diner-soft)',     ink: 'var(--meal-diner-ink)' },
  dinner:    { key: 'dinner',    label: 'Souper',    emoji: '🍽️', color: 'var(--meal-souper)',    soft: 'var(--meal-souper-soft)',    ink: 'var(--meal-souper-ink)' },
  snack:     { key: 'snack',     label: 'Collation', emoji: '🍎', color: 'var(--meal-collation)', soft: 'var(--meal-collation-soft)', ink: 'var(--meal-collation-ink)' },
}

// Ordered list for iterating meals in display order.
export const MEAL_LIST = MEAL_TYPES.map((k) => MEALS[k])

// { breakfast: 'Déjeuner', ... } — derived label map for non-styled contexts (CSV, PDF, lists).
export const MEAL_LABELS = Object.fromEntries(MEAL_TYPES.map((k) => [k, MEALS[k].label]))
