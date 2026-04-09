import { useState, useRef, useEffect } from 'react'
import { downloadFile } from '../utils/platform'

export default function SaveMenuButton({ campSetup, mealPlan, onImport, onClear }) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
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
    // Reset so same file can be re-imported
    e.target.value = ''
  }

  function handleClear() {
    setOpen(false)
    if (!confirm('Effacer toute la progression sauvegardée?')) return
    onClear()
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 10px', borderRadius: 8,
          border: 'none', background: open ? '#E5E7EB' : '#F3F4F6',
          color: '#374151', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#E5E7EB' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = '#F3F4F6' }}
        title="Sauvegarder le menu"
      >
        💾
        <span className="hidden sm:inline">Sauvegarder</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid #F3F4F6',
          minWidth: 200, zIndex: 100,
          overflow: 'hidden',
        }}>
          <button onClick={handleExport} style={itemStyle}>
            <span style={{ fontSize: 15 }}>⬇️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}>Exporter menu</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Télécharger fichier .json</div>
            </div>
          </button>

          <div style={{ height: 1, background: '#F3F4F6', margin: '0 12px' }} />

          <button onClick={handleImportClick} style={itemStyle}>
            <span style={{ fontSize: 15 }}>⬆️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}>Importer menu</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Charger un fichier .json</div>
            </div>
          </button>

          <div style={{ height: 1, background: '#F3F4F6', margin: '0 12px' }} />

          <button onClick={handleClear} style={{ ...itemStyle, color: '#EF4444' }}>
            <span style={{ fontSize: 15 }}>🗑</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#EF4444' }}>Effacer progression</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Réinitialiser l'app</div>
            </div>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}

const itemStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', border: 'none', background: 'transparent',
  cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
  onMouseEnter: undefined,
}
