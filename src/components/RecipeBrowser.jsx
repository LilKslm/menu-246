import { useState, useMemo } from 'react'
import AddRecipeModal from './AddRecipeModal'
import RecipeEditor from './RecipeEditor'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}
const MEAL_TAG_COLORS = {
  breakfast: 'text-orange-600 bg-orange-50',
  lunch: 'text-green-600 bg-green-50',
  dinner: 'text-blue-600 bg-blue-50',
  snack: 'text-purple-600 bg-purple-50',
}

export default function RecipeBrowser({
  recipes,
  pendingRecipe,
  viewedRecipe,
  onSelectRecipe,
  onAddRecipe,
  onEditRecipe,
}) {
  const [search, setSearch] = useState('')
  // All sections collapsed by default; expand on click
  const [expanded, setExpanded] = useState({})
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalMealType, setAddModalMealType] = useState('breakfast')
  const [editingRecipe, setEditingRecipe] = useState(null)

  function toggleSection(mealType) {
    setExpanded(prev => ({ ...prev, [mealType]: !prev[mealType] }))
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return recipes
    const result = {}
    for (const mt of MEAL_TYPES) {
      result[mt] = (recipes[mt] || []).filter(r =>
        r.name.toLowerCase().includes(term)
      )
    }
    return result
  }, [recipes, search])

  // Auto-expand sections that have search matches
  const searchActive = search.trim().length > 0

  function openAddModal(mealType) {
    setAddModalMealType(mealType)
    setAddModalOpen(true)
  }

  function handleRecipeClick(recipe) {
    onSelectRecipe(recipe)
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* ── Header ───────────────────────────── */}
        <div className="px-3 pt-3 pb-2 border-b border-apple-gray-2 flex-shrink-0">
          <h2 className="text-xs font-bold text-apple-secondary uppercase tracking-wider mb-2">
            Bibliothèque
          </h2>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-apple-secondary text-xs">🔍</span>
            <input
              type="search"
              placeholder="Rechercher une recette…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg bg-apple-gray border-0 focus:outline-none focus:ring-2 focus:ring-apple-blue placeholder-apple-secondary"
            />
          </div>
        </div>

        {/* ── Hint when recipe is pending ───────── */}
        {pendingRecipe && (
          <div className="mx-2 mt-2 px-3 py-2 bg-blue-50 border border-apple-blue/20 rounded-xl text-xs text-apple-blue">
            <span className="font-semibold">📌 {pendingRecipe.name}</span>
            <div className="opacity-70 mt-0.5">Allez sur Calendrier pour placer</div>
          </div>
        )}

        {/* ── Recipe list ───────────────────────── */}
        <div className="flex-1 overflow-y-auto py-1">
          {MEAL_TYPES.map(mealType => {
            const list = filtered[mealType] || []
            const isOpen = searchActive || !!expanded[mealType]
            const totalCount = (recipes[mealType] || []).length

            return (
              <div key={mealType} className="mb-0.5">
                {/* Section toggle */}
                <button
                  onClick={() => toggleSection(mealType)}
                  className="section-header w-full"
                >
                  <div className="flex items-center gap-2">
                    <span>{MEAL_ICONS[mealType]}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${MEAL_TAG_COLORS[mealType]}`}>
                      {MEAL_LABELS[mealType]}
                    </span>
                    <span className="text-xs text-apple-secondary">
                      {searchActive ? `${list.length}/` : ''}{totalCount}
                    </span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-apple-secondary transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Recipe cards */}
                {isOpen && (
                  <ul className="px-2 pb-1">
                    {list.length === 0 && (
                      <li className="text-xs text-apple-secondary text-center py-3 italic">
                        {searchActive ? 'Aucun résultat' : 'Aucune recette'}
                      </li>
                    )}
                    {list.map(recipe => {
                      const isPending = pendingRecipe?.id === recipe.id
                      const isViewed = viewedRecipe?.id === recipe.id && !isPending

                      return (
                        <li
                          key={recipe.id}
                          className={`
                            recipe-card
                            ${isPending ? 'is-pending' : isViewed ? 'is-viewed' : ''}
                          `}
                          onClick={() => handleRecipeClick(recipe)}
                        >
                          {/* Placement indicator dot */}
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            isPending ? 'bg-white' : isViewed ? 'bg-apple-blue' : 'bg-apple-gray-3'
                          }`} />

                          <span className="flex-1 leading-tight text-xs truncate">{recipe.name}</span>

                          {recipe.isCustom && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold ${
                              isPending ? 'bg-white/20 text-white' : 'bg-apple-gray-2 text-apple-secondary'
                            }`}>
                              Perso
                            </span>
                          )}

                          {/* Edit button — appears on hover */}
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setEditingRecipe(recipe)
                            }}
                            className={`opacity-0 group-hover:opacity-100 btn-icon w-6 h-6 text-xs flex-shrink-0 ${
                              isPending ? 'text-white/60 hover:text-white hover:bg-white/10' : ''
                            }`}
                            title="Modifier la recette"
                          >
                            ✎
                          </button>
                        </li>
                      )
                    })}

                    {/* Add recipe button */}
                    <li>
                      <button
                        onClick={() => openAddModal(mealType)}
                        className="w-full mt-1 px-3 py-1.5 text-xs text-apple-blue hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                      >
                        <span className="text-sm leading-none font-bold">+</span>
                        Ajouter une recette
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────── */}
      {addModalOpen && (
        <AddRecipeModal
          defaultMealType={addModalMealType}
          onSave={recipe => {
            onAddRecipe(recipe)
            setAddModalOpen(false)
          }}
          onClose={() => setAddModalOpen(false)}
        />
      )}

      {editingRecipe && (
        <RecipeEditor
          recipe={editingRecipe}
          onSave={(original, edited) => {
            onEditRecipe(original, edited)
            setEditingRecipe(null)
          }}
          onClose={() => setEditingRecipe(null)}
        />
      )}
    </>
  )
}
