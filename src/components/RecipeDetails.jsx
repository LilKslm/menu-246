import { useState } from 'react'
import { formatAmount } from '../utils/calculations'
import RecipeEditor from './RecipeEditor'

const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_BADGE = {
  breakfast: 'bg-orange-100 text-orange-700',
  lunch: 'bg-green-100 text-green-700',
  dinner: 'bg-blue-100 text-blue-700',
  snack: 'bg-purple-100 text-purple-700',
}
const SECTION_ICON = {
  'Fruits et légumes': '🥦',
  'Produits céréaliers': '🌾',
  'Produits laitiers': '🥛',
  'Viandes': '🥩',
  'Varia': '🧂',
  'Varia - Congelés': '🧊',
}

export default function RecipeDetails({
  recipe,
  numPeople,
  pendingRecipe,
  onSetPending,
  onEditRecipe,
  onDeleteLocal,
}) {
  const [editing, setEditing] = useState(false)

  if (!recipe) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4 opacity-20">📋</div>
        <p className="text-sm text-apple-secondary leading-relaxed max-w-[160px]">
          Cliquez sur une recette pour voir ses détails
        </p>
        <p className="text-xs text-apple-secondary/60 mt-3 leading-relaxed max-w-[160px]">
          Sélectionnez une recette dans la bibliothèque ou cliquez sur un repas dans le calendrier
        </p>
      </div>
    )
  }

  const isPending = pendingRecipe?.id === recipe.id

  // Group ingredients by section
  const bySection = {}
  for (const ingr of recipe.ingredients) {
    const sec = ingr.section || 'Varia'
    if (!bySection[sec]) bySection[sec] = []
    bySection[sec].push(ingr)
  }
  const sections = Object.keys(bySection)

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* ── Recipe header ───────────────────── */}
        <div className="px-4 pt-4 pb-3 border-b border-apple-gray-2 flex-shrink-0">
          {/* Title row */}
          <div className="flex items-start gap-2 mb-2">
            <h2 className="text-base font-bold text-apple-dark leading-snug flex-1">
              {recipe.name}
            </h2>
            {onEditRecipe && (
              <button
                onClick={() => setEditing(true)}
                className="btn-icon text-xs flex-shrink-0 mt-0.5"
                title="Modifier cette recette"
              >✎</button>
            )}
            {onDeleteLocal && (
              <button
                onClick={() => {
                  if (!confirm(`Masquer "${recipe.name}" de votre bibliothèque?`)) return
                  onDeleteLocal(recipe)
                }}
                className="btn-icon text-xs flex-shrink-0 mt-0.5 text-red-400 hover:text-red-600"
                title="Masquer de ma bibliothèque"
                style={{ opacity: 1 }}
              >🗑</button>
            )}
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${MEAL_BADGE[recipe.mealType] || 'bg-apple-gray text-apple-dark'}`}>
              {MEAL_LABELS[recipe.mealType] || recipe.mealType}
            </span>
            {(recipe.isCustom || recipe.isShared) && (
              <span className="badge bg-apple-gray-2 text-apple-secondary">
                {recipe.createdBy ? `Par ${recipe.createdBy}` : 'Personnalisé'}
              </span>
            )}
          </div>

          <p className="text-xs text-apple-secondary mt-2">
            {recipe.ingredients.length} ingrédient{recipe.ingredients.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Place button ────────────────────── */}
        <div className="px-4 py-3 border-b border-apple-gray-2 flex-shrink-0">
          {isPending ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-apple-blue/20 rounded-xl text-xs text-apple-blue">
              <span>📌</span>
              <span className="font-medium">Allez sur le Calendrier pour placer</span>
            </div>
          ) : (
            <button
              onClick={() => onSetPending(recipe)}
              className="btn-primary w-full text-sm py-2"
            >
              + Placer ce repas
            </button>
          )}
        </div>

        {/* ── Column headers ──────────────────── */}
        <div className="px-4 py-2 bg-apple-gray/50 border-b border-apple-gray-2 flex-shrink-0">
          <div className="grid grid-cols-[1fr_56px_64px] gap-1 text-[10px] font-bold text-apple-secondary uppercase tracking-wide">
            <span>Ingrédient</span>
            <span className="text-right">×1</span>
            <span className="text-right">×{numPeople}</span>
          </div>
        </div>

        {/* ── Ingredients ─────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {sections.length === 0 && (
            <p className="text-xs text-apple-secondary text-center py-6 italic">
              Aucun ingrédient enregistré
            </p>
          )}

          {sections.map(section => (
            <div key={section}>
              <div className="px-4 py-1.5 bg-apple-gray/40 border-b border-apple-gray-2/50 flex items-center gap-1.5 sticky top-0">
                <span className="text-xs">{SECTION_ICON[section] || '📦'}</span>
                <span className="text-[10px] font-bold text-apple-secondary uppercase tracking-wide">
                  {section}
                </span>
              </div>

              {bySection[section].map((ingr, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_56px_64px] gap-1 px-4 py-1.5 text-xs border-b border-apple-gray-2/40 hover:bg-apple-gray/20"
                >
                  <span className="text-apple-dark leading-tight">{ingr.ingredient}</span>
                  <span className="text-apple-secondary text-right whitespace-nowrap tabular-nums">
                    {formatAmount(ingr.portion)}<span className="text-[9px] ml-0.5">{ingr.unit}</span>
                  </span>
                  <span className="text-apple-dark font-semibold text-right whitespace-nowrap tabular-nums">
                    {formatAmount(ingr.portion * numPeople)}<span className="text-[9px] ml-0.5 font-normal text-apple-secondary">{ingr.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Footer ──────────────────────────── */}
        {recipe.ingredients.length > 0 && (
          <div className="px-4 py-2.5 border-t border-apple-gray-2 bg-apple-gray/30 flex-shrink-0">
            <p className="text-[10px] text-apple-secondary text-right">
              Pour <span className="font-bold text-apple-dark">{numPeople}</span> personne{numPeople > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── Editor modal ──────────────────────── */}
      {editing && (
        <RecipeEditor
          recipe={recipe}
          onSave={(original, edited) => {
            onEditRecipe(original, edited)
            setEditing(false)
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
