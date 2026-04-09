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
import './App.css'

const SESSION_KEY = 'scout_session_v1'

export const STEPS = { SETUP: 0, PLAN: 1, OUTPUT: 2 }

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
export const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
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
    setCampSetup(pendingSession.campSetup)
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
    setCampSetup(importedCampSetup)
    setMealPlan(importedMealPlan)
    setStep(STEPS.PLAN)
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        version: 1, campSetup: importedCampSetup, mealPlan: importedMealPlan, savedAt: new Date().toISOString(),
      }))
    } catch {}
  }

  function handleClearProgress() {
    localStorage.removeItem(SESSION_KEY)
    setCampSetup({ campName: '', startDate: '', endDate: '', numPeople: 10, numDays: 0 })
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
    if (campSetup.numDays !== setup.numDays) {
      setMealPlan(createEmptyMealPlan(setup.numDays))
    }
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
        [newRecipe.mealType]: [...prev[newRecipe.mealType], newRecipe].sort((a, b) =>
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
      for (const mt of ['breakfast', 'lunch', 'dinner', 'snack']) {
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

  return (
    <div className="min-h-screen bg-apple-gray font-sans flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-apple-gray-2 sticky top-0 z-50 no-print">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-3 flex items-center relative" style={{ paddingLeft: '20px' }}>
          <button
            onClick={() => step > STEPS.SETUP && setStep(STEPS.SETUP)}
            className={`flex items-center gap-2.5 ${step > STEPS.SETUP ? 'cursor-pointer hover:opacity-80 active:opacity-60' : 'cursor-default'} transition-opacity`}
          >
            <img src={appLogoUrl} alt="Menu 246" className="w-9 h-9 object-cover rounded-xl flex-shrink-0" />
            <div className="text-left">
              <h1 className="text-sm font-bold text-apple-dark leading-tight">Menu 246</h1>
              {campSetup.campName && (
                <p className="text-xs text-apple-secondary leading-none">{campSetup.campName}</p>
              )}
            </div>
          </button>

          {/* Step indicator — absolutely centered relative to header */}
          <nav className="hidden sm:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {stepLabels.map((label, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {idx > 0 && (
                  <div className={`w-6 h-px ${idx <= step ? 'bg-apple-blue' : 'bg-apple-gray-3'}`} />
                )}
                <button
                  onClick={() => { if (idx < step) setStep(idx) }}
                  disabled={idx > step}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    idx === step
                      ? 'bg-apple-blue text-white'
                      : idx < step
                      ? 'text-apple-blue hover:bg-apple-gray cursor-pointer'
                      : 'text-apple-gray-3 cursor-default'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${idx < step ? 'bg-apple-blue text-white' : ''}`}>
                    {idx < step ? '✓' : idx + 1}
                  </span>
                  <span className="hidden md:inline">{label}</span>
                </button>
              </div>
            ))}
          </nav>

          {/* Camp info chips + recipe mgmt + save */}
          <div className="ml-auto flex items-center gap-2 relative z-10">
            {step >= STEPS.PLAN && (
              <>
                <span className="badge bg-apple-gray text-apple-dark hidden sm:inline-flex">
                  {campSetup.numDays}j
                </span>
                <span className="badge bg-apple-gray text-apple-dark hidden sm:inline-flex">
                  {campSetup.numPeople} pers.
                </span>
              </>
            )}
            <button
              onClick={() => setShowRecipeMgmt(true)}
              className="btn-ghost text-xs text-apple-secondary gap-1 flex"
              title="Gérer les recettes"
            >
              📚 <span className="hidden sm:inline">Recettes</span>
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
      <main className="flex-1 flex flex-col overflow-hidden">
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
