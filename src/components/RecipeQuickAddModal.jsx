import { useState, useMemo, useRef, useEffect } from 'react'
import { MEALS, MEAL_TYPES, MEAL_LIST } from '../shared/meals'
import { I } from '../shared/icons.jsx'

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

  useEffect(() => { searchRef.current?.focus() }, [])
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
        if (r.name.toLowerCase().includes(term) || r.ingredients?.some(i => i.ingredient?.toLowerCase().includes(term))) results.push(r)
      }
    }
    return results
  }, [recipes, filter, search, existingIds])

  return (
    <div className="app" style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(30, 22, 14, 0.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Ajouter un repas</h3>
              {slot?.dayLabel && (
                <p className="t-caption tx-3" style={{ margin: '2px 0 0', textTransform: 'capitalize' }}>{MEALS[slot.mealType]?.label} · {slot.dayLabel}</p>
              )}
            </div>
            <button onClick={onClose} className="btn-icon" style={{ width: 30, height: 30, marginLeft: 12 }}><I.X size={15} /></button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', margin: '14px 0 12px' }}>
            <I.Search size={16} stroke="var(--text-tertiary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input ref={searchRef} className="input" placeholder="Rechercher par nom ou ingrédient…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, paddingRight: search ? 36 : 16 }} />
            {search && <button onClick={() => setSearch('')} className="btn-icon" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28 }}><I.X size={14} /></button>}
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {[{ id: 'all', label: 'Tous', color: 'var(--primary)', soft: 'var(--primary-soft)', ink: 'var(--primary)' },
              ...MEAL_LIST.map(m => ({ id: m.key, label: m.label, color: m.color, soft: m.soft, ink: m.ink }))].map(f => {
              const active = filter === f.id
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} className="chip"
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 'var(--fw-semibold)',
                    background: active ? f.soft : 'var(--surface-2)',
                    color: active ? f.ink : 'var(--text-secondary)',
                    boxShadow: active ? `inset 0 0 0 1.5px ${f.color}` : 'none' }}>
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Recipe list */}
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: 14, margin: 0 }}>Aucune recette trouvée</p>
            </div>
          ) : (
            filtered.map(recipe => {
              const meal = MEALS[recipe.mealType] || MEALS.snack
              return (
                <button key={recipe.id} onClick={() => onAdd(recipe)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-md)', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span className="dot" style={{ width: 10, height: 10, background: meal.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>{recipe.name}</p>
                    <p className="t-caption tx-3" style={{ margin: '2px 0 0' }}>
                      {meal.label}{recipe.createdBy ? ` · ${recipe.createdBy}` : ''} · {recipe.ingredients?.length || 0} ingrédient{(recipe.ingredients?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: meal.ink, padding: '3px 8px', borderRadius: 'var(--r-sm)', background: meal.soft }}>+ Ajouter</span>
                    {onDeleteLocal && (
                      <button onClick={e => { e.stopPropagation(); if (!confirm(`Masquer "${recipe.name}" de votre bibliothèque?`)) return; onDeleteLocal(recipe) }}
                        title="Masquer de ma bibliothèque"
                        style={{ width: 24, height: 24, borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--error-soft)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <I.Trash size={13} />
                      </button>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
