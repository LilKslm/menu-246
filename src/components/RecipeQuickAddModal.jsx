import { useState, useMemo, useRef, useEffect } from 'react'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_COLORS = {
  breakfast: '#F97316',
  lunch: '#16A34A',
  dinner: '#2563EB',
  snack: '#9333EA',
}
const MEAL_BG = {
  breakfast: '#FFF7ED',
  lunch: '#F0FDF4',
  dinner: '#EFF6FF',
  snack: '#FAF5FF',
}

export default function RecipeQuickAddModal({
  recipes,
  slot, // { dayIndex, mealType, dayLabel }
  existingRecipes = [],
  onAdd,
  onClose,
  onDeleteLocal,
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(slot?.mealType || 'all')
  const searchRef = useRef(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Handle Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const existingIds = useMemo(() => new Set(existingRecipes.map(r => r.id)), [existingRecipes])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    const results = []
    const types = filter === 'all' ? MEAL_TYPES : [filter]

    for (const mt of types) {
      for (const r of (recipes[mt] || [])) {
        if (existingIds.has(r.id)) continue
        if (!term) { results.push(r); continue }
        const nameMatch = r.name.toLowerCase().includes(term)
        const ingrMatch = r.ingredients?.some(i =>
          i.ingredient?.toLowerCase().includes(term)
        )
        if (nameMatch || ingrMatch) results.push(r)
      }
    }

    return results
  }, [recipes, filter, search, existingIds])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '80vh',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>
                Ajouter un repas
              </h3>
              {slot?.dayLabel && (
                <p style={{ fontSize: 13, color: '#8E8E93', margin: '2px 0 0' }}>
                  {MEAL_LABELS[slot.mealType]} · {slot.dayLabel}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 15, border: 'none',
                background: '#F2F2F7', color: '#636366', fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginLeft: 12,
              }}
            >✕</button>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F2F2F7', borderRadius: 10,
            padding: '9px 12px', margin: '14px 0 12px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
              <circle cx="11" cy="11" r="7" stroke="#1C1C1E" strokeWidth="2.5"/>
              <path d="M20 20l-3-3" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Rechercher par nom ou ingrédient…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none', background: 'none', outline: 'none',
                fontSize: 14, color: '#1C1C1E', flex: 1, minWidth: 0,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#C7C7CC', fontSize: 16 }}
              >✕</button>
            )}
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {[{ id: 'all', label: 'Tous' }, ...MEAL_TYPES.map(mt => ({ id: mt, label: MEAL_LABELS[mt] }))].map(f => {
              const active = filter === f.id
              const color = f.id !== 'all' ? MEAL_COLORS[f.id] : '#0066CC'
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: 'none',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: active ? color : '#F2F2F7',
                    color: active ? '#fff' : '#636366',
                    transition: 'all 0.15s',
                  }}
                >{f.label}</button>
              )
            })}
          </div>
        </div>

        {/* Recipe list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#C7C7CC' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 14, margin: 0 }}>Aucune recette trouvée</p>
            </div>
          ) : (
            filtered.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => onAdd(recipe)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = MEAL_BG[recipe.mealType] || '#F9F9F9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Color dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: 5, flexShrink: 0,
                  background: MEAL_COLORS[recipe.mealType] || '#ccc',
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E', margin: 0, lineHeight: 1.3 }}>
                    {recipe.name}
                  </p>
                  <p style={{ fontSize: 12, color: '#8E8E93', margin: '2px 0 0' }}>
                    {MEAL_LABELS[recipe.mealType]}
                    {recipe.createdBy && ` · ${recipe.createdBy}`}
                    {` · ${recipe.ingredients?.length || 0} ingrédient${(recipe.ingredients?.length || 0) !== 1 ? 's' : ''}`}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: MEAL_COLORS[recipe.mealType] || '#0066CC',
                    padding: '3px 8px', borderRadius: 6,
                    background: MEAL_BG[recipe.mealType] || '#EFF6FF',
                  }}>
                    + Ajouter
                  </div>
                  {onDeleteLocal && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (!confirm(`Masquer "${recipe.name}" de votre bibliothèque?`)) return
                        onDeleteLocal(recipe)
                      }}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: 'none',
                        background: '#FEF2F2', color: '#EF4444', fontSize: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      title="Masquer de ma bibliothèque"
                    >🗑</button>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
