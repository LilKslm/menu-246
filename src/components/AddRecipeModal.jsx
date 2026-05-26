import { useState } from 'react'
import { MEAL_LIST } from '../shared/meals'
import { I } from '../shared/icons.jsx'

const SECTIONS = [
  'Fruits et légumes', 'Produits céréaliers', 'Produits laitiers',
  'Viandes', 'Varia', 'Varia - Congelés',
]
const COMMON_UNITS = ['g', 'ml', 'L', 'kg', 'Unité', 'Sachet', 'Sac', 'Boîte', 'Conserve', 'Casseaux', 'Portion', 'Tranche', 'Paquet']

function emptyIngredient() {
  return { ingredient: '', section: 'Varia', portion: '', unit: 'Unité' }
}

const labelStyle = { fontSize: 'var(--fs-micro)', letterSpacing: 'var(--tr-micro)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }
const errStyle = { fontSize: 12, color: 'var(--error)', marginTop: 4 }

export default function AddRecipeModal({ defaultMealType, onSave, onClose }) {
  const [name, setName] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [mealType, setMealType] = useState(defaultMealType || 'breakfast')
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [errors, setErrors] = useState({})

  function updateIngredient(idx, f, value) {
    setIngredients(prev => { const u = [...prev]; u[idx] = { ...u[idx], [f]: value }; return u })
  }
  function addIngredient() { setIngredients(prev => [...prev, emptyIngredient()]) }
  function removeIngredient(idx) { setIngredients(prev => prev.filter((_, i) => i !== idx)) }

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Le nom est requis'
    if (!createdBy.trim()) errs.createdBy = 'Votre prénom est requis'
    if (!ingredients.some(i => i.ingredient.trim())) errs.ingredients = 'Ajoutez au moins un ingrédient'
    return errs
  }

  function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const cleanIngredients = ingredients
      .filter(i => i.ingredient.trim())
      .map(i => ({ ingredient: i.ingredient.trim(), section: i.section, portion: parseFloat(i.portion) || 0, unit: i.unit }))
    onSave({
      id: `custom|||${Date.now()}|||${name.trim().replace(/\//g, '-')}`,
      name: name.trim(), mealType, category: mealType, isCustom: true,
      createdBy: createdBy.trim(), ingredients: cleanIngredients,
    })
  }

  return (
    <div className="app" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(30, 22, 14, 0.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: 'var(--bg)', borderTopLeftRadius: 'var(--r-2xl)', borderTopRightRadius: 'var(--r-2xl)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 40px rgba(30,20,10,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Nouvelle recette</h2>
          <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32 }}><I.X size={16} /></button>
        </div>

        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Name + author */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Nom de la recette</label>
              <input className="input" placeholder="ex: Pâtes à la sauce tomate" value={name} autoFocus
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                style={errors.name ? { boxShadow: 'inset 0 0 0 1.5px var(--error)' } : undefined} />
              {errors.name && <p style={errStyle}>{errors.name}</p>}
            </div>
            <div className="divider" style={{ margin: '12px 0' }} />
            <div>
              <label style={labelStyle}>Votre prénom</label>
              <input className="input" placeholder="ex: Marie" value={createdBy}
                onChange={e => { setCreatedBy(e.target.value); setErrors(p => ({ ...p, createdBy: '' })) }}
                style={errors.createdBy ? { boxShadow: 'inset 0 0 0 1.5px var(--error)' } : undefined} />
              {errors.createdBy && <p style={errStyle}>{errors.createdBy}</p>}
            </div>
          </div>

          {/* Meal type */}
          <div className="card" style={{ padding: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>Type de repas</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MEAL_LIST.map(meal => {
                const active = mealType === meal.key
                return (
                  <button key={meal.key} type="button" onClick={() => setMealType(meal.key)} className="chip"
                    style={{ cursor: 'pointer', border: 'none', height: 36, fontWeight: 'var(--fw-semibold)',
                      background: active ? meal.soft : 'var(--surface-2)',
                      color: active ? meal.ink : 'var(--text-secondary)',
                      boxShadow: active ? `inset 0 0 0 1.5px ${meal.color}` : 'none' }}>
                    <span style={{ fontSize: 14 }}>{meal.emoji}</span> {meal.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ingredients */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Ingrédients</label>
              <span className="t-caption tx-3">Pour 1 personne</span>
            </div>
            {errors.ingredients && <p style={{ ...errStyle, marginTop: 0, marginBottom: 8 }}>{errors.ingredients}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ingredients.map((ingr, idx) => (
                <div key={idx} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12, position: 'relative' }}>
                  {ingredients.length > 1 && (
                    <button type="button" onClick={() => removeIngredient(idx)}
                      style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, border: 'none', background: 'var(--error-soft)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <I.X size={12} />
                    </button>
                  )}
                  <input className="input" placeholder="Nom de l'ingrédient (ex: Farine)…" value={ingr.ingredient}
                    onChange={e => updateIngredient(idx, 'ingredient', e.target.value)}
                    style={{ marginBottom: 8, paddingRight: ingredients.length > 1 ? 40 : 16 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" type="number" placeholder="Qté" min="0" step="0.01" value={ingr.portion}
                      onChange={e => updateIngredient(idx, 'portion', e.target.value)}
                      style={{ width: 80, flexShrink: 0, textAlign: 'center', padding: '0 8px' }} />
                    <select className="input" value={ingr.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} style={{ flex: '0 0 104px' }}>
                      {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select className="input" value={ingr.section} onChange={e => updateIngredient(idx, 'section', e.target.value)} style={{ flex: 1 }}>
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addIngredient}
              style={{ marginTop: 10, width: '100%', padding: 12, borderRadius: 'var(--r-md)', border: 'none', background: 'var(--primary-soft)', boxShadow: 'inset 0 0 0 1.5px var(--primary)', color: 'var(--primary)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              <I.Plus size={16} sw={2.2} /> Ajouter un ingrédient
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'var(--bg)', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary btn-lg" style={{ flex: 1 }}>Annuler</button>
          <button onClick={handleSave} className="btn btn-primary btn-lg" style={{ flex: 2 }}>Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}
