import { useState, useMemo, useEffect, useRef } from 'react'
import { MEALS, MEAL_TYPES, MEAL_LIST } from '../shared/meals'
import { I } from '../shared/icons.jsx'

export default function RecipePickerSheet({
  recipes,
  dayLabel,
  mealType,
  existingRecipes = [],
  onAdd,
  onClose,
  onCreateRecipe,
}) {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(mealType)
  const [selected, setSelected] = useState([])
  const [expanded, setExpanded] = useState(null)
  const searchRef = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function dismiss() {
    setVisible(false)
    closeTimer.current = setTimeout(onClose, 300)
  }

  const allFlat = useMemo(() => {
    const types = filter === 'all' ? MEAL_TYPES : [filter]
    const list = types.flatMap(mt => recipes[mt] || [])
    if (!search.trim()) return list
    const term = search.toLowerCase()
    return list.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.ingredients?.some(i => i.ingredient?.toLowerCase().includes(term))
    )
  }, [recipes, filter, search])

  const allRecipesFlat = useMemo(() => MEAL_TYPES.flatMap(mt => recipes[mt] || []), [recipes])

  function toggleSelect(recipe) {
    if (existingRecipes.some(r => r.id === recipe.id)) return
    setSelected(prev => prev.includes(recipe.id) ? prev.filter(id => id !== recipe.id) : [...prev, recipe.id])
  }

  function handleAdd() {
    const toAdd = selected.map(id => allRecipesFlat.find(r => r.id === id)).filter(Boolean)
    onAdd(toAdd)
    dismiss()
  }

  // Touch drag-to-dismiss
  const dragStart = useRef(null)
  function onTouchStart(e) { dragStart.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (!dragStart.current) return
    const delta = e.changedTouches[0].clientY - dragStart.current
    if (delta > 80) dismiss()
    dragStart.current = null
  }

  const headerMeal = MEALS[mealType]

  return (
    <div className="app" style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'auto' }}>
      {/* Backdrop */}
      <div onClick={dismiss} style={{ position: 'absolute', inset: 0, background: 'rgba(30, 22, 14, 0.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }} />

      {/* Sheet */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', background: 'var(--surface)',
          borderTopLeftRadius: 'var(--r-2xl)', borderTopRightRadius: 'var(--r-2xl)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -20px 40px rgba(30, 20, 10, 0.18)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: headerMeal.soft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, lineHeight: 1 }}>
            {headerMeal.emoji}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{headerMeal.label}</div>
            <div className="t-caption tx-3" style={{ textTransform: 'capitalize' }}>{dayLabel}</div>
          </div>
          <button onClick={dismiss} className="btn-icon" style={{ width: 32, height: 32 }}><I.X size={16} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 12px', position: 'relative', flexShrink: 0 }}>
          <I.Search size={16} stroke="var(--text-tertiary)" style={{ position: 'absolute', left: 28, top: 12 }} />
          <input ref={searchRef} className="input" type="search" placeholder="Recette ou ingrédient..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, height: 40 }} />
        </div>

        {/* Filter chips */}
        <div className="scroll" style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', flexShrink: 0 }}>
          {[{ id: 'all', label: 'Tous', color: 'var(--primary)', soft: 'var(--primary-soft)', ink: 'var(--primary)' },
            ...MEAL_LIST.map(m => ({ id: m.key, label: m.label, color: m.color, soft: m.soft, ink: m.ink }))].map(chip => {
            const active = filter === chip.id
            return (
              <button key={chip.id} onClick={() => setFilter(chip.id)} className="chip"
                style={{
                  cursor: 'pointer', flexShrink: 0, border: 'none', fontWeight: 'var(--fw-semibold)',
                  background: active ? chip.soft : 'var(--surface)',
                  color: active ? chip.ink : 'var(--text-secondary)',
                  boxShadow: active ? `inset 0 0 0 1.5px ${chip.color}` : 'inset 0 0 0 1px var(--border)',
                }}>
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Recipe list */}
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 16px', WebkitOverflowScrolling: 'touch' }}>
          {allFlat.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
              <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Aucun résultat</p>
              <p className="t-sub" style={{ marginTop: 4, marginBottom: 24 }}>Essayez d'autres mots-clés</p>
              {onCreateRecipe && (
                <button onClick={() => { dismiss(); onCreateRecipe(mealType) }} className="btn btn-secondary">
                  <I.Plus size={16} /> Créer une nouvelle recette
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
              {onCreateRecipe && (
                <button onClick={() => { dismiss(); onCreateRecipe(mealType) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--primary-soft)', boxShadow: 'inset 0 0 0 1.5px var(--primary)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary-ink)' }}><I.Plus size={18} sw={2.2} /></span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Créer une nouvelle recette</p>
                    <p className="t-caption tx-3" style={{ margin: '2px 0 0' }}>Ajouter une recette personnalisée</p>
                  </div>
                </button>
              )}
              {allFlat.map(recipe => {
                const isSelected = selected.includes(recipe.id)
                const isAdded = existingRecipes.some(r => r.id === recipe.id)
                const isExpanded = expanded === recipe.id
                const rMeal = MEALS[recipe.mealType] || MEALS.snack
                return (
                  <div key={recipe.id} style={{ background: isSelected ? rMeal.soft : 'var(--surface)', borderRadius: 'var(--r-md)', boxShadow: isSelected ? `inset 0 0 0 1.5px ${rMeal.color}` : 'inset 0 0 0 1px var(--hairline)', overflow: 'hidden', opacity: isAdded ? 0.45 : 1, transition: 'all 0.15s' }}>
                    <div onClick={() => !isAdded && toggleSelect(recipe)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: isAdded ? 'default' : 'pointer' }}>
                      <span className={`check${(isSelected || isAdded) ? ' is-checked' : ''}`}>
                        {(isSelected || isAdded) && <I.Check size={13} sw={2.6} stroke="currentColor" />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', lineHeight: 1.3, margin: 0 }}>
                          {recipe.name}
                          {isAdded && <span className="tx-3" style={{ fontSize: 11, fontWeight: 400, marginLeft: 6 }}>déjà ajouté</span>}
                        </p>
                        <p className="t-caption tx-3" style={{ margin: '2px 0 0' }}>
                          {MEALS[recipe.mealType]?.label} · {recipe.ingredients?.length ?? 0} ingr.{recipe.createdBy ? ` · ${recipe.createdBy}` : ''}
                        </p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : recipe.id) }} className="btn-icon" style={{ width: 32, height: 32, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <I.ChevD size={14} sw={2} />
                      </button>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--hairline)' }}>
                        <div style={{ paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {recipe.ingredients?.slice(0, 10).map((ing, i) => (
                            <span key={i} className="chip" style={{ height: 26, fontSize: 12 }}>{ing.ingredient}</span>
                          ))}
                          {(recipe.ingredients?.length ?? 0) > 10 && (
                            <span className="t-caption tx-3" style={{ padding: '3px 6px' }}>+{recipe.ingredients.length - 10} autres</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'var(--surface)', borderTop: '1px solid var(--hairline)', flexShrink: 0 }}>
          <button onClick={selected.length > 0 ? handleAdd : dismiss} className={`btn btn-lg ${selected.length > 0 ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
            {selected.length > 0 ? `Ajouter ${selected.length} recette${selected.length > 1 ? 's' : ''}` : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  )
}
