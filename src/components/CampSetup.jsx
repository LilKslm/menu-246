import { useState } from 'react'
import appLogoUrl from '../assets/app-logo.jpg'
import Signature from './Signature'
import { parseLocalDate } from '../utils/calculations'

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  if (end < start) return 0
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

export default function CampSetup({ initial, onComplete, recipesLoading, recipesError }) {
  const [form, setForm] = useState({
    campName: initial.campName || '',
    startDate: initial.startDate || '',
    endDate: initial.endDate || '',
    numPeople: initial.numPeople || 10,
  })
  const [errors, setErrors] = useState({})

  const numDays = calculateDays(form.startDate, form.endDate)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.startDate) errs.startDate = 'Requis'
    if (!form.endDate) errs.endDate = 'Requis'
    if (form.startDate && form.endDate && parseLocalDate(form.endDate) < parseLocalDate(form.startDate))
      errs.endDate = 'La date de fin doit être après le début'
    if (!form.numPeople || form.numPeople < 1) errs.numPeople = 'Minimum 1 personne'
    if (numDays > 21) errs.endDate = 'Maximum 21 jours'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onComplete({ ...form, numPeople: parseInt(form.numPeople, 10), numDays })
  }

  const canProceed = !recipesLoading && !recipesError

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    borderRadius: 12,
    border: `1.5px solid ${hasError ? '#FF3B30' : '#E5E5EA'}`,
    background: '#fff',
    color: '#1C1C1E',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    transition: 'border-color 0.15s',
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F2F2F7', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 390 }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img
              src={appLogoUrl}
              alt="Menu 246"
              style={{
                width: 96, height: 96, borderRadius: 22,
                objectFit: 'cover', margin: '0 auto 20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                cursor: 'pointer',
                display: 'block',
                transition: 'transform 0.15s',
              }}
              onClick={async () => {
                if (!confirm('Recommencer à zéro?\n\nCeci effacera tous vos menus et données locales.')) return
                if ('caches' in window) {
                  const keys = await caches.keys()
                  await Promise.all(keys.map(k => caches.delete(k)))
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations()
                  await Promise.all(regs.map(r => r.unregister()))
                }
                localStorage.clear()
                if ('indexedDB' in window) {
                  const dbs = await indexedDB.databases?.() ?? []
                  dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name))
                }
                window.location.reload(true)
              }}
            />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1C1C1E', margin: '0 0 6px', letterSpacing: -0.5 }}>Menu 246</h1>
            <p style={{ fontSize: 15, color: '#636366', margin: 0, lineHeight: 1.5 }}>
              Planifiez les repas de votre camp
            </p>
          </div>

          {/* Recipe status */}
          {recipesLoading && (
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, background: '#EFF6FF', borderRadius: 14, padding: '12px 16px' }}>
              <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="3" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 14, color: '#1D4ED8', fontWeight: 500 }}>Chargement des recettes…</span>
            </div>
          )}
          {recipesError && (
            <div style={{ marginBottom: 20, background: '#FFF1F0', borderRadius: 14, padding: '12px 16px', fontSize: 14, color: '#DC2626' }}>
              <strong>Erreur:</strong> {recipesError}
            </div>
          )}
          {!recipesLoading && !recipesError && (
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 14, padding: '12px 16px' }}>
              <span style={{ fontSize: 15 }}>✓</span>
              <span style={{ fontSize: 14, color: '#16A34A', fontWeight: 500 }}>Recettes chargées</span>
            </div>
          )}

          {/* Form card */}
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

              {/* Camp name */}
              <div style={{ padding: '20px 20px 0' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Nom du camp
                </label>
                <input
                  type="text"
                  style={inputStyle(false)}
                  placeholder="Camp Été 2025 (optionnel)"
                  value={form.campName}
                  onChange={e => set('campName', e.target.value)}
                />
              </div>

              <div style={{ height: 1, background: '#F2F2F7', margin: '20px 0 0' }} />

              {/* Dates */}
              <div style={{ padding: '20px 20px 0' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Dates du camp
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      type="date"
                      style={{ ...inputStyle(!!errors.startDate), width: '100%', minWidth: 0 }}
                      value={form.startDate}
                      onChange={e => set('startDate', e.target.value)}
                    />
                  </div>
                  <span style={{ color: '#C7C7CC', fontSize: 16, flexShrink: 0 }}>→</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      type="date"
                      style={{ ...inputStyle(!!errors.endDate), width: '100%', minWidth: 0 }}
                      value={form.endDate}
                      min={form.startDate}
                      onChange={e => set('endDate', e.target.value)}
                    />
                  </div>
                </div>
                {(errors.startDate || errors.endDate) && (
                  <p style={{ fontSize: 12, color: '#FF3B30', marginTop: 6 }}>{errors.startDate || errors.endDate}</p>
                )}
              </div>

              {/* Duration badge */}
              {numDays > 0 && (
                <div style={{ margin: '16px 20px 0', background: '#EFF6FF', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#007AFF', lineHeight: 1 }}>{numDays}</span>
                  <span style={{ fontSize: 15, color: '#007AFF', fontWeight: 500 }}>jour{numDays > 1 ? 's' : ''} de camp</span>
                </div>
              )}

              <div style={{ height: 1, background: '#F2F2F7', margin: '20px 0 0' }} />

              {/* Participants */}
              <div style={{ padding: '20px 20px 20px' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Participants
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => set('numPeople', Math.max(1, (parseInt(form.numPeople, 10) || 1) - 1))}
                    style={{
                      width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: '#F2F2F7', color: '#1C1C1E', fontSize: 22, fontWeight: 300,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'background 0.1s',
                    }}
                  >−</button>
                  <input
                    type="number"
                    style={{ ...inputStyle(!!errors.numPeople), textAlign: 'center', fontSize: 20, fontWeight: 700, flex: 1 }}
                    value={form.numPeople}
                    min="1" max="500"
                    onChange={e => set('numPeople', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => set('numPeople', (parseInt(form.numPeople, 10) || 0) + 1)}
                    style={{
                      width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: '#F2F2F7', color: '#1C1C1E', fontSize: 22, fontWeight: 300,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >+</button>
                </div>
                {errors.numPeople && <p style={{ fontSize: 12, color: '#FF3B30', marginTop: 6 }}>{errors.numPeople}</p>}
              </div>
            </div>

            {/* CTA button */}
            <button
              type="submit"
              disabled={!canProceed}
              style={{
                width: '100%', marginTop: 16, padding: '16px',
                borderRadius: 16, border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed',
                background: canProceed ? '#007AFF' : '#C7C7CC',
                color: '#fff', fontSize: 17, fontWeight: 700,
                letterSpacing: -0.2,
                transition: 'background 0.15s, transform 0.1s',
              }}
              onTouchStart={e => canProceed && (e.currentTarget.style.transform = 'scale(0.97)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {recipesLoading ? 'Chargement…' : 'Commencer →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#C7C7CC' }}>
            Appuyez sur le logo pour réinitialiser
          </p>
          <Signature />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; }
      `}</style>
    </div>
  )
}
