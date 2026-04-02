import { useState, useEffect } from 'react'
import RecipeBrowser from './RecipeBrowser'
import MealCalendar from './MealCalendar'
import RecipeDetails from './RecipeDetails'
import RecipePickerSheet from './RecipePickerSheet'
import AddRecipeModal from './AddRecipeModal'

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
  onDeleteRecipe,
  onNext,
  onBack,
}) {
  // Desktop: pending recipe for click-to-place
  const [pendingRecipe, setPendingRecipe] = useState(null)
  // Mobile tab
  const [activeTab, setActiveTab] = useState('calendar')
  // Mobile: bottom sheet picker slot
  const [pickerSlot, setPickerSlot] = useState(null) // { dayIndex, mealType, dayLabel }
  // Mobile: add recipe modal (opened from within picker sheet)
  const [addModalMealType, setAddModalMealType] = useState(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setPendingRecipe(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Desktop: recipe browser click
  function handleSelectRecipe(recipe) {
    onSelectRecipe(recipe)
    if (pendingRecipe?.id === recipe.id) {
      setPendingRecipe(null)
    } else {
      setPendingRecipe(recipe)
      setActiveTab('calendar')
    }
  }

  function handleSetPendingFromDetails(recipe) {
    setPendingRecipe(recipe)
    setActiveTab('calendar')
  }

  // Desktop: calendar cell click
  function handleCellClick(dayIndex, mealType) {
    if (pendingRecipe && pendingRecipe.mealType === mealType) {
      onPlaceRecipe(dayIndex, mealType, pendingRecipe)
      setPendingRecipe(null)
      setActiveTab('browser')
    }
  }

  // Mobile: tap a meal slot → open bottom sheet picker
  function handleSlotTap(dayIndex, mealType) {
    const date = new Date(campSetup.startDate)
    date.setDate(date.getDate() + dayIndex)
    const dayLabel = date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })
    setPickerSlot({ dayIndex, mealType, dayLabel })
  }

  // Bottom sheet: add recipes to slot
  function handlePickerAdd(recipesToAdd) {
    if (!pickerSlot) return
    const { dayIndex, mealType } = pickerSlot
    for (const recipe of recipesToAdd) {
      onPlaceRecipe(dayIndex, mealType, recipe)
    }
    setPickerSlot(null)
  }

  function handleViewPlacedRecipe(recipe) {
    onSelectRecipe(recipe)
    setActiveTab('details')
  }

  const filledCount = Object.values(mealPlan).reduce(
    (total, day) => total + Object.values(day).filter(arr => Array.isArray(arr) ? arr.length > 0 : Boolean(arr)).length,
    0
  )
  const totalSlots = campSetup.numDays * 4
  const progress = totalSlots > 0 ? Math.round((filledCount / totalSlots) * 100) : 0

  const calendarPanel = (
    <MealCalendar
      campSetup={campSetup}
      mealPlan={mealPlan}
      pendingRecipe={pendingRecipe}
      onCellClick={handleCellClick}
      onSlotTap={handleSlotTap}
      onRemoveRecipe={onRemoveRecipe}
      onViewRecipe={handleViewPlacedRecipe}
    />
  )

  const browserPanel = (
    <RecipeBrowser
      recipes={recipes}
      pendingRecipe={pendingRecipe}
      viewedRecipe={selectedRecipe}
      onSelectRecipe={handleSelectRecipe}
      onAddRecipe={onAddRecipe}
      onEditRecipe={onEditRecipe}
      onDeleteRecipe={onDeleteRecipe}
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

      {/* ── DESKTOP toolbar ─────────────────────────────── */}
      <div className="hidden md:flex bg-white border-b border-apple-gray-2 px-4 py-2 items-center gap-2 no-print flex-shrink-0">
        <button onClick={onBack} className="btn-ghost text-apple-secondary text-xs">← Retour</button>
        <div className="flex-1" />
        <div className="text-xs text-apple-secondary">
          <span className="font-semibold text-apple-dark">{filledCount}</span>/{totalSlots}
        </div>
        <button onClick={onNext} className="btn-primary text-xs py-2 px-4">Exporter →</button>
      </div>

      {/* Desktop: pending recipe banner */}
      {pendingRecipe && (
        <div className="hidden md:flex bg-apple-blue text-white px-4 py-2 items-center gap-3 text-xs no-print flex-shrink-0">
          <span className="text-base">📌</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold truncate block">{pendingRecipe.name}</span>
            <span className="opacity-75">Cliquez sur un {MEAL_LABELS[pendingRecipe.mealType]?.toLowerCase()} pour placer</span>
          </div>
          <button onClick={() => setPendingRecipe(null)} className="text-white/60 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10">✕ Annuler</button>
        </div>
      )}

      {/* ── DESKTOP: three-panel layout ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-64 lg:w-72 flex-shrink-0 border-r border-apple-gray-2 bg-white overflow-hidden flex flex-col">
          {browserPanel}
        </div>
        <div className="flex-1 overflow-auto bg-apple-gray">{calendarPanel}</div>
        <div className="w-72 lg:w-80 flex-shrink-0 border-l border-apple-gray-2 bg-white overflow-hidden flex flex-col">
          {detailsPanel}
        </div>
      </div>

      {/* ── MOBILE layout ─────────────────────────────── */}
      <div className="flex md:hidden flex-1 overflow-hidden flex-col" style={{ background: '#F2F2F7' }}>

        {/* Mobile header bar */}
        <div style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', fontSize: 15, fontWeight: 500, padding: '4px 0' }}
          >← Retour</button>
          <div style={{ flex: 1 }} />
          {/* Progress pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 60, height: 5, borderRadius: 3, background: '#E5E5EA', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#007AFF', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 12, color: '#636366', fontWeight: 600 }}>{filledCount}/{totalSlots}</span>
          </div>
          <button
            onClick={onNext}
            style={{
              background: '#007AFF', color: '#fff', border: 'none', cursor: 'pointer',
              padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            }}
          >Exporter →</button>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'calendar' && (
            <div style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {calendarPanel}
            </div>
          )}
          {activeTab === 'browser' && (
            <div style={{ height: '100%', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {browserPanel}
            </div>
          )}
          {activeTab === 'details' && (
            <div style={{ height: '100%', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {detailsPanel}
            </div>
          )}
        </div>

        {/* iOS-style bottom tab bar */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexShrink: 0,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {[
            { id: 'calendar', label: 'Calendrier', icon: (active) => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="3" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8"/>
                <path d="M3 9h18" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8"/>
                <path d="M8 2v4M16 2v4" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round"/>
                {active && <rect x="7" y="13" width="4" height="4" rx="1" fill="#007AFF"/>}
              </svg>
            )},
            { id: 'browser', label: 'Recettes', icon: (active) => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 10h16M4 14h10" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round"/>
                {active
                  ? <circle cx="17" cy="17" r="4" fill="#007AFF"/>
                  : <circle cx="17" cy="17" r="3" stroke="#8E8E93" strokeWidth="1.8"/>}
                {active && <path d="M20.5 20.5l2 2" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round"/>}
              </svg>
            )},
            { id: 'details', label: 'Détails', icon: (active) => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8"/>
                <path d="M12 8v4M12 16v.5" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )},
          ].map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, border: 'none', background: 'none', cursor: 'pointer',
                  padding: '10px 0 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                {tab.icon(active)}
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? '#007AFF' : '#8E8E93',
                  letterSpacing: '-0.01em',
                }}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile: RecipePickerSheet */}
      {pickerSlot && (
        <RecipePickerSheet
          recipes={recipes}
          dayLabel={pickerSlot.dayLabel}
          mealType={pickerSlot.mealType}
          existingRecipes={mealPlan[pickerSlot.dayIndex]?.[pickerSlot.mealType] ?? []}
          onAdd={handlePickerAdd}
          onClose={() => setPickerSlot(null)}
          onCreateRecipe={(mealType) => setAddModalMealType(mealType)}
        />
      )}

      {/* Mobile: Add recipe modal (from within picker) */}
      {addModalMealType && (
        <AddRecipeModal
          defaultMealType={addModalMealType}
          onSave={recipe => {
            onAddRecipe(recipe)
            setAddModalMealType(null)
          }}
          onClose={() => setAddModalMealType(null)}
        />
      )}
    </div>
  )
}
