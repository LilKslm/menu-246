import { useState, useEffect, useCallback } from 'react'
import { loadRecipes, loadCustomRecipes, loadImportedRecipes, saveCustomRecipe, updateCustomRecipe, deleteCustomRecipe as deleteCustomRecipeLocal } from './utils/excelLoader'
import { subscribeToSharedRecipes, saveSharedRecipe, deleteSharedRecipe } from './utils/firebase'
import CampSetup from './components/CampSetup'
import MealPlanner from './components/MealPlanner'
import OutputGenerator from './components/OutputGenerator'
import RecipeManagement from './pages/RecipeManagement'
import ResumePrompt from './components/ResumePrompt'
import SaveMenuButton from './components/SaveMenuButton'
import UpdateNotification from './components/UpdateNotification'
import FeedbackButton from './components/FeedbackButton'
import appLogoUrl from './assets/app-logo.jpg'
import { I } from './shared/icons.jsx'
import { MEAL_TYPES } from './shared/meals'
import './App.css'

const SESSION_KEY = 'scout_session_v1'

const STEPS = { SETUP: 0, PLAN: 1, OUTPUT: 2 }

// Ensure a campSetup loaded from an older session/import has the per-day field.
function normalizeCampSetup(setup) {
  return { numPeopleByDay: {}, ...setup }
}

function createEmptyMealPlan(numDays) {
  const plan = {}
  for (let i = 0; i < numDays; i++) {
    plan[i] = { breakfast: [], lunch: [], dinner: [], snack: [] }
  }
  return plan
}

// Merge shared Firebase recipes into the base recipe list
function mergeSharedRecipes(base, sharedRecipes) {
  if (!base || !sharedRecipes.length) return base
  const result = { ...base }
  for (const r of sharedRecipes) {
    if (!r.mealType || !result[r.mealType]) continue
    // Skip if already present (same id)
    if (result[r.mealType].some(existing => existing.id === r.id)) continue
    result[r.mealType] = [...result[r.mealType], r].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr')
    )
  }
  return result
}

export default function App() {
  const [step, setStep] = useState(STEPS.SETUP)
  const [baseRecipes, setBaseRecipes] = useState(null) // Excel + custom + imported
  const [sharedRecipes, setSharedRecipes] = useState([]) // Firebase shared
  const [recipes, setRecipes] = useState(null) // merged
  const [recipesError, setRecipesError] = useState(null)
  const [recipesLoading, setRecipesLoading] = useState(true)

  const [campSetup, setCampSetup] = useState({
    campName: '',
    startDate: '',
    endDate: '',
    numPeople: 10,
    numDays: 0,
    numPeopleByDay: {},
  })

  const [mealPlan, setMealPlan] = useState({})
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showRecipeMgmt, setShowRecipeMgmt] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [pendingSession, setPendingSession] = useState(null)
  // IDs hidden from THIS device only (persisted in localStorage)
  const [hiddenIds, setHiddenIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiddenRecipeIds') || '[]') } catch { return [] }
  })

  // Check for saved session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s?.campSetup && s?.mealPlan) {
        setPendingSession(s)
        setShowResume(true)
      }
    } catch {}
  }, [])

  // Auto-save: debounced 500ms after any change to mealPlan or campSetup
  useEffect(() => {
    if (step === STEPS.SETUP) return
    const id = setTimeout(() => {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          version: 1, campSetup, mealPlan, savedAt: new Date().toISOString(),
        }))
      } catch {}
    }, 500)
    return () => clearTimeout(id)
  }, [step, campSetup, mealPlan])

  function handleResume() {
    if (!pendingSession) return
    setCampSetup(normalizeCampSetup(pendingSession.campSetup))
    setMealPlan(pendingSession.mealPlan)
    setStep(STEPS.PLAN)
    setShowResume(false)
    setPendingSession(null)
  }

  function handleDiscardSession() {
    localStorage.removeItem(SESSION_KEY)
    setShowResume(false)
    setPendingSession(null)
  }

  function handleImportMenu(importedCampSetup, importedMealPlan) {
    const normalized = normalizeCampSetup(importedCampSetup)
    setCampSetup(normalized)
    setMealPlan(importedMealPlan)
    setStep(STEPS.PLAN)
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        version: 1, campSetup: normalized, mealPlan: importedMealPlan, savedAt: new Date().toISOString(),
      }))
    } catch {}
  }

  function handleClearProgress() {
    localStorage.removeItem(SESSION_KEY)
    setCampSetup({ campName: '', startDate: '', endDate: '', numPeople: 10, numDays: 0, numPeopleByDay: {} })
    setMealPlan({})
    setStep(STEPS.SETUP)
  }

  // Load base recipes (Excel + localStorage)
  useEffect(() => {
    setRecipesLoading(true)
    loadRecipes()
      .then(base => {
        const withCustom = loadCustomRecipes(base)
        const merged = loadImportedRecipes(withCustom)
        setBaseRecipes(merged)
      })
      .catch(err => {
        console.error('Failed to load recipes:', err)
        setRecipesError(err.message)
      })
      .finally(() => setRecipesLoading(false))
  }, [])

  // Subscribe to Firebase shared recipes (real-time)
  useEffect(() => {
    const unsub = subscribeToSharedRecipes(setSharedRecipes)
    return unsub
  }, [])

  // Merge base + shared, then filter hidden IDs for this device
  useEffect(() => {
    if (!baseRecipes) return
    const merged = mergeSharedRecipes(baseRecipes, sharedRecipes)
    if (!hiddenIds.length) { setRecipes(merged); return }
    const filtered = {}
    for (const mt of MEAL_TYPES) {
      filtered[mt] = (merged[mt] || []).filter(r => !hiddenIds.includes(r.id))
    }
    setRecipes(filtered)
  }, [baseRecipes, sharedRecipes, hiddenIds])

  function handleCampSetupComplete(setup) {
    // Reset the plan whenever the day count changes (functional updater avoids stale state)
    setMealPlan(prev =>
      Object.keys(prev).length !== setup.numDays ? createEmptyMealPlan(setup.numDays) : prev
    )
    setCampSetup(setup)
    setStep(STEPS.PLAN)
  }

  const handlePlaceRecipe = useCallback((dayIndex, mealType, recipe) => {
    setMealPlan(prev => {
      const existing = prev[dayIndex]?.[mealType] ?? []
      if (existing.some(r => r.id === recipe.id)) return prev
      return {
        ...prev,
        [dayIndex]: { ...prev[dayIndex], [mealType]: [...existing, recipe] },
      }
    })
  }, [])

  const handleRemoveRecipe = useCallback((dayIndex, mealType, recipeId) => {
    setMealPlan(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [mealType]: (prev[dayIndex]?.[mealType] ?? []).filter(r => r.id !== recipeId),
      },
    }))
  }, [])

  // Add recipe: save locally + push to Firebase shared database
  function handleAddRecipe(newRecipe) {
    saveCustomRecipe(newRecipe)
    saveSharedRecipe({ ...newRecipe, isShared: true }).catch(console.error)
    setBaseRecipes(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [newRecipe.mealType]: [...(prev[newRecipe.mealType] || []), newRecipe].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr')
        ),
      }
    })
  }

  function handleEditRecipe(originalRecipe, editedRecipe) {
    if (originalRecipe.isCustom || originalRecipe.isShared) {
      updateCustomRecipe(editedRecipe)
      saveSharedRecipe({ ...editedRecipe, isShared: true }).catch(console.error)
      setBaseRecipes(prev => {
        if (!prev) return prev
        const updated = { ...prev }
        if (originalRecipe.mealType !== editedRecipe.mealType) {
          updated[originalRecipe.mealType] = prev[originalRecipe.mealType].filter(
            r => r.id !== originalRecipe.id
          )
        }
        const existingList = updated[editedRecipe.mealType] || []
        const withoutOld = existingList.filter(r => r.id !== editedRecipe.id)
        updated[editedRecipe.mealType] = [...withoutOld, editedRecipe].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr')
        )
        return updated
      })
    } else {
      handleAddRecipe(editedRecipe)
    }
  }

  function handleDeleteSharedRecipe(recipeId) {
    deleteSharedRecipe(recipeId).catch(console.error)
  }

  // Hide recipe on THIS device only — doesn't affect other users or Firebase
  function handleDeleteLocal(recipe) {
    if (recipe.isCustom) deleteCustomRecipeLocal(recipe.id)
    const newHidden = [...hiddenIds, recipe.id]
    setHiddenIds(newHidden)
    localStorage.setItem('hiddenRecipeIds', JSON.stringify(newHidden))
    // Also clear from selectedRecipe if it's the one being hidden
    if (selectedRecipe?.id === recipe.id) setSelectedRecipe(null)
  }

  // Delete from the recipe browser sidebar (custom or shared recipes)
  function handleDeleteRecipe(recipe) {
    if (!confirm(`Supprimer "${recipe.name}" ?`)) return
    if (recipe.isCustom) deleteCustomRecipeLocal(recipe.id)
    deleteSharedRecipe(recipe.id).catch(() => {})
    setBaseRecipes(prev => {
      if (!prev) return prev
      const updated = { ...prev }
      for (const mt of MEAL_TYPES) {
        updated[mt] = (prev[mt] || []).filter(r => r.id !== recipe.id)
      }
      return updated
    })
  }

  function handleRecipesChanged() {
    loadRecipes()
      .then(base => {
        const withCustom = loadCustomRecipes(base)
        const merged = loadImportedRecipes(withCustom)
        setBaseRecipes(merged)
      })
      .catch(console.error)
  }

  const stepLabels = ['Configuration', 'Planification', 'Exportation']

  const hasOverrides = Object.values(campSetup.numPeopleByDay || {}).some(n => n != null && n !== campSetup.numPeople)

  return (
    <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top navigation bar */}
      <header className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'oklch(0.99 0.004 75 / 0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--hairline)',
      }}>
        <div style={{ maxWidth: 1536, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', position: 'relative' }}>
          <button
            onClick={() => step > STEPS.SETUP && setStep(STEPS.SETUP)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', border: 'none', background: 'transparent', padding: 0, cursor: step > STEPS.SETUP ? 'pointer' : 'default' }}
          >
            <img src={appLogoUrl} alt="Menu 246" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--r-md)', flexShrink: 0, boxShadow: 'var(--shadow-1)' }} />
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Menu 246</div>
              {campSetup.campName && <div className="t-caption tx-3">{campSetup.campName}</div>}
            </div>
          </button>

          {/* Step indicator — centered */}
          <nav className="steps hide-sm" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {stepLabels.map((label, idx) => {
              const cls = idx < step ? 'is-done' : idx === step ? 'is-active' : ''
              return (
                <div
                  key={label}
                  className={`step ${cls}`}
                  onClick={() => { if (idx < step) setStep(idx) }}
                  style={{ cursor: idx < step ? 'pointer' : 'default' }}
                >
                  <span className="step-num">{idx < step ? '✓' : idx + 1}</span>
                  <span className="hide-sm">{label}</span>
                </div>
              )
            })}
          </nav>

          {/* Camp info chips + recipe mgmt + save */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', position: 'relative', zIndex: 10 }}>
            {step >= STEPS.PLAN && (
              <>
                <div className="chip chip-strong hide-sm">
                  <span style={{ fontWeight: 'var(--fw-semibold)', fontVariantNumeric: 'tabular-nums' }}>{campSetup.numDays}</span>
                  <span className="tx-3">j</span>
                </div>
                <div className="chip chip-strong hide-sm">
                  <span style={{ fontWeight: 'var(--fw-semibold)', fontVariantNumeric: 'tabular-nums' }}>{campSetup.numPeople}</span>
                  <span className="tx-3">pers.{hasOverrides ? '*' : ''}</span>
                </div>
              </>
            )}
            <button onClick={() => setShowRecipeMgmt(true)} className="btn btn-secondary btn-sm" title="Gérer les recettes">
              <I.Book size={16} />
              <span className="hide-sm">Recettes</span>
            </button>
            <FeedbackButton />
            {step >= STEPS.PLAN && (
              <SaveMenuButton
                campSetup={campSetup}
                mealPlan={mealPlan}
                onImport={handleImportMenu}
                onClear={handleClearProgress}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {step === STEPS.SETUP && (
          <CampSetup
            initial={campSetup}
            onComplete={handleCampSetupComplete}
            recipesLoading={recipesLoading}
            recipesError={recipesError}
          />
        )}

        {step === STEPS.PLAN && recipes && (
          <MealPlanner
            recipes={recipes}
            campSetup={campSetup}
            mealPlan={mealPlan}
            selectedRecipe={selectedRecipe}
            onSelectRecipe={setSelectedRecipe}
            onPlaceRecipe={handlePlaceRecipe}
            onRemoveRecipe={handleRemoveRecipe}
            onAddRecipe={handleAddRecipe}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onDeleteLocal={handleDeleteLocal}
            onNext={() => setStep(STEPS.OUTPUT)}
            onBack={() => setStep(STEPS.SETUP)}
          />
        )}

        {step === STEPS.OUTPUT && (
          <OutputGenerator
            campSetup={campSetup}
            mealPlan={mealPlan}
            onBack={() => setStep(STEPS.PLAN)}
          />
        )}
      </main>

      {/* Recipe Management overlay */}
      {showRecipeMgmt && recipes && (
        <RecipeManagement
          recipes={recipes}
          sharedRecipes={sharedRecipes}
          onClose={() => setShowRecipeMgmt(false)}
          onDeleteSharedRecipe={handleDeleteSharedRecipe}
          onRecipesChanged={() => { handleRecipesChanged(); setShowRecipeMgmt(false) }}
        />
      )}

      {/* Resume prompt */}
      {showResume && pendingSession && (
        <ResumePrompt
          session={pendingSession}
          onResume={handleResume}
          onDiscard={handleDiscardSession}
        />
      )}

      {/* Auto-update notification (Electron only) */}
      <UpdateNotification />
    </div>
  )
}
