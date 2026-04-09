import { useState } from 'react'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const SECTIONS = [
  'Fruits et légumes',
  'Produits céréaliers',
  'Produits laitiers',
  'Viandes',
  'Varia',
  'Varia - Congelés',
]
const COMMON_UNITS = [
  'g', 'ml', 'L', 'kg', 'Unité', 'Sachet', 'Sac', 'Boîte',
  'Conserve', 'Casseaux', 'Portion', 'Tranche', 'Paquet', 'Contenant', 'Tasse',
]

export default function RecipeEditor({ recipe, onSave, onClose }) {
  const isExcel = !recipe.isCustom

  const [name, setName] = useState(recipe.name)
  const [mealType, setMealType] = useState(recipe.mealType)
  const [ingredients, setIngredients] = useState(
    recipe.ingredients.length > 0
      ? recipe.ingredients.map(i => ({ ...i }))
      : [{ ingredient: '', section: 'Varia', portion: '', unit: 'Unité' }]
  )
  const [errors, setErrors] = useState({})

  function updateIngredient(idx, field, value) {
    setIngredients(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  function addIngredient() {
    setIngredients(prev => [...prev, { ingredient: '', section: 'Varia', portion: '', unit: 'Unité' }])
  }

  function removeIngredient(idx) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Le nom est requis'
    const hasIngredients = ingredients.some(i => i.ingredient.trim())
    if (!hasIngredients) errs.ingredients = 'Ajoutez au moins un ingrédient'
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

    const editedRecipe = {
      // If forking an Excel recipe: generate a new custom id
      id: isExcel ? `custom|||${Date.now()}|||${name.trim().replace(/\//g, '-')}` : recipe.id,
      name: name.trim(),
      mealType,
      category: mealType,
      isCustom: true,
      ingredients: cleanIngredients,
    }

    onSave(recipe, editedRecipe)
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-apple-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ── Header ────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-apple-gray-2">
          <div>
            <h2 className="text-base font-bold text-apple-dark">
              {isExcel ? 'Modifier (copie personnalisée)' : 'Modifier la recette'}
            </h2>
            {isExcel && (
              <p className="text-xs text-apple-secondary mt-0.5">
                La recette originale sera conservée. Une copie modifiée sera ajoutée.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-apple-gray hover:bg-apple-gray-2 flex items-center justify-center text-apple-secondary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Body ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="label">Nom de la recette</label>
            <input
              type="text"
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Meal type */}
          <div>
            <label className="label">Type de repas</label>
            <div className="flex gap-2 flex-wrap">
              {MEAL_TYPES.map(mt => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setMealType(mt)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    mealType === mt ? 'bg-apple-blue text-white' : 'bg-apple-gray text-apple-dark hover:bg-apple-gray-2'
                  }`}
                >
                  {MEAL_LABELS[mt]}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Ingrédients</label>
              <span className="text-xs text-apple-secondary">Pour 1 personne</span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_140px_80px_100px_28px] gap-2 mb-1 px-1">
              {['Ingrédient', 'Section', 'Portion', 'Unité', ''].map((h, i) => (
                <span key={i} className="text-xs font-semibold text-apple-secondary">{h}</span>
              ))}
            </div>

            <div className="space-y-2">
              {ingredients.map((ingr, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_140px_80px_100px_28px] gap-2 items-center">
                  <input
                    type="text"
                    className="input-field py-1.5 text-xs"
                    placeholder="Farine…"
                    value={ingr.ingredient}
                    onChange={e => updateIngredient(idx, 'ingredient', e.target.value)}
                  />
                  <select
                    className="input-field py-1.5 text-xs"
                    value={ingr.section}
                    onChange={e => updateIngredient(idx, 'section', e.target.value)}
                  >
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input
                    type="number"
                    className="input-field py-1.5 text-xs text-center"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={ingr.portion}
                    onChange={e => updateIngredient(idx, 'portion', e.target.value)}
                  />
                  <select
                    className="input-field py-1.5 text-xs"
                    value={ingr.unit}
                    onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                  >
                    {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    disabled={ingredients.length === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 disabled:opacity-20 disabled:cursor-not-allowed text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 text-xs text-apple-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
            >
              <span className="font-bold">+</span> Ajouter un ingrédient
            </button>
          </div>
        </div>

        {/* ── Footer ────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-apple-gray-2">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} className="btn-primary">
            {isExcel ? 'Sauvegarder comme copie' : 'Mettre à jour'}
          </button>
        </div>
      </div>
    </div>
  )
}
