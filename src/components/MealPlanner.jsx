import { useState, useEffect } from 'react'
import RecipeBrowser from './RecipeBrowser'
import MealCalendar from './MealCalendar'
import RecipeDetails from './RecipeDetails'

const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}

export default function MealPlanner({
  recipes,
  campSetup,
  mealPlan,
  selectedRecipe,
  onSelectRecipe,
  onPlaceRecipe,
  onRemoveRecipe,
  onAddRecipe,
  onEditRecipe,
  onNext,
  onBack,
}) {
  // The recipe the user has clicked and wants to place in a cell
  const [pendingRecipe, setPendingRecipe] = useState(null)
  // Mobile tab: 'browser' | 'calendar' | 'details'
  const [activeTab, setActiveTab] = useState('browser')

  // Escape cancels pending placement
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setPendingRecipe(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /**
   * Called when user clicks a recipe in the browser.
   * - If already pending: deselect (toggle off)
   * - Otherwise: set as pending AND show in details
   */
  function handleSelectRecipe(recipe) {
    onSelectRecipe(recipe)
    if (pendingRecipe?.id === recipe.id) {
      setPendingRecipe(null)
    } else {
      setPendingRecipe(recipe)
      // Auto-switch to calendar on mobile so user can place immediately
      setActiveTab('calendar')
    }
  }

  /**
   * Called from the "Placer ce repas" button in RecipeDetails.
   * Sets the viewed recipe as pending without deselecting it.
   */
  function handleSetPendingFromDetails(recipe) {
    setPendingRecipe(recipe)
    setActiveTab('calendar')
  }

  /**
   * Called when user clicks a calendar cell.
   * If pendingRecipe exists and mealType matches → place the recipe.
   */
  function handleCellClick(dayIndex, mealType) {
    if (pendingRecipe && pendingRecipe.mealType === mealType) {
      onPlaceRecipe(dayIndex, mealType, pendingRecipe)
      setPendingRecipe(null)
    }
  }

  /**
   * Called when user clicks a placed recipe name in a cell.
   * Shows it in details WITHOUT setting as pending.
   */
  function handleViewPlacedRecipe(recipe) {
    onSelectRecipe(recipe)
    setActiveTab('details')
  }

  const filledCount = Object.values(mealPlan).reduce(
    (total, day) => total + Object.values(day).filter(arr => Array.isArray(arr) ? arr.length > 0 : Boolean(arr)).length,
    0
  )
  const totalSlots = campSetup.numDays * 4

  // ── Shared panel components ──────────────────────────────────
  const browserPanel = (
    <RecipeBrowser
      recipes={recipes}
      pendingRecipe={pendingRecipe}
      viewedRecipe={selectedRecipe}
      onSelectRecipe={handleSelectRecipe}
      onAddRecipe={onAddRecipe}
      onEditRecipe={onEditRecipe}
    />
  )

  const calendarPanel = (
    <MealCalendar
      campSetup={campSetup}
      mealPlan={mealPlan}
      pendingRecipe={pendingRecipe}
      onCellClick={handleCellClick}
      onRemoveRecipe={onRemoveRecipe}
      onViewRecipe={handleViewPlacedRecipe}
    />
  )

  const detailsPanel = (
    <RecipeDetails
      recipe={selectedRecipe}
      numPeople={campSetup.numPeople}
      pendingRecipe={pendingRecipe}
      onSetPending={handleSetPendingFromDetails}
      onEditRecipe={onEditRecipe}
    />
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Toolbar ─────────────────────────────── */}
      <div className="bg-white border-b border-apple-gray-2 px-3 md:px-4 py-2 flex items-center gap-2 no-print flex-shrink-0">
        <button onClick={onBack} className="btn-ghost text-apple-secondary text-xs hidden sm:flex">
          ← Retour
        </button>
        <div className="flex-1" />
        <div className="text-xs text-apple-secondary">
          <span className="font-semibold text-apple-dark">{filledCount}</span>
          <span>/{totalSlots}</span>
        </div>
        <button onClick={onNext} className="btn-primary text-xs py-2 px-4">
          Exporter →
        </button>
      </div>

      {/* ── Pending recipe banner ────────────────── */}
      {pendingRecipe && (
        <div className="bg-apple-blue text-white px-4 py-2 flex items-center gap-3 text-xs no-print flex-shrink-0 animate-pulse-once">
          <span className="text-base leading-none">📌</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold truncate block">{pendingRecipe.name}</span>
            <span className="opacity-75 hidden sm:block">
              Cliquez sur un {MEAL_LABELS[pendingRecipe.mealType]?.toLowerCase()} pour placer
            </span>
          </div>
          <button
            onClick={() => setPendingRecipe(null)}
            className="text-white/60 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
            ✕ Annuler
          </button>
        </div>
      )}

      {/* ── DESKTOP: three-panel layout (md and above) ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left: Recipe browser */}
        <div className="w-64 lg:w-72 flex-shrink-0 border-r border-apple-gray-2 bg-white overflow-hidden flex flex-col">
          {browserPanel}
        </div>

        {/* Center: Calendar */}
        <div className="flex-1 overflow-auto bg-apple-gray">
          {calendarPanel}
        </div>

        {/* Right: Recipe details */}
        <div className="w-72 lg:w-80 flex-shrink-0 border-l border-apple-gray-2 bg-white overflow-hidden flex flex-col">
          {detailsPanel}
        </div>
      </div>

      {/* ── MOBILE: tabbed layout (below md) ─────── */}
      <div className="flex md:hidden flex-1 overflow-hidden flex-col">
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'browser' && (
            <div className="h-full bg-white overflow-hidden flex flex-col">
              {browserPanel}
            </div>
          )}
          {activeTab === 'calendar' && (
            <div className="h-full overflow-auto bg-apple-gray">
              {calendarPanel}
            </div>
          )}
          {activeTab === 'details' && (
            <div className="h-full bg-white overflow-hidden flex flex-col">
              {detailsPanel}
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="border-t border-apple-gray-2 bg-white flex flex-shrink-0 safe-area-pb">
          {[
            { id: 'browser', label: 'Recettes', icon: '📚' },
            { id: 'calendar', label: 'Calendrier', icon: '📅' },
            { id: 'details', label: 'Détails', icon: '📋' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-colors relative ${
                activeTab === tab.id ? 'text-apple-blue' : 'text-apple-secondary'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
              {/* Dot indicator for pending recipe on calendar tab */}
              {tab.id === 'calendar' && pendingRecipe && (
                <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-apple-blue border-2 border-white" />
              )}
              {/* Active underline */}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-apple-blue rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
