import { useState, useEffect } from 'react'
import { parseLocalDate } from '../utils/calculations'
import RecipeBrowser from './RecipeBrowser'
import MealCalendar from './MealCalendar'
import RecipeDetails from './RecipeDetails'
import RecipePickerSheet from './RecipePickerSheet'
import AddRecipeModal from './AddRecipeModal'
import DesktopPlanner from './DesktopPlanner'
import Signature from './Signature'

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
  onDeleteLocal,
  onNext,
  onBack,
}) {
  // ── Responsive: detect desktop vs mobile ──────────────────
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768
  )

  // All hooks must be declared before any conditional return (Rules of Hooks)
  const [activeTab, setActiveTab] = useState('calendar')
  const [pickerSlot, setPickerSlot] = useState(null)
  const [addModalMealType, setAddModalMealType] = useState(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = e => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setAddModalMealType(null)
        setPickerSlot(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── DESKTOP: delegate entirely to DesktopPlanner ──────────
  if (isDesktop) {
    return (
      <DesktopPlanner
        recipes={recipes}
        campSetup={campSetup}
        mealPlan={mealPlan}
        onPlaceRecipe={onPlaceRecipe}
        onRemoveRecipe={onRemoveRecipe}
        onAddRecipe={onAddRecipe}
        onDeleteLocal={onDeleteLocal}
        onBack={onBack}
        onNext={onNext}
      />
    )
  }

  // ── MOBILE layout ──────────────────────────────────────────

  function handleSlotTap(dayIndex, mealType) {
    const date = parseLocalDate(campSetup.startDate)
    date.setDate(date.getDate() + dayIndex)
    const dayLabel = date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })
    setPickerSlot({ dayIndex, mealType, dayLabel })
  }

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
      pendingRecipe={null}
      onCellClick={() => {}}
      onSlotTap={handleSlotTap}
      onRemoveRecipe={onRemoveRecipe}
      onViewRecipe={handleViewPlacedRecipe}
    />
  )

  const browserPanel = (
    <RecipeBrowser
      recipes={recipes}
      pendingRecipe={null}
      viewedRecipe={selectedRecipe}
      onSelectRecipe={onSelectRecipe}
      onAddRecipe={onAddRecipe}
      onEditRecipe={onEditRecipe}
      onDeleteRecipe={onDeleteRecipe}
      onDeleteLocal={onDeleteLocal}
    />
  )

  const detailsPanel = (
    <RecipeDetails
      recipe={selectedRecipe}
      numPeople={campSetup.numPeople}
      pendingRecipe={null}
      onSetPending={() => {}}
      onEditRecipe={onEditRecipe}
      onDeleteLocal={onDeleteLocal}
    />
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Mobile layout */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#F2F2F7' }}>

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

        <Signature />

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

      {/* Mobile: Add recipe modal */}
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
