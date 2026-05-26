import { useState, useRef, useEffect } from 'react'
import { downloadFile } from '../utils/platform'
import { I } from '../shared/icons.jsx'

export default function SaveMenuButton({ campSetup, mealPlan, onImport, onClear }) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleExport() {
    const filename = campSetup?.campName
      ? `menu_${campSetup.campName.replace(/\s+/g, '_')}.json`
      : `menu_camp.json`
    const content = JSON.stringify({ version: 1, campSetup, mealPlan, exportedAt: new Date().toISOString() }, null, 2)
    downloadFile(filename, content, 'application/json')
    setOpen(false)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
    setOpen(false)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.campSetup || !data.mealPlan) throw new Error('Structure invalide')
        onImport(data.campSetup, data.mealPlan)
      } catch {
        alert('Fichier invalide ou corrompu.')
      }
    }
    reader.onerror = () => alert('Erreur de lecture du fichier.')
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleClear() {
    setOpen(false)
    if (!confirm('Effacer toute la progression sauvegardée?')) return
    onClear()
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} className="btn btn-secondary btn-sm" style={{ height: 36 }} title="Sauvegarder le menu">
        <I.Save size={16} />
        <span className="hide-sm">Sauvegarder</span>
        <I.ChevD size={12} sw={2} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--surface)', borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-3)', border: '1px solid var(--hairline)',
          minWidth: 210, zIndex: 100, overflow: 'hidden', padding: 4,
        }}>
          <button onClick={handleExport} style={itemStyle}>
            <I.Download size={18} stroke="var(--text-secondary)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Exporter menu</div>
              <div className="t-caption tx-3">Télécharger fichier .json</div>
            </div>
          </button>

          <button onClick={handleImportClick} style={itemStyle}>
            <I.Arrow size={18} stroke="var(--text-secondary)" style={{ transform: 'rotate(-90deg)' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Importer menu</div>
              <div className="t-caption tx-3">Charger un fichier .json</div>
            </div>
          </button>

          <div className="divider" style={{ margin: '4px 8px' }} />

          <button onClick={handleClear} style={itemStyle}>
            <I.Trash size={18} stroke="var(--error)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)' }}>Effacer progression</div>
              <div className="t-caption tx-3">Réinitialiser l'app</div>
            </div>
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
    </div>
  )
}

const itemStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 12px', border: 'none', background: 'transparent',
  cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--r-sm)',
}
