import { useState, useEffect } from 'react'
import { isElectron } from '../utils/platform'

export default function UpdateNotification() {
  const [status, setStatus] = useState(null) // null | 'available' | 'ready'
  const [version, setVersion] = useState('')

  useEffect(() => {
    if (!isElectron) return
    window.electronAPI.onUpdateAvailable(info => {
      setVersion(info.version || '')
      setStatus('available')
    })
    window.electronAPI.onUpdateDownloaded(() => {
      setStatus('ready')
    })
    return () => {
      window.electronAPI.removeUpdateListeners()
    }
  }, [])

  if (!status) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      background: '#fff', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      border: '1px solid #E5E7EB',
      padding: '16px 18px',
      maxWidth: 300, minWidth: 240,
      animation: 'slideUp 0.3s ease',
    }}>
      {status === 'available' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>⬇️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E', margin: '0 0 3px' }}>
              Mise à jour disponible
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
              {version ? `Version ${version} en cours de téléchargement…` : 'Téléchargement en cours…'}
            </p>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>✅</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E', margin: '0 0 3px' }}>
                Nouvelle version prête
              </p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                {version ? `Version ${version} installée` : 'Redémarrez pour appliquer'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.electronAPI.installUpdate()}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                background: '#007AFF', color: '#fff',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Redémarrer
            </button>
            <button
              onClick={() => setStatus(null)}
              style={{
                flex: 1, padding: '8px', borderRadius: 8,
                border: '1px solid #E5E7EB', background: '#fff', color: '#374151',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Plus tard
            </button>
          </div>
        </>
      )}
    </div>
  )
}
