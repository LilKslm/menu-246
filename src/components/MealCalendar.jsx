import { memo } from 'react'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}
const MEAL_FILLED_BG = {
  breakfast: 'bg-orange-50',
  lunch: 'bg-green-50',
  dinner: 'bg-blue-50',
  snack: 'bg-purple-50',
}
const MEAL_TEXT = {
  breakfast: 'text-orange-700',
  lunch: 'text-green-700',
  dinner: 'text-blue-700',
  snack: 'text-purple-700',
}
const MEAL_CHIP_BG = {
  breakfast: 'bg-orange-100 hover:bg-orange-200',
  lunch: 'bg-green-100 hover:bg-green-200',
  dinner: 'bg-blue-100 hover:bg-blue-200',
  snack: 'bg-purple-100 hover:bg-purple-200',
}
const MEAL_ROW_HEADER = {
  breakfast: 'bg-orange-100 text-orange-800',
  lunch: 'bg-green-100 text-green-800',
  dinner: 'bg-blue-100 text-blue-800',
  snack: 'bg-purple-100 text-purple-800',
}

function getDayLabel(startDate, dayIndex) {
  const date = new Date(startDate)
  date.setDate(date.getDate() + dayIndex)
  return {
    weekday: date.toLocaleDateString('fr-CA', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('fr-CA', { month: 'short' }),
    full: date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

// ── Individual calendar cell ─────────────────────
const CalendarCell = memo(function CalendarCell({
  dayIndex,
  mealType,
  recipes,
  pendingRecipe,
  onCellClick,
  onRemove,
  onViewRecipe,
}) {
  const canDrop = pendingRecipe?.mealType === mealType
  const hasRecipes = recipes && recipes.length > 0

  function handleCellClick() {
    if (canDrop) {
      onCellClick(dayIndex, mealType)
    }
  }

  return (
    <div
      onClick={handleCellClick}
      className={`
        relative min-h-[64px] rounded-xl border transition-all duration-100 p-2
        ${hasRecipes
          ? `${MEAL_FILLED_BG[mealType]} border-transparent`
          : canDrop
          ? 'cal-cell-empty can-drop'
          : 'cal-cell-empty'
        }
        ${canDrop ? 'cursor-pointer' : 'cursor-default'}
      `}
      title={canDrop ? `Placer "${pendingRecipe?.name}" ici` : undefined}
    >
      {hasRecipes ? (
        <div className="flex flex-col gap-1">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className={`group/chip flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${MEAL_CHIP_BG[mealType]} transition-colors`}
            >
              <button
                onClick={e => { e.stopPropagation(); onViewRecipe(recipe) }}
                className={`text-[11px] font-medium flex-1 text-left truncate leading-snug ${MEAL_TEXT[mealType]}`}
              >
                {recipe.name}
                {recipe.isCustom && <span className="opacity-50 ml-1">·P</span>}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemove(dayIndex, mealType, recipe.id) }}
                className="opacity-0 group-hover/chip:opacity-100 w-3.5 h-3.5 rounded-full bg-white/70 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center text-[9px] flex-shrink-0 transition-all"
                title={`Retirer ${recipe.name}`}
              >
                ✕
              </button>
            </div>
          ))}
          {/* Drop target when a compatible pending recipe exists */}
          {canDrop && (
            <div className={`flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-lg border-2 border-dashed ${MEAL_TEXT[mealType]} border-current opacity-60`}>
              <span className="text-[10px] font-semibold">+ Ajouter ici</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full pointer-events-none gap-1 min-h-[48px]">
          {canDrop ? (
            <>
              <span className={`text-base ${MEAL_TEXT[mealType]}`}>+</span>
              <span className={`text-[10px] font-semibold ${MEAL_TEXT[mealType]}`}>Placer ici</span>
            </>
          ) : (
            <span className="text-[10px] text-apple-gray-3 text-center leading-snug px-1">
              Sélectionner une recette
            </span>
          )}
        </div>
      )}
    </div>
  )
})

export default function MealCalendar({
  campSetup,
  mealPlan,
  pendingRecipe,
  onCellClick,
  onRemoveRecipe,
  onViewRecipe,
}) {
  const { numDays, startDate } = campSetup
  if (!numDays || numDays === 0) return null

  const days = Array.from({ length: numDays }, (_, i) => i)
  const colWidth = 'minmax(120px, 1fr)'

  return (
    <div className="p-3">
      <div
        className="inline-block min-w-full"
        style={{ minWidth: `${60 + numDays * 128}px` }}
      >
        {/* ── Day header row ──────────────────── */}
        <div
          className="grid mb-1.5"
          style={{ gridTemplateColumns: `60px repeat(${numDays}, ${colWidth})` }}
        >
          <div />
          {days.map(i => {
            const lbl = getDayLabel(startDate, i)
            return (
              <div key={i} className="px-1 text-center" title={lbl.full}>
                <div className="text-[10px] text-apple-secondary capitalize">{lbl.weekday}</div>
                <div className="text-base font-bold text-apple-dark leading-tight">{lbl.day}</div>
                <div className="text-[10px] text-apple-secondary capitalize">{lbl.month}</div>
              </div>
            )
          })}
        </div>

        {/* ── Meal rows ───────────────────────── */}
        {MEAL_TYPES.map(mealType => (
          <div
            key={mealType}
            className="grid mb-1.5"
            style={{ gridTemplateColumns: `60px repeat(${numDays}, ${colWidth})` }}
          >
            {/* Row label */}
            <div className="flex items-center justify-center pr-1.5">
              <div className={`w-full rounded-xl px-1 py-2.5 flex flex-col items-center gap-0.5 ${MEAL_ROW_HEADER[mealType]}`}>
                <span className="text-sm leading-none">{MEAL_ICONS[mealType]}</span>
                <span className="text-[9px] font-bold text-center leading-none">
                  {MEAL_LABELS[mealType]}
                </span>
              </div>
            </div>

            {/* Cells */}
            {days.map(dayIdx => (
              <div key={dayIdx} className="px-0.5">
                <CalendarCell
                  dayIndex={dayIdx}
                  mealType={mealType}
                  recipes={mealPlan[dayIdx]?.[mealType] ?? []}
                  pendingRecipe={pendingRecipe}
                  onCellClick={onCellClick}
                  onRemove={onRemoveRecipe}
                  onViewRecipe={onViewRecipe}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
