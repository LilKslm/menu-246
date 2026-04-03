import { memo } from 'react'
import { parseLocalDate } from '../utils/calculations'

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
const MEAL_BORDER = {
  breakfast: 'border-orange-200',
  lunch: 'border-green-200',
  dinner: 'border-blue-200',
  snack: 'border-purple-200',
}

function getDayLabel(startDate, dayIndex) {
  const date = parseLocalDate(startDate)
  date.setDate(date.getDate() + dayIndex)
  return {
    weekday: date.toLocaleDateString('fr-CA', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('fr-CA', { month: 'short' }),
    full: date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

// ── Desktop cell (unchanged from before) ────────────────────
const DesktopCell = memo(function DesktopCell({
  dayIndex, mealType, recipes, pendingRecipe, onCellClick, onRemove, onViewRecipe,
}) {
  const canDrop = pendingRecipe?.mealType === mealType
  const hasRecipes = recipes && recipes.length > 0

  return (
    <div
      onClick={() => canDrop && onCellClick(dayIndex, mealType)}
      className={`
        relative min-h-[64px] rounded-xl border transition-all duration-100 p-2
        ${hasRecipes ? `${MEAL_FILLED_BG[mealType]} border-transparent` : canDrop ? 'cal-cell-empty can-drop' : 'cal-cell-empty'}
        ${canDrop ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {hasRecipes ? (
        <div className="flex flex-col gap-1">
          {recipes.map(recipe => (
            <div key={recipe.id} className={`group/chip flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${MEAL_CHIP_BG[mealType]} transition-colors`}>
              <button onClick={e => { e.stopPropagation(); onViewRecipe(recipe) }}
                className={`text-[11px] font-medium flex-1 text-left truncate leading-snug ${MEAL_TEXT[mealType]}`}>
                {recipe.name}{(recipe.isCustom || recipe.isShared) && recipe.createdBy && <span className="opacity-50 ml-1">· {recipe.createdBy}</span>}
              </button>
              <button onClick={e => { e.stopPropagation(); onRemove(dayIndex, mealType, recipe.id) }}
                className="opacity-0 group-hover/chip:opacity-100 w-3.5 h-3.5 rounded-full bg-white/70 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center text-[9px] flex-shrink-0 transition-all">✕</button>
            </div>
          ))}
          {canDrop && (
            <div className={`flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-lg border-2 border-dashed ${MEAL_TEXT[mealType]} border-current opacity-60`}>
              <span className="text-[10px] font-semibold">+ Ajouter</span>
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
            <span className="text-[10px] text-apple-gray-3 text-center leading-snug px-1">Sélectionner</span>
          )}
        </div>
      )}
    </div>
  )
})

// ── Mobile meal slot row ─────────────────────────────────────
const MobileMealSlot = memo(function MobileMealSlot({
  dayIndex, mealType, recipes, onSlotTap, onRemove, onViewRecipe,
}) {
  const hasRecipes = recipes && recipes.length > 0
  const color = { breakfast: '#F97316', lunch: '#22C55E', dinner: '#3B82F6', snack: '#A855F7' }[mealType]

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F2F2F7' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: hasRecipes ? 10 : 0 }}>
        <span style={{ fontSize: 16, marginRight: 8, lineHeight: 1 }}>{MEAL_ICONS[mealType]}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
          {MEAL_LABELS[mealType]}
        </span>
        <button
          onClick={() => onSlotTap(dayIndex, mealType)}
          style={{
            width: 28, height: 28, borderRadius: 14,
            background: color + '18',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color, lineHeight: 1, flexShrink: 0,
          }}
        >+</button>
      </div>

      {hasRecipes && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {recipes.map(recipe => (
            <div key={recipe.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px 6px 12px', borderRadius: 20,
              background: color + '12', border: `1px solid ${color}30`,
            }}>
              <button
                onClick={e => { e.stopPropagation(); onViewRecipe(recipe) }}
                style={{ fontSize: 13, fontWeight: 600, color, border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >{recipe.name}</button>
              <button
                onClick={e => { e.stopPropagation(); onRemove(dayIndex, mealType, recipe.id) }}
                style={{
                  width: 18, height: 18, borderRadius: 9,
                  background: 'rgba(255,255,255,0.8)', border: 'none',
                  color: '#FF3B30', fontSize: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {!hasRecipes && (
        <button
          onClick={() => onSlotTap(dayIndex, mealType)}
          style={{
            fontSize: 13, color: '#C7C7CC', fontStyle: 'italic',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 0', textAlign: 'left',
          }}
        >Toucher pour ajouter…</button>
      )}
    </div>
  )
})

export default function MealCalendar({
  campSetup,
  mealPlan,
  pendingRecipe,
  onCellClick,
  onSlotTap,
  onRemoveRecipe,
  onViewRecipe,
}) {
  const { numDays, startDate } = campSetup
  if (!numDays || numDays === 0) return null

  const days = Array.from({ length: numDays }, (_, i) => i)

  return (
    <>
      {/* ── MOBILE view: vertical day cards ── */}
      <div className="md:hidden" style={{ padding: '16px 12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {days.map(dayIdx => {
          const lbl = getDayLabel(startDate, dayIdx)
          return (
            <div key={dayIdx} style={{
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}>
              {/* Day header */}
              <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #F2F2F7' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: '#007AFF',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>{lbl.weekday}</span>
                  <span style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{lbl.day}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#1C1C1E', margin: 0, textTransform: 'capitalize' }}>{lbl.month}</p>
                  <p style={{ fontSize: 12, color: '#8E8E93', margin: '2px 0 0' }}>Jour {dayIdx + 1}</p>
                </div>
              </div>

              {/* Meal slots */}
              <div>
                {MEAL_TYPES.map(mealType => (
                  <MobileMealSlot
                    key={mealType}
                    dayIndex={dayIdx}
                    mealType={mealType}
                    recipes={mealPlan[dayIdx]?.[mealType] ?? []}
                    onSlotTap={onSlotTap || ((di, mt) => onCellClick && onCellClick(di, mt))}
                    onRemove={onRemoveRecipe}
                    onViewRecipe={onViewRecipe}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      </div>

      {/* ── DESKTOP view: horizontal grid ── */}
      <div className="hidden md:block p-3">
        <div className="inline-block min-w-full" style={{ minWidth: `${60 + numDays * 128}px` }}>
          {/* Day header row */}
          <div className="grid mb-1.5" style={{ gridTemplateColumns: `60px repeat(${numDays}, minmax(120px, 1fr))` }}>
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

          {/* Meal rows */}
          {MEAL_TYPES.map(mealType => (
            <div key={mealType} className="grid mb-1.5" style={{ gridTemplateColumns: `60px repeat(${numDays}, minmax(120px, 1fr))` }}>
              <div className="flex items-center justify-center pr-1.5">
                <div className={`w-full rounded-xl px-1 py-2.5 flex flex-col items-center gap-0.5 ${MEAL_ROW_HEADER[mealType]}`}>
                  <span className="text-sm leading-none">{MEAL_ICONS[mealType]}</span>
                  <span className="text-[9px] font-bold text-center leading-none">{MEAL_LABELS[mealType]}</span>
                </div>
              </div>
              {days.map(dayIdx => (
                <div key={dayIdx} className="px-0.5">
                  <DesktopCell
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
    </>
  )
}
