import { useState, useRef } from 'react'
import {
  exportRecipesAsJSON,
  exportRecipesAsCSV,
  saveImportedRecipes,
  deleteCustomRecipe,
  saveCustomRecipe,
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

export default function RecipeManagement({
  recipes,
  sharedRecipes = [],
  onClose,
  onRecipesChanged,
  onDeleteSharedRecipe,
  onSaveSharedLocally,
}) {
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('shared') // 'shared' | 'local'
  const fileInputRef = useRef(null)

  const localRecipes = MEAL_TYPES.flatMap(mt =>
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
        const validKeys = ['breakfast', 'lunch', 'dinner', 'snack']
        const hasValidStructure = validKeys.some(k => Array.isArray(data[k]))
        if (!hasValidStructure) {
          setImportError('Fichier invalide. Doit contenir des recettes dans au moins une catégorie.')
          return
        }
        const count = validKeys.reduce((n, k) => n + (data[k]?.length || 0), 0)
        saveImportedRecipes(data)
        onRecipesChanged()
        setImportSuccess(`${count} recette${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''} avec succès.`)
      } catch {
        setImportError('Erreur de lecture du fichier JSON.')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleDeleteLocal(recipe) {
    if (!confirm(`Supprimer "${recipe.name}" ?`)) return
    deleteCustomRecipe(recipe.id)
    onRecipesChanged()
  }

  function handleDeleteShared(recipe) {
    if (!confirm(`Supprimer "${recipe.name}" pour tout le monde ?`)) return
    onDeleteSharedRecipe(recipe.id)
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
            <p className="text-xs text-apple-secondary">Base de données partagée via Firebase</p>
          </div>
          <button onClick={onClose} className="btn-icon text-apple-secondary">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-apple-gray-2 flex-shrink-0">
          {[
            { id: 'shared', label: `🌐 Partagées (${sharedRecipes.length})` },
            { id: 'local', label: `💾 Locales (${localRecipes.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-apple-blue border-apple-blue'
                  : 'text-apple-secondary border-transparent hover:text-apple-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {activeTab === 'shared' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
                Ces recettes sont <strong>visibles par toute l'équipe</strong> en temps réel. Quand vous ajoutez une recette via le formulaire, elle apparaît automatiquement ici et chez tous les autres.
              </div>

              {sharedRecipes.length === 0 ? (
                <div className="text-center py-10 text-apple-secondary text-sm">
                  <p className="text-2xl mb-2">🍽️</p>
                  <p>Aucune recette partagée pour l'instant.</p>
                  <p className="text-xs mt-1">Ajoutez une recette pour qu'elle apparaisse ici.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sharedRecipes.map(recipe => (
                    <div key={recipe.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-apple-gray transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-apple-dark truncate">{recipe.name}</p>
                        <p className="text-xs text-apple-secondary">
                          {MEAL_LABELS[recipe.mealType]} · {recipe.ingredients?.length ?? 0} ingr.
                          {recipe.createdBy && <span className="ml-1 text-apple-blue">· {recipe.createdBy}</span>}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            saveCustomRecipe({ ...recipe, isCustom: true })
                            onRecipesChanged()
                          }}
                          className="btn-icon text-apple-blue hover:text-blue-700 text-xs"
                          title="Enregistrer dans ma bibliothèque locale"
                        >
                          💾
                        </button>
                        <button
                          onClick={() => handleDeleteShared(recipe)}
                          className="btn-icon text-red-400 hover:text-red-600"
                          title="Supprimer pour tout le monde"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'local' && (
            <>
              {/* Export */}
              <div className="card space-y-3">
                <h3 className="font-bold text-apple-dark text-sm">Exporter</h3>
                <p className="text-xs text-apple-secondary">
                  Exporte vos recettes locales (pas les recettes Excel de base).
                </p>
                <div className="flex gap-2">
                  <button onClick={handleExportJSON} disabled={localRecipes.length === 0} className="btn-primary flex-1 text-sm py-2">
                    ⬇ JSON
                  </button>
                  <button onClick={handleExportCSV} disabled={localRecipes.length === 0} className="btn-secondary flex-1 text-sm py-2">
                    ⬇ CSV
                  </button>
                </div>
              </div>

              {/* Import */}
              <div className="card space-y-3">
                <h3 className="font-bold text-apple-dark text-sm">Importer</h3>
                <p className="text-xs text-apple-secondary">
                  Importe un fichier JSON exporté précédemment.
                </p>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" id="recipe-import-input" />
                <label htmlFor="recipe-import-input" className="btn-secondary w-full text-sm py-2 cursor-pointer flex items-center justify-center gap-2">
                  📂 Choisir un fichier JSON…
                </label>
                {importError && <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">{importError}</div>}
                {importSuccess && <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">{importSuccess}</div>}
              </div>

              {/* Local recipe list */}
              {localRecipes.length > 0 && (
                <div className="card space-y-2">
                  <h3 className="font-bold text-apple-dark text-sm">Recettes locales ({localRecipes.length})</h3>
                  <div className="space-y-1">
                    {localRecipes.map(recipe => (
                      <div key={recipe.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-apple-gray transition-colors group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-apple-dark truncate">{recipe.name}</p>
                          <p className="text-xs text-apple-secondary">
                            {MEAL_LABELS[recipe.mealTypeKey]} · {recipe.ingredients?.length ?? 0} ingr.
                            {recipe.isImported && <span className="ml-1 text-blue-500">· Importée</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteLocal(recipe)}
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

              {localRecipes.length === 0 && (
                <p className="text-xs text-apple-secondary italic text-center py-4">Aucune recette locale.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
