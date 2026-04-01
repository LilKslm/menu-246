import { useState, useEffect, useCallback } from 'react'
import { loadRecipes, loadCustomRecipes, loadImportedRecipes, saveCustomRecipe, updateCustomRecipe } from './utils/excelLoader'
import CampSetup from './components/CampSetup'
import MealPlanner from './components/MealPlanner'
import OutputGenerator from './components/OutputGenerator'
import RecipeManagement from './pages/RecipeManagement'
import './App.css'

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

export default function App() {
  const [step, setStep] = useState(STEPS.SETUP)
  const [recipes, setRecipes] = useState(null)
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

  useEffect(() => {
    setRecipesLoading(true)
    loadRecipes()
      .then(base => {
        const withCustom = loadCustomRecipes(base)
        const merged = loadImportedRecipes(withCustom)
        setRecipes(merged)
      })
      .catch(err => {
        console.error('Failed to load recipes:', err)
        setRecipesError(err.message)
      })
      .finally(() => setRecipesLoading(false))
  }, [])

  function handleCampSetupComplete(setup) {
    setCampSetup(prev => {
      if (prev.numDays !== setup.numDays) {
        setMealPlan(createEmptyMealPlan(setup.numDays))
      }
      return setup
    })
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

  function handleAddRecipe(newRecipe) {
    saveCustomRecipe(newRecipe)
    setRecipes(prev => {
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
    if (originalRecipe.isCustom) {
      // Update the custom recipe in localStorage and state
      updateCustomRecipe(editedRecipe)
      setRecipes(prev => {
        if (!prev) return prev
        const updated = { ...prev }
        // Remove from old mealType if it changed
        if (originalRecipe.mealType !== editedRecipe.mealType) {
          updated[originalRecipe.mealType] = prev[originalRecipe.mealType].filter(
            r => r.id !== originalRecipe.id
          )
        }
        // Add/update in new mealType
        const existingList = updated[editedRecipe.mealType] || []
        const withoutOld = existingList.filter(r => r.id !== editedRecipe.id)
        updated[editedRecipe.mealType] = [...withoutOld, editedRecipe].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr')
        )
        return updated
      })
    } else {
      // Fork an Excel recipe as a new custom recipe
      handleAddRecipe(editedRecipe)
    }
  }

  function handleRecipesChanged() {
    loadRecipes()
      .then(base => {
        const withCustom = loadCustomRecipes(base)
        const merged = loadImportedRecipes(withCustom)
        setRecipes(merged)
      })
      .catch(console.error)
  }

  const stepLabels = ['Configuration', 'Planification', 'Exportation']

  return (
    <div className="min-h-screen bg-apple-gray font-sans flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-apple-gray-2 sticky top-0 z-50 no-print">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/app-logo.jpg" alt="Menu 246" className="w-9 h-9 object-cover rounded-xl flex-shrink-0" />
            <div>
              <h1 className="text-sm font-bold text-apple-dark leading-tight">Menu 246</h1>
              {campSetup.campName && (
                <p className="text-xs text-apple-secondary leading-none">{campSetup.campName}</p>
              )}
            </div>
          </div>

          {/* Step indicator — hidden on small mobile */}
          <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
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

          {/* Camp info chips + recipe mgmt */}
          <div className="ml-auto flex items-center gap-2">
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
          onClose={() => setShowRecipeMgmt(false)}
          onRecipesChanged={() => { handleRecipesChanged(); setShowRecipeMgmt(false) }}
        />
      )}
    </div>
  )
}
