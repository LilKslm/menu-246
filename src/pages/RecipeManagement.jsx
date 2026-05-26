import { useState, useRef } from 'react'
import {
  exportRecipesAsJSON,
  exportRecipesAsCSV,
  saveImportedRecipes,
  deleteCustomRecipe,
  saveCustomRecipe,
} from '../utils/excelLoader'
import { MEAL_TYPES, MEAL_LABELS } from '../shared/meals'
import { I } from '../shared/icons.jsx'

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--r-md)' }

export default function RecipeManagement({
  recipes,
  sharedRecipes = [],
  onClose,
  onRecipesChanged,
  onDeleteSharedRecipe,
}) {
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('shared')
  const fileInputRef = useRef(null)

  const localRecipes = MEAL_TYPES.flatMap(mt =>
    (recipes[mt] || []).filter(r => r.isCustom || r.isImported).map(r => ({ ...r, mealTypeKey: mt })))

  function handleExportJSON() { downloadBlob(exportRecipesAsJSON(recipes), 'scout-recettes.json', 'application/json') }
  function handleExportCSV() { downloadBlob(exportRecipesAsCSV(recipes), 'scout-recettes.csv', 'text/csv;charset=utf-8') }

  function handleImportJSON(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null); setImportSuccess(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result)
        const validKeys = ['breakfast', 'lunch', 'dinner', 'snack']
        if (!validKeys.some(k => Array.isArray(data[k]))) {
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
    deleteCustomRecipe(recipe.id); onRecipesChanged()
  }
  function handleDeleteShared(recipe) {
    if (!confirm(`Supprimer "${recipe.name}" pour tout le monde ?`)) return
    onDeleteSharedRecipe(recipe.id)
  }

  return (
    <div className="app" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(30, 22, 14, 0.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 512, height: '100%', background: 'var(--bg)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '16px 20px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>📚</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 600, color: 'var(--text)', fontSize: 16 }}>Gestion des recettes</h2>
            <p className="t-caption tx-3">Base de données partagée via Firebase</p>
          </div>
          <button onClick={onClose} className="btn-icon"><I.X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--hairline)', flexShrink: 0, background: 'var(--surface)' }}>
          {[{ id: 'shared', label: `🌐 Partagées (${sharedRecipes.length})` }, { id: 'local', label: `💾 Locales (${localRecipes.length})` }].map(tab => {
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, padding: '10px 0', fontSize: 'var(--fs-sub)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', border: 'none', background: 'transparent', borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`, color: active ? 'var(--primary)' : 'var(--text-tertiary)', fontFamily: 'inherit' }}>
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {activeTab === 'shared' && (
            <>
              <div style={{ background: 'var(--primary-soft)', borderRadius: 'var(--r-md)', padding: '12px 14px', fontSize: 'var(--fs-caption)', color: 'var(--primary)', lineHeight: 1.5 }}>
                Ces recettes sont <strong>visibles par toute l'équipe</strong> en temps réel. Quand vous ajoutez une recette via le formulaire, elle apparaît automatiquement ici et chez tous les autres.
              </div>

              {sharedRecipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
                  <p style={{ fontSize: 26, marginBottom: 8 }}>🍽️</p>
                  <p>Aucune recette partagée pour l'instant.</p>
                  <p className="t-caption tx-3" style={{ marginTop: 4 }}>Ajoutez une recette pour qu'elle apparaisse ici.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sharedRecipes.map(recipe => (
                    <div key={recipe.id} className="rm-row" style={rowStyle}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.name}</p>
                        <p className="t-caption tx-3">{MEAL_LABELS[recipe.mealType]} · {recipe.ingredients?.length ?? 0} ingr.{recipe.createdBy ? ` · ${recipe.createdBy}` : ''}</p>
                      </div>
                      <button onClick={() => { saveCustomRecipe({ ...recipe, isCustom: true }); onRecipesChanged() }} className="btn-icon" style={{ width: 30, height: 30 }} title="Enregistrer dans ma bibliothèque locale"><I.Save size={16} /></button>
                      <button onClick={() => handleDeleteShared(recipe)} className="btn-icon" style={{ width: 30, height: 30, color: 'var(--error)' }} title="Supprimer pour tout le monde"><I.Trash size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'local' && (
            <>
              <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>Exporter</h3>
                <p className="t-caption tx-3">Exporte vos recettes locales (pas les recettes Excel de base).</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleExportJSON} disabled={localRecipes.length === 0} className="btn btn-primary" style={{ flex: 1, height: 40 }}><I.Download size={16} /> JSON</button>
                  <button onClick={handleExportCSV} disabled={localRecipes.length === 0} className="btn btn-secondary" style={{ flex: 1, height: 40 }}><I.Download size={16} /> CSV</button>
                </div>
              </div>

              <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>Importer</h3>
                <p className="t-caption tx-3">Importe un fichier JSON exporté précédemment.</p>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} id="recipe-import-input" />
                <label htmlFor="recipe-import-input" className="btn btn-secondary" style={{ width: '100%', height: 40, cursor: 'pointer' }}>📂 Choisir un fichier JSON…</label>
                {importError && <div className="chip chip-error" style={{ height: 'auto', padding: '8px 12px', borderRadius: 'var(--r-md)' }}>{importError}</div>}
                {importSuccess && <div className="chip chip-success" style={{ height: 'auto', padding: '8px 12px', borderRadius: 'var(--r-md)' }}>{importSuccess}</div>}
              </div>

              {localRecipes.length > 0 ? (
                <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>Recettes locales ({localRecipes.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {localRecipes.map(recipe => (
                      <div key={recipe.id} className="rm-row" style={rowStyle}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recipe.name}</p>
                          <p className="t-caption tx-3">{MEAL_LABELS[recipe.mealTypeKey]} · {recipe.ingredients?.length ?? 0} ingr.{recipe.isImported ? ' · Importée' : ''}</p>
                        </div>
                        <button onClick={() => handleDeleteLocal(recipe)} className="btn-icon" style={{ width: 30, height: 30, color: 'var(--error)' }} title="Supprimer"><I.Trash size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="t-caption tx-3" style={{ textAlign: 'center', padding: '16px 0' }}>Aucune recette locale.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
