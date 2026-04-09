import { useState, useMemo, useEffect, useRef } from 'react'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_COLORS = {
  breakfast: '#F97316',
  lunch: '#22C55E',
  dinner: '#3B82F6',
  snack: '#A855F7',
}

function CheckIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

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

  // Animate in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Clean up dismiss timer on unmount
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function dismiss() {
    setVisible(false)
    closeTimer.current = setTimeout(onClose, 300)
  }

  // Flat list of all recipes matching filter + search
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

  // All recipes flat (for resolving selected ids)
  const allRecipesFlat = useMemo(
    () => MEAL_TYPES.flatMap(mt => recipes[mt] || []),
    [recipes]
  )

  function toggleSelect(recipe) {
    if (existingRecipes.some(r => r.id === recipe.id)) return
    setSelected(prev =>
      prev.includes(recipe.id)
        ? prev.filter(id => id !== recipe.id)
        : [...prev, recipe.id]
    )
  }

  function handleAdd() {
    const toAdd = selected.map(id => allRecipesFlat.find(r => r.id === id)).filter(Boolean)
    onAdd(toAdd)
    dismiss()
  }

  // Touch drag-to-dismiss
  const sheetRef = useRef(null)
  const dragStart = useRef(null)
  function onTouchStart(e) { dragStart.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (!dragStart.current) return
    const delta = e.changedTouches[0].clientY - dragStart.current
    if (delta > 80) dismiss()
    dragStart.current = null
  }

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: 'auto' }}>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: '#D1D1D6', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '4px 20px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', lineHeight: 1.2 }}>
                Ajouter des recettes
              </h2>
              <p style={{ fontSize: 14, color: '#636366', marginTop: 2 }}>
                <span style={{
                  display: 'inline-block',
                  width: 8, height: 8, borderRadius: '50%',
                  background: MEAL_COLORS[mealType],
                  marginRight: 5, verticalAlign: 'middle',
                }}/>
                {MEAL_LABELS[mealType]} · {dayLabel}
              </p>
            </div>
            <button
              onClick={dismiss}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#F2F2F7', border: 'none',
                fontSize: 16, color: '#636366', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#8E8E93' }}>🔍</span>
            <input
              ref={searchRef}
              type="search"
              placeholder="Recette ou ingrédient..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 12px 12px 38px',
                fontSize: 16, border: 'none', borderRadius: 12,
                background: '#F2F2F7', color: '#1C1C1E',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
          {[{ id: 'all', label: 'Tous' }, ...MEAL_TYPES.map(mt => ({ id: mt, label: MEAL_LABELS[mt] }))].map(chip => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                flexShrink: 0,
                background: filter === chip.id ? '#007AFF' : '#F2F2F7',
                color: filter === chip.id ? '#fff' : '#1C1C1E',
                transition: 'background 0.15s, color 0.15s',
              }}
            >{chip.label}</button>
          ))}
        </div>

        {/* Recipe list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', WebkitOverflowScrolling: 'touch' }}>
          {allFlat.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontWeight: 600, fontSize: 16, color: '#1C1C1E' }}>Aucun résultat</p>
              <p style={{ fontSize: 14, marginTop: 4, marginBottom: 24 }}>Essayez d'autres mots-clés</p>
              {onCreateRecipe && (
                <button
                  onClick={() => { dismiss(); onCreateRecipe(mealType) }}
                  style={{
                    padding: '12px 24px', borderRadius: 14, border: '1.5px dashed #007AFF',
                    background: '#EFF6FF', color: '#007AFF', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >+ Créer une nouvelle recette</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
              {onCreateRecipe && (
                <button
                  onClick={() => { dismiss(); onCreateRecipe(mealType) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 16,
                    border: '1.5px dashed #007AFF', background: '#EFF6FF',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 20, color: '#fff', fontWeight: 300,
                  }}>+</div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#007AFF', margin: 0 }}>Créer une nouvelle recette</p>
                    <p style={{ fontSize: 12, color: '#636366', margin: '2px 0 0' }}>Ajouter une recette personnalisée</p>
                  </div>
                </button>
              )}
              {allFlat.map(recipe => {
                const isSelected = selected.includes(recipe.id)
                const isAdded = existingRecipes.some(r => r.id === recipe.id)
                const isExpanded = expanded === recipe.id

                return (
                  <div
                    key={recipe.id}
                    style={{
                      background: isSelected ? '#EFF6FF' : '#fff',
                      borderRadius: 16,
                      border: isSelected ? '1.5px solid #007AFF' : '1.5px solid #E5E5EA',
                      overflow: 'hidden',
                      opacity: isAdded ? 0.45 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      onClick={() => !isAdded && toggleSelect(recipe)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: isAdded ? 'default' : 'pointer' }}
                    >
                      {/* Checkmark circle */}
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: (isSelected || isAdded) ? '#007AFF' : 'transparent',
                        border: (isSelected || isAdded) ? 'none' : '2px solid #D1D1D6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {(isSelected || isAdded) && <CheckIcon />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, color: '#1C1C1E', lineHeight: 1.3, margin: 0 }}>
                          {recipe.name}
                          {isAdded && <span style={{ fontSize: 11, color: '#8E8E93', fontWeight: 400, marginLeft: 6 }}>déjà ajouté</span>}
                        </p>
                        <p style={{ fontSize: 12, color: '#8E8E93', margin: '2px 0 0' }}>
                          {MEAL_LABELS[recipe.mealType]} · {recipe.ingredients?.length ?? 0} ingr.
                          {recipe.createdBy && ` · ${recipe.createdBy}`}
                        </p>
                      </div>

                      {/* Expand chevron */}
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : recipe.id) }}
                        style={{
                          width: 32, height: 32, border: 'none', background: 'none',
                          cursor: 'pointer', color: '#8E8E93', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      >▾</button>
                    </div>

                    {/* Ingredient preview */}
                    {isExpanded && (
                      <div style={{ padding: '0 14px 12px', borderTop: '1px solid #F2F2F7' }}>
                        <div style={{ paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {recipe.ingredients?.slice(0, 10).map((ing, i) => (
                            <span key={i} style={{
                              fontSize: 12, background: '#F2F2F7', color: '#636366',
                              padding: '3px 10px', borderRadius: 20,
                            }}>
                              {ing.ingredient}
                            </span>
                          ))}
                          {(recipe.ingredients?.length ?? 0) > 10 && (
                            <span style={{ fontSize: 12, color: '#8E8E93', padding: '3px 6px' }}>
                              +{recipe.ingredients.length - 10} autres
                            </span>
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

        {/* Bottom CTA button */}
        <div style={{
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          background: '#fff',
          borderTop: '1px solid #F2F2F7',
          flexShrink: 0,
        }}>
          <button
            onClick={selected.length > 0 ? handleAdd : dismiss}
            style={{
              width: '100%', padding: '16px', borderRadius: 16,
              border: 'none', cursor: 'pointer',
              fontSize: 16, fontWeight: 700,
              background: selected.length > 0 ? '#007AFF' : '#F2F2F7',
              color: selected.length > 0 ? '#fff' : '#8E8E93',
              transition: 'background 0.15s, color 0.15s',
              letterSpacing: -0.2,
            }}
          >
            {selected.length > 0
              ? `Ajouter ${selected.length} recette${selected.length > 1 ? 's' : ''}`
              : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  )
}
