import { useState, useRef } from 'react'
import {
  exportRecipesAsJSON,
  exportRecipesAsCSV,
  saveImportedRecipes,
  deleteCustomRecipe,
} from '../utils/excelLoader'

const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export default function RecipeManagement({ recipes, onClose, onRecipesChanged }) {
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)
  const fileInputRef = useRef(null)

  const customAndImported = MEAL_TYPES.flatMap(mt =>
    (recipes[mt] || []).filter(r => r.isCustom || r.isImported).map(r => ({ ...r, mealTypeKey: mt }))
  )

  function handleExportJSON() {
    const json = exportRecipesAsJSON(recipes)
    downloadBlob(json, 'scout-recettes.json', 'application/json')
  }

  function handleExportCSV() {
    const csv = exportRecipesAsCSV(recipes)
    downloadBlob(csv, 'scout-recettes.csv', 'text/csv;charset=utf-8')
  }

  function handleImportJSON(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result)
        // Validate structure
        const validKeys = ['breakfast', 'lunch', 'dinner', 'snack']
        const hasValidStructure = validKeys.some(k => Array.isArray(data[k]))
        if (!hasValidStructure) {
          setImportError('Fichier invalide. Doit contenir des recettes dans au moins une catégorie (breakfast, lunch, dinner, snack).')
          return
        }
        // Count recipes
        const count = validKeys.reduce((n, k) => n + (data[k]?.length || 0), 0)
        saveImportedRecipes(data)
        onRecipesChanged()
        setImportSuccess(`${count} recette${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''} avec succès.`)
      } catch {
        setImportError('Erreur de lecture du fichier JSON.')
      }
      // Reset input so same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleDeleteRecipe(recipe) {
    if (!confirm(`Supprimer "${recipe.name}" ?`)) return
    deleteCustomRecipe(recipe.id)
    onRecipesChanged()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-apple-gray-2 bg-white flex-shrink-0">
          <span className="text-lg">📚</span>
          <div className="flex-1">
            <h2 className="font-bold text-apple-dark text-base">Gestion des recettes</h2>
            <p className="text-xs text-apple-secondary">Exporter, importer et gérer vos recettes personnalisées</p>
          </div>
          <button onClick={onClose} className="btn-icon text-apple-secondary">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Export section */}
          <div className="card space-y-3">
            <h3 className="font-bold text-apple-dark text-sm">Exporter les recettes</h3>
            <p className="text-xs text-apple-secondary">
              Exporte uniquement vos recettes personnalisées et importées (pas les recettes Excel de base).
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportJSON}
                disabled={customAndImported.length === 0}
                className="btn-primary flex-1 text-sm py-2"
              >
                ⬇ JSON
              </button>
              <button
                onClick={handleExportCSV}
                disabled={customAndImported.length === 0}
                className="btn-secondary flex-1 text-sm py-2"
              >
                ⬇ CSV
              </button>
            </div>
            {customAndImported.length === 0 && (
              <p className="text-xs text-apple-secondary italic">Aucune recette personnalisée à exporter.</p>
            )}
          </div>

          {/* Import section */}
          <div className="card space-y-3">
            <h3 className="font-bold text-apple-dark text-sm">Importer des recettes</h3>
            <p className="text-xs text-apple-secondary">
              Importe un fichier JSON exporté précédemment. Les recettes existantes ne seront pas dupliquées.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
              id="recipe-import-input"
            />
            <label
              htmlFor="recipe-import-input"
              className="btn-secondary w-full text-sm py-2 cursor-pointer flex items-center justify-center gap-2"
            >
              📂 Choisir un fichier JSON…
            </label>
            {importError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">{importError}</div>
            )}
            {importSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">{importSuccess}</div>
            )}
          </div>

          {/* Recipe list */}
          {customAndImported.length > 0 && (
            <div className="card space-y-2">
              <h3 className="font-bold text-apple-dark text-sm">
                Recettes personnalisées ({customAndImported.length})
              </h3>
              <div className="space-y-1">
                {customAndImported.map(recipe => (
                  <div key={recipe.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-apple-gray transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-apple-dark truncate">{recipe.name}</p>
                      <p className="text-xs text-apple-secondary">
                        {MEAL_LABELS[recipe.mealTypeKey]} · {recipe.ingredients.length} ingr.
                        {recipe.isImported && <span className="ml-1 text-blue-500">· Importée</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRecipe(recipe)}
                      className="opacity-0 group-hover:opacity-100 btn-icon text-red-400 hover:text-red-600 flex-shrink-0"
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
