import { useState, useRef, useMemo, memo, useCallback, Fragment } from 'react'
import RecipeQuickAddModal from './RecipeQuickAddModal'
import AddRecipeModal from './AddRecipeModal'
import { parseLocalDate, getDayLabel } from '../utils/calculations'
import { MEALS, MEAL_TYPES, MEAL_LIST } from '../shared/meals'
import { I } from '../shared/icons.jsx'
import Signature from './Signature'

// ── Ingredient tooltip (fixed-position to escape overflow clipping) ──
function IngredientTooltip({ recipe, anchorRect, meal }) {
  const W = 280
  const OFFSET = 8
  const placeAbove = anchorRect.top > 240
  const top = placeAbove ? undefined : anchorRect.bottom + OFFSET
  const bottom = placeAbove ? window.innerHeight - anchorRect.top + OFFSET : undefined
  let left = anchorRect.left
  if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8

  return (
    <div style={{
      position: 'fixed', top, bottom, left, width: W, zIndex: 9999,
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-3)', border: '1px solid var(--hairline)',
      padding: '12px 14px', animation: 'fadeIn 0.15s ease', pointerEvents: 'none',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--text)' }}>{recipe.name}</p>
      {recipe.ingredients?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
          {recipe.ingredients.map((ingr, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <span style={{ color: meal.color, flexShrink: 0 }}>•</span>
              <span>{ingr.portion > 0 ? `${ingr.portion}${ingr.unit ? ' ' + ingr.unit : ''} ` : ''}{ingr.ingredient}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Aucun ingrédient</p>
      )}
    </div>
  )
}

// ── Recipe pill placed in a grid cell ───────────────────────────
const RecipePill = memo(function RecipePill({ recipe, meal, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const pillRef = useRef(null)

  const enter = useCallback(() => { setHovered(true); if (pillRef.current) setAnchorRect(pillRef.current.getBoundingClientRect()) }, [])
  const leave = useCallback(() => { setHovered(false); setAnchorRect(null) }, [])

  return (
    <div ref={pillRef} onClick={e => e.stopPropagation()} onMouseEnter={enter} onMouseLeave={leave}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px 5px 10px',
        borderRadius: 'var(--r-sm)', background: meal.soft, color: meal.ink,
        position: 'relative', overflow: 'hidden', minWidth: 0,
      }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meal.color }} />
      <span style={{ flex: 1, fontSize: 'var(--fs-caption)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4, paddingLeft: 2 }}>
        {recipe.name}
      </span>
      <button onClick={e => { e.stopPropagation(); onRemove() }}
        style={{ width: 16, height: 16, borderRadius: 8, border: 'none', background: hovered ? 'var(--surface)' : 'transparent', color: hovered ? 'var(--error)' : 'currentColor', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0.5, transition: 'all 0.12s', padding: 0 }}>
        <I.X size={10} sw={2.4} />
      </button>
      {anchorRect && <IngredientTooltip recipe={recipe} anchorRect={anchorRect} meal={meal} />}
    </div>
  )
})

// ── Grid cell ───────────────────────────────────────────────────
const GridCell = memo(function GridCell({ dayIndex, mealType, recipes, pendingRecipe, onCellClick, onRemove, onOpenModal }) {
  const meal = MEALS[mealType]
  const canDrop = !!pendingRecipe
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => canDrop && onCellClick(dayIndex, mealType)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minHeight: 104, padding: 6, borderRadius: 'var(--r-md)',
        background: canDrop ? meal.soft : 'var(--surface)',
        boxShadow: canDrop ? `inset 0 0 0 1.5px ${meal.color}` : 'inset 0 0 0 1px var(--hairline)',
        cursor: canDrop ? 'pointer' : 'default', transition: 'background 0.12s, box-shadow 0.12s',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      {recipes.map(recipe => (
        <RecipePill key={recipe.id} recipe={recipe} meal={meal} onRemove={() => onRemove(dayIndex, mealType, recipe.id)} />
      ))}

      {canDrop ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 8px', borderRadius: 'var(--r-sm)', color: meal.ink, fontSize: 'var(--fs-caption)', fontWeight: 600, marginTop: recipes.length > 0 ? 2 : 0 }}>
          <I.Plus size={13} sw={2.4} /> Placer ici
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onOpenModal(dayIndex, mealType) }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: 'none', background: 'transparent', cursor: 'pointer', color: hovered ? meal.ink : 'var(--text-placeholder)', fontSize: 'var(--fs-caption)', fontWeight: 600, opacity: hovered || recipes.length === 0 ? 1 : 0, transition: 'opacity 0.15s, color 0.15s', width: '100%', marginTop: recipes.length > 0 ? 2 : 0, fontFamily: 'inherit' }}
        >
          <I.Plus size={13} sw={2} />
          {recipes.length === 0 ? 'Ajouter' : 'Ajouter un repas'}
        </button>
      )}
    </div>
  )
})

// ── Sidebar recipe card ─────────────────────────────────────────
const SidebarCard = memo(function SidebarCard({ recipe, meal, isPending, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const ref = useRef(null)
  const enter = useCallback(() => { setHovered(true); if (ref.current) setAnchorRect(ref.current.getBoundingClientRect()) }, [])
  const leave = useCallback(() => { setHovered(false); setAnchorRect(null) }, [])

  return (
    <div ref={ref} className={`recipe-card${isPending ? ' is-selected' : ''}`} onClick={onClick} onMouseEnter={enter} onMouseLeave={leave} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="dot" style={{ background: meal.color, width: 6, height: 6 }} />
        <span style={{ fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.name}</span>
        {onDelete && hovered && (
          <button onClick={e => { e.stopPropagation(); if (!confirm(`Masquer "${recipe.name}" de votre bibliothèque?`)) return; onDelete(recipe) }}
            title="Masquer de ma bibliothèque"
            style={{ width: 22, height: 22, borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--surface-2)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <I.Trash size={13} />
          </button>
        )}
        {!hovered && <I.Drag size={14} stroke="var(--text-tertiary)" sw={1.4} />}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
        {(recipe.isCustom || recipe.isShared) && <span>{recipe.createdBy || 'Perso'}</span>}
        <span>{recipe.ingredients?.length || 0} ingr.</span>
      </div>
      {anchorRect && <IngredientTooltip recipe={recipe} anchorRect={anchorRect} meal={meal} />}
    </div>
  )
})

// ── Recipe sidebar ──────────────────────────────────────────────
function RecipeSidebar({ recipes, pendingRecipe, onCardClick, onDeleteLocal, onAddRecipe }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const [addMealType, setAddMealType] = useState(null)

  const term = search.toLowerCase().trim()
  const searchActive = term.length > 0

  const filtered = useMemo(() => {
    const result = {}
    for (const mt of MEAL_TYPES) {
      const list = recipes[mt] || []
      result[mt] = !term ? list : list.filter(r =>
        r.name.toLowerCase().includes(term) || r.ingredients?.some(i => i.ingredient?.toLowerCase().includes(term)))
    }
    return result
  }, [recipes, term])

  return (
    <div style={{ width: 320, flexShrink: 0, height: '100%', background: 'var(--surface-3)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)' }}>
        <h3 className="t-title-3" style={{ margin: '0 0 var(--space-3)' }}>Recettes</h3>
        <div style={{ position: 'relative' }}>
          <I.Search size={16} stroke="var(--text-tertiary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" placeholder="Rechercher" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, height: 38, fontSize: 'var(--fs-sub)' }} />
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-3) var(--space-5)' }}>
        {MEAL_LIST.map(meal => {
          const list = filtered[meal.key] || []
          const open = searchActive || expanded[meal.key]
          const total = (recipes[meal.key] || []).length
          return (
            <div key={meal.key} style={{ marginBottom: 'var(--space-2)' }}>
              <div className={`section-head${open ? '' : ' is-closed'}`} onClick={() => setExpanded(p => ({ ...p, [meal.key]: !p[meal.key] }))}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 'var(--r-sm)', background: meal.soft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, lineHeight: 1 }}>{meal.emoji}</span>
                  <span style={{ fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)', color: 'var(--text)' }}>{meal.label}</span>
                  <span className="t-caption tx-3">{searchActive ? `${list.length}/` : ''}{total}</span>
                </div>
                <I.ChevD className="chev" size={14} sw={2} stroke="currentColor" />
              </div>
              {open && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6, padding: '0 4px' }}>
                  {list.length === 0 && <div className="t-caption tx-3" style={{ textAlign: 'center', padding: '8px 0' }}>{searchActive ? 'Aucun résultat' : 'Aucune recette'}</div>}
                  {list.map(r => (
                    <SidebarCard key={r.id} recipe={r} meal={meal} isPending={pendingRecipe?.id === r.id} onClick={() => onCardClick(r)} onDelete={onDeleteLocal} />
                  ))}
                  {onAddRecipe && (
                    <button onClick={() => setAddMealType(meal.key)} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 6, padding: '6px 8px', borderRadius: 'var(--r-sm)', color: 'var(--primary)', fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-medium)', display: 'flex', alignItems: 'center' }}>
                      <I.Plus size={14} sw={2} /> Ajouter une recette
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {addMealType && (
        <AddRecipeModal defaultMealType={addMealType} onSave={recipe => { onAddRecipe(recipe); setAddMealType(null) }} onClose={() => setAddMealType(null)} />
      )}
    </div>
  )
}

// ── Main DesktopPlanner ──────────────────────────────────────────
export default function DesktopPlanner({ recipes, campSetup, mealPlan, onPlaceRecipe, onRemoveRecipe, onAddRecipe, onDeleteLocal, onBack, onNext }) {
  const [addModalSlot, setAddModalSlot] = useState(null)
  const [pendingRecipe, setPendingRecipe] = useState(null)
  const { numDays, startDate, numPeople } = campSetup
  const days = Array.from({ length: numDays }, (_, i) => i)

  const filledCount = Object.values(mealPlan).reduce(
    (t, day) => t + Object.values(day).filter(arr => Array.isArray(arr) ? arr.length > 0 : Boolean(arr)).length, 0)
  const totalSlots = numDays * 4

  // useCallback keeps these stable so memo()'d GridCells don't re-render on unrelated state changes
  const handleCellClick = useCallback((dayIndex, mealType) => {
    setPendingRecipe(pending => {
      if (pending) onPlaceRecipe(dayIndex, mealType, pending)
      return null
    })
  }, [onPlaceRecipe])
  const handleCardClick = useCallback((recipe) => {
    setPendingRecipe(p => (p?.id === recipe.id ? null : recipe))
  }, [])
  const handleOpenModal = useCallback((dayIndex, mealType) => {
    setAddModalSlot({ dayIndex, mealType })
  }, [])
  function handleModalAdd(recipe) {
    if (addModalSlot) onPlaceRecipe(addModalSlot.dayIndex, addModalSlot.mealType, recipe)
  }

  function dateRange() {
    if (!campSetup.startDate || !campSetup.endDate) return ''
    const opts = { day: 'numeric', month: 'short' }
    return `${parseLocalDate(campSetup.startDate).toLocaleDateString('fr-CA', opts)} – ${parseLocalDate(campSetup.endDate).toLocaleDateString('fr-CA', opts)}`
  }

  return (
    <div className="app" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--bg)' }}>
      <RecipeSidebar recipes={recipes} pendingRecipe={pendingRecipe} onCardClick={handleCardClick} onDeleteLocal={onDeleteLocal} onAddRecipe={onAddRecipe} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Grid header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: 'var(--space-6) var(--space-7) var(--space-4)', flexShrink: 0 }}>
          <div>
            <h2 className="t-title-1" style={{ margin: 0 }}>Planification</h2>
            <p className="t-sub tx-2" style={{ margin: '4px 0 0' }}>{[dateRange(), `${numPeople} personne${numPeople !== 1 ? 's' : ''}`].filter(Boolean).join(' · ')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 64, height: 5, borderRadius: 'var(--r-pill)', background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{ width: `${totalSlots > 0 ? (filledCount / totalSlots) * 100 : 0}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
              </div>
              <span className="t-caption tx-3" style={{ fontVariantNumeric: 'tabular-nums' }}>{filledCount}/{totalSlots}</span>
            </div>
            <button onClick={onBack} className="btn btn-secondary"><I.ChevL size={16} /> Retour</button>
            <button onClick={onNext} className="btn btn-primary">Exporter <I.ChevR size={16} /></button>
          </div>
        </div>

        {/* Pending banner */}
        {pendingRecipe && (
          <div style={{ flexShrink: 0, margin: '0 var(--space-7) var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--primary-soft)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--fs-sub)', fontWeight: 700, color: 'var(--primary)' }}>{pendingRecipe.name}</span>
            <span className="t-sub" style={{ color: 'var(--primary)', flex: 1 }}>Cliquez sur une case pour le placer</span>
            <button onClick={() => setPendingRecipe(null)} className="btn btn-secondary btn-sm">Annuler</button>
          </div>
        )}

        {/* Grid */}
        <div className="scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 var(--space-7) var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${numDays}, minmax(140px, 1fr))`, gap: 'var(--space-2)', minWidth: `${120 + numDays * 140}px` }}>
            {/* corner */}
            <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 4, background: 'var(--bg)' }} />
            {/* day headers */}
            {days.map(i => {
              const lbl = getDayLabel(startDate, i)
              return (
                <div key={i} style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', gap: 2 }} title={lbl.full}>
                  <span className="t-micro tx-3">{lbl.weekday}</span>
                  <span style={{ fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)', color: 'var(--text)' }}>{lbl.day} {lbl.month}</span>
                </div>
              )
            })}

            {/* meal rows */}
            {MEAL_LIST.map(meal => (
              <Fragment key={meal.key}>
                <div style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0 var(--space-2)' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: meal.soft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, lineHeight: 1 }}>{meal.emoji}</span>
                  <span style={{ fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)', color: 'var(--text)' }}>{meal.label}</span>
                </div>
                {days.map(dayIdx => (
                  <GridCell key={`${meal.key}-${dayIdx}`} dayIndex={dayIdx} mealType={meal.key} recipes={mealPlan[dayIdx]?.[meal.key] ?? []} pendingRecipe={pendingRecipe} onCellClick={handleCellClick} onRemove={onRemoveRecipe} onOpenModal={handleOpenModal} />
                ))}
              </Fragment>
            ))}
          </div>
          <Signature />
        </div>
      </div>

      {addModalSlot && (
        <RecipeQuickAddModal
          recipes={recipes}
          slot={{ ...addModalSlot, dayLabel: getDayLabel(startDate, addModalSlot.dayIndex).full }}
          existingRecipes={mealPlan[addModalSlot.dayIndex]?.[addModalSlot.mealType] ?? []}
          onAdd={handleModalAdd}
          onClose={() => setAddModalSlot(null)}
          onDeleteLocal={onDeleteLocal}
        />
      )}
    </div>
  )
}
