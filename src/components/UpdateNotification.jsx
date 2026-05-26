import { useState, useEffect } from 'react'
import { isElectron } from '../utils/platform'

const RELEASES_URL = 'https://github.com/LilKslm/menu-246/releases/latest'

export default function UpdateNotification() {
  const [status, setStatus] = useState(null) // null | 'available' | 'ready' | 'failed'
  const [version, setVersion] = useState('')

  useEffect(() => {
    if (!isElectron) return
    window.electronAPI.onUpdateAvailable(info => { setVersion(info.version || ''); setStatus('available') })
    window.electronAPI.onUpdateDownloaded(info => { if (info?.version) setVersion(info.version); setStatus('ready') })
    window.electronAPI.onUpdateError(() => setStatus('failed'))
    return () => window.electronAPI.removeUpdateListeners()
  }, [])

  async function handleInstall() {
    const result = await window.electronAPI.installUpdate()
    if (result?.error) setStatus('failed')
  }

  if (!status) return null

  const cfg = {
    available: { emoji: '⬇️', title: 'Mise à jour disponible', text: version ? `Version ${version} en cours de téléchargement…` : 'Téléchargement en cours…' },
    ready: { emoji: '✅', title: 'Nouvelle version prête', text: version ? `Version ${version} installée` : 'Redémarrez pour appliquer' },
    failed: { emoji: '⚠️', title: 'Mise à jour manuelle requise', text: version ? `Téléchargez la version ${version} depuis GitHub.` : 'Téléchargez la nouvelle version depuis GitHub.' },
  }[status]

  return (
    <div className="app" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-3)', border: '1px solid var(--hairline)',
      padding: '16px 18px', maxWidth: 300, minWidth: 240, animation: 'slideUp 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: status === 'available' ? 0 : 14 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.emoji}</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 3px' }}>{cfg.title}</p>
          <p className="t-caption tx-2" style={{ margin: 0 }}>{cfg.text}</p>
        </div>
      </div>

      {status === 'ready' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleInstall} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Redémarrer</button>
          <button onClick={() => setStatus(null)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Plus tard</button>
        </div>
      )}

      {status === 'failed' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.electronAPI.openExternal(RELEASES_URL)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Télécharger</button>
          <button onClick={() => setStatus(null)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Plus tard</button>
        </div>
      )}
    </div>
  )
}
