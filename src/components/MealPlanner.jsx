import { useState, useEffect } from 'react'
import { getDayLabel } from '../utils/calculations'
import { MEAL_LIST } from '../shared/meals'
import { I } from '../shared/icons.jsx'
import RecipePickerSheet from './RecipePickerSheet'
import AddRecipeModal from './AddRecipeModal'
import DesktopPlanner from './DesktopPlanner'
import Signature from './Signature'

export default function MealPlanner({
  recipes,
  campSetup,
  mealPlan,
  selectedRecipe,
  onSelectRecipe,
  onPlaceRecipe,
  onRemoveRecipe,
  onAddRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onDeleteLocal,
  onNext,
  onBack,
}) {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768)
  const [activeDay, setActiveDay] = useState(0)
  const [pickerSlot, setPickerSlot] = useState(null)
  const [addModalMealType, setAddModalMealType] = useState(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = e => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setAddModalMealType(null); setPickerSlot(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── DESKTOP: delegate entirely to DesktopPlanner ──────────
  if (isDesktop) {
    return (
      <DesktopPlanner
        recipes={recipes}
        campSetup={campSetup}
        mealPlan={mealPlan}
        onPlaceRecipe={onPlaceRecipe}
        onRemoveRecipe={onRemoveRecipe}
        onAddRecipe={onAddRecipe}
        onDeleteLocal={onDeleteLocal}
        onBack={onBack}
        onNext={onNext}
      />
    )
  }

  // ── MOBILE layout ──────────────────────────────────────────
  const { numDays, startDate } = campSetup
  const days = Array.from({ length: numDays }, (_, i) => i)

  function handleSlotTap(dayIndex, mealType) {
    setPickerSlot({ dayIndex, mealType, dayLabel: getDayLabel(startDate, dayIndex).full })
  }

  function handlePickerAdd(recipesToAdd) {
    if (!pickerSlot) return
    const { dayIndex, mealType } = pickerSlot
    for (const recipe of recipesToAdd) onPlaceRecipe(dayIndex, mealType, recipe)
    setPickerSlot(null)
  }

  const filledCount = Object.values(mealPlan).reduce(
    (total, day) => total + Object.values(day).filter(arr => Array.isArray(arr) ? arr.length > 0 : Boolean(arr)).length, 0)
  const totalSlots = numDays * 4

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Chips row */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 8px', alignItems: 'center' }}>
        <div className="chip chip-strong" style={{ height: 28 }}>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{numDays}</span><span className="tx-3">j</span>
        </div>
        <div className="chip chip-strong" style={{ height: 28 }}>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{campSetup.numPeople}</span><span className="tx-3">pers.</span>
        </div>
        <span className="t-caption tx-3" style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{filledCount}/{totalSlots}</span>
      </div>

      {/* Day tabs */}
      <div className="scroll" style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', flexShrink: 0 }}>
        {days.map(i => {
          const lbl = getDayLabel(startDate, i)
          const active = i === activeDay
          return (
            <button key={i} onClick={() => setActiveDay(i)} style={{
              flex: '0 0 auto', border: 'none', borderRadius: 'var(--r-md)',
              background: active ? 'var(--text)' : 'var(--surface)',
              color: active ? 'var(--text-inverse)' : 'var(--text)',
              boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--hairline)',
              padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              cursor: 'pointer', fontFamily: 'inherit', minWidth: 56,
            }}>
              <span style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{lbl.weekday}</span>
              <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{lbl.day}</span>
            </button>
          )
        })}
      </div>

      {/* Meal sections for selected day */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {MEAL_LIST.map(meal => {
          const list = mealPlan[activeDay]?.[meal.key] ?? []
          return (
            <div key={meal.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 26, height: 26, borderRadius: 'var(--r-sm)', background: meal.soft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, lineHeight: 1 }}>{meal.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{meal.label}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map(recipe => (
                  <div key={recipe.id} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: meal.soft, display: 'flex', alignItems: 'center', gap: 10, color: meal.ink, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meal.color }} />
                    <div style={{ flex: 1, paddingLeft: 6, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{recipe.name}</div>
                      {(recipe.isCustom || recipe.isShared) && recipe.createdBy && (
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>{recipe.createdBy}</div>
                      )}
                    </div>
                    <button onClick={() => onRemoveRecipe(activeDay, meal.key, recipe.id)} className="btn-icon" style={{ width: 28, height: 28, color: 'inherit' }} title="Retirer">
                      <I.X size={15} />
                    </button>
                  </div>
                ))}

                <button onClick={() => handleSlotTap(activeDay, meal.key)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: 14, borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
                  background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--hairline)',
                  color: 'var(--text-tertiary)', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                }}>
                  <I.Plus size={16} sw={2} /> Ajouter une recette
                </button>
              </div>
            </div>
          )
        })}

        {/* Footer navigation */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ flex: 1 }}><I.ChevL size={16} /> Retour</button>
          <button onClick={onNext} className="btn btn-primary" style={{ flex: 2 }}>Exporter <I.ChevR size={16} /></button>
        </div>

        <Signature />
      </div>

      {/* Bottom sheet */}
      {pickerSlot && (
        <RecipePickerSheet
          recipes={recipes}
          dayLabel={pickerSlot.dayLabel}
          mealType={pickerSlot.mealType}
          existingRecipes={mealPlan[pickerSlot.dayIndex]?.[pickerSlot.mealType] ?? []}
          onAdd={handlePickerAdd}
          onClose={() => setPickerSlot(null)}
          onCreateRecipe={(mealType) => setAddModalMealType(mealType)}
        />
      )}

      {/* Create recipe modal */}
      {addModalMealType && (
        <AddRecipeModal
          defaultMealType={addModalMealType}
          onSave={recipe => { onAddRecipe(recipe); setAddModalMealType(null) }}
          onClose={() => setAddModalMealType(null)}
        />
      )}
    </div>
  )
}
