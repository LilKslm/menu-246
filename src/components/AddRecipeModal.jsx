import { useState } from 'react'

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
const SECTIONS = [
  'Fruits et légumes',
  'Produits céréaliers',
  'Produits laitiers',
  'Viandes',
  'Varia',
  'Varia - Congelés',
]
const COMMON_UNITS = ['g', 'ml', 'L', 'kg', 'Unité', 'Sachet', 'Sac', 'Boîte', 'Conserve', 'Casseaux', 'Portion', 'Tranche', 'Paquet']

function emptyIngredient() {
  return { ingredient: '', section: 'Varia', portion: '', unit: 'Unité' }
}

const field = (hasError) => ({
  width: '100%',
  padding: '11px 13px',
  fontSize: 16,
  borderRadius: 10,
  border: `1.5px solid ${hasError ? '#FF3B30' : '#E5E5EA'}`,
  background: '#fff',
  color: '#1C1C1E',
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
  appearance: 'none',
})

export default function AddRecipeModal({ defaultMealType, onSave, onClose }) {
  const [name, setName] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [mealType, setMealType] = useState(defaultMealType || 'breakfast')
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [errors, setErrors] = useState({})

  function updateIngredient(idx, f, value) {
    setIngredients(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [f]: value }
      return updated
    })
  }

  function addIngredient() {
    setIngredients(prev => [...prev, emptyIngredient()])
  }

  function removeIngredient(idx) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Le nom est requis'
    if (!createdBy.trim()) errs.createdBy = 'Votre prénom est requis'
    if (ingredients.length === 0) errs.ingredients = 'Ajoutez au moins un ingrédient'
    return errs
  }

  function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const cleanIngredients = ingredients
      .filter(i => i.ingredient.trim())
      .map(i => ({
        ingredient: i.ingredient.trim(),
        section: i.section,
        portion: parseFloat(i.portion) || 0,
        unit: i.unit,
      }))

    onSave({
      id: `custom|||${Date.now()}|||${name.trim()}`,
      name: name.trim(),
      mealType,
      category: mealType,
      isCustom: true,
      createdBy: createdBy.trim(),
      ingredients: cleanIngredients,
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
        // On larger screens center it
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%',
        maxWidth: 560,
        margin: '0 auto',
        background: '#F2F2F7',
        borderRadius: '24px 24px 0 0',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, background: '#D1D1D6', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>Nouvelle recette</h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 16, border: 'none',
            background: '#E5E5EA', color: '#636366', fontSize: 16,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', WebkitOverflowScrolling: 'touch' }}>

          {/* Recipe name + author */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Nom de la recette
              </label>
              <input
                type="text"
                style={field(!!errors.name)}
                placeholder="ex: Pâtes à la sauce tomate"
                value={name}
                autoFocus
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              />
              {errors.name && <p style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>{errors.name}</p>}
            </div>

            <div style={{ height: 1, background: '#F2F2F7', margin: '12px 0' }} />

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Votre prénom
              </label>
              <input
                type="text"
                style={field(!!errors.createdBy)}
                placeholder="ex: Marie"
                value={createdBy}
                onChange={e => { setCreatedBy(e.target.value); setErrors(p => ({ ...p, createdBy: '' })) }}
              />
              {errors.createdBy && <p style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>{errors.createdBy}</p>}
            </div>
          </div>

          {/* Meal type */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
              Type de repas
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MEAL_TYPES.map(mt => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setMealType(mt)}
                  style={{
                    padding: '9px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600,
                    background: mealType === mt ? MEAL_COLORS[mt] : '#F2F2F7',
                    color: mealType === mt ? '#fff' : '#1C1C1E',
                    transition: 'all 0.15s',
                  }}
                >{MEAL_LABELS[mt]}</button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ingrédients
              </label>
              <span style={{ fontSize: 12, color: '#8E8E93' }}>Pour 1 personne</span>
            </div>

            {errors.ingredients && <p style={{ fontSize: 12, color: '#FF3B30', marginBottom: 8 }}>{errors.ingredients}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ingredients.map((ingr, idx) => (
                <div key={idx} style={{
                  background: '#F9F9F9', borderRadius: 12, padding: 12,
                  border: '1px solid #F0F0F0', position: 'relative',
                }}>
                  {/* Remove button */}
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 24, height: 24, borderRadius: 12, border: 'none',
                        background: '#FFE5E5', color: '#FF3B30', fontSize: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  )}

                  {/* Ingredient name — full width */}
                  <input
                    type="text"
                    style={{ ...field(false), marginBottom: 8, paddingRight: ingredients.length > 1 ? 40 : 13 }}
                    placeholder="Nom de l'ingrédient (ex: Farine)…"
                    value={ingr.ingredient}
                    onChange={e => updateIngredient(idx, 'ingredient', e.target.value)}
                  />

                  {/* Portion + Unit + Section on one row */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      style={{ ...field(false), width: 80, flexShrink: 0, textAlign: 'center', padding: '11px 8px' }}
                      placeholder="Qté"
                      min="0"
                      step="0.01"
                      value={ingr.portion}
                      onChange={e => updateIngredient(idx, 'portion', e.target.value)}
                    />
                    <select
                      style={{ ...field(false), flex: '0 0 100px' }}
                      value={ingr.unit}
                      onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                    >
                      {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select
                      style={{ ...field(false), flex: 1 }}
                      value={ingr.section}
                      onChange={e => updateIngredient(idx, 'section', e.target.value)}
                    >
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Add ingredient */}
            <button
              type="button"
              onClick={addIngredient}
              style={{
                marginTop: 10, width: '100%', padding: '12px',
                borderRadius: 12, border: '1.5px dashed #007AFF',
                background: '#EFF6FF', color: '#007AFF',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>+</span>
              Ajouter un ingrédient
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          background: '#F2F2F7',
          borderTop: '1px solid #E5E5EA',
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '15px', borderRadius: 14, border: 'none',
              background: '#E5E5EA', color: '#1C1C1E', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >Annuler</button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: '15px', borderRadius: 14, border: 'none',
              background: '#007AFF', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}
          >Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}
