import { useState } from 'react'
import appLogoUrl from '../assets/app-logo.jpg'
import Signature from './Signature'
import { parseLocalDate, getPeopleForDay, getDayLabel } from '../utils/calculations'
import { I } from '../shared/icons.jsx'

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  if (end < start) return 0
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

function dayLabel(startDate, i) {
  const l = getDayLabel(startDate, i)
  return `${l.weekday} ${l.day} ${l.month}`
}

function rangeLabel(startDate, endDate) {
  const s = parseLocalDate(startDate)
  const e = parseLocalDate(endDate)
  const sameMonth = s.getMonth() === e.getMonth()
  const sd = s.getDate()
  const ed = e.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
  return sameMonth ? `${sd} → ${ed}` : `${s.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })} → ${ed}`
}

export default function CampSetup({ initial, onComplete, recipesLoading, recipesError }) {
  const [form, setForm] = useState({
    campName: initial.campName || '',
    startDate: initial.startDate || '',
    endDate: initial.endDate || '',
    numPeople: initial.numPeople || 10,
    numPeopleByDay: initial.numPeopleByDay || {},
  })
  const [errors, setErrors] = useState({})
  const [perDayOpen, setPerDayOpen] = useState(
    () => Object.keys(initial.numPeopleByDay || {}).length > 0
  )

  const numDays = calculateDays(form.startDate, form.endDate)
  const globalPeople = parseInt(form.numPeople, 10) || 0

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function setDayCount(i, value) {
    const n = Math.max(0, Math.min(500, value))
    setForm(prev => {
      const next = { ...prev.numPeopleByDay }
      if (n === globalPeople) delete next[i]   // back to global ⇒ drop the override
      else next[i] = n
      return { ...prev, numPeopleByDay: next }
    })
  }

  function validate() {
    const errs = {}
    if (!form.startDate) errs.startDate = 'Requis'
    if (!form.endDate) errs.endDate = 'Requis'
    if (form.startDate && form.endDate && parseLocalDate(form.endDate) < parseLocalDate(form.startDate))
      errs.endDate = 'La date de fin doit être après le début'
    if (!form.numPeople || form.numPeople < 1) errs.numPeople = 'Minimum 1 personne'
    if (form.numPeople > 500) errs.numPeople = 'Maximum 500 personnes'
    if (numDays > 21) errs.endDate = 'Maximum 21 jours'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    // Drop any per-day overrides outside the current day range
    const cleaned = {}
    for (const [k, v] of Object.entries(form.numPeopleByDay)) {
      if (Number(k) < numDays) cleaned[k] = v
    }
    onComplete({ ...form, numPeople: parseInt(form.numPeople, 10), numDays, numPeopleByDay: cleaned })
  }

  const canProceed = !recipesLoading && !recipesError

  async function handleLogoReset() {
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
  }

  return (
    <div className="app" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
      {/* Subtle ember glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 110%, oklch(0.78 0.13 50 / 0.16), transparent 55%)',
      }} />

      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative' }}>
        <div className="card" style={{ width: '100%', maxWidth: 520, padding: 'var(--space-8) var(--space-7) var(--space-7)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="button" onClick={handleLogoReset}
                      title="Appuyez sur le logo pour réinitialiser"
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
                <img src={appLogoUrl} alt="Menu 246"
                     style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', boxShadow: 'var(--shadow-3)', display: 'block' }} />
              </button>
              <div>
                <div className="t-display" style={{ fontSize: 34 }}>Menu 246</div>
                <div className="t-sub tx-2" style={{ marginTop: 6 }}>Planifiez les repas de votre camp</div>
              </div>

              {recipesLoading && (
                <div className="chip chip-loading">
                  <svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <span>Chargement des recettes…</span>
                </div>
              )}
              {recipesError && (
                <div className="chip chip-error"><strong>Erreur:</strong>&nbsp;{recipesError}</div>
              )}
              {!recipesLoading && !recipesError && (
                <div className="chip chip-success">
                  <I.Check size={14} sw={2.2} stroke="currentColor" />
                  <span>Recettes chargées</span>
                </div>
              )}
            </div>

            {/* Nom du camp */}
            <div>
              <label className="label">Nom du camp</label>
              <input className="input" placeholder="Camp Été 2025 (optionnel)"
                     value={form.campName} onChange={e => set('campName', e.target.value)} />
            </div>

            {/* Dates */}
            <div>
              <label className="label">Dates du camp</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input className="input input-date" type="date" style={{ flex: 1, minWidth: 0 }}
                       value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                <I.Arrow size={18} stroke="var(--text-tertiary)" sw={1.8} />
                <input className="input input-date" type="date" style={{ flex: 1, minWidth: 0 }}
                       value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} />
              </div>
              {(errors.startDate || errors.endDate) && (
                <p className="t-caption" style={{ color: 'var(--error)', marginTop: 6 }}>{errors.startDate || errors.endDate}</p>
              )}
            </div>

            {/* Duration highlight */}
            {numDays > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-5)', borderRadius: 'var(--r-lg)', background: 'var(--primary-soft)',
                boxShadow: 'inset 0 0 0 1px oklch(0.605 0.165 42 / 0.18)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="t-micro" style={{ color: 'var(--primary)' }}>Durée</span>
                  <span className="t-sub" style={{ color: 'var(--primary)', fontWeight: 500 }}>{rangeLabel(form.startDate, form.endDate)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{numDays}</span>
                  <span className="t-body" style={{ color: 'var(--primary)', fontWeight: 500 }}>jour{numDays > 1 ? 's' : ''} de camp</span>
                </div>
              </div>
            )}

            {/* Participants */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <label className="label" style={{ margin: 0 }}>Participants</label>
                {numDays > 0 && (
                  <button type="button" className="btn-ghost"
                          onClick={() => setPerDayOpen(o => !o)}
                          style={{ fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)',
                                   color: perDayOpen ? 'var(--primary)' : 'var(--text-tertiary)',
                                   display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 'var(--r-sm)' }}>
                    <span>par jour</span>
                    <I.ChevD size={12} sw={2} stroke="currentColor"
                             style={{ transform: perDayOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div className="stepper" style={{ flex: 1 }}>
                  <button type="button" onClick={() => set('numPeople', Math.max(1, globalPeople - 1))}>
                    <I.Minus size={16} sw={2.2} stroke="currentColor" />
                  </button>
                  <input className="stepper-val" type="number" min="1" max="500"
                         value={form.numPeople}
                         onChange={e => set('numPeople', e.target.value)}
                         style={{ width: 64, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit' }} />
                  <button type="button" onClick={() => set('numPeople', globalPeople + 1)}>
                    <I.Plus size={16} sw={2.2} stroke="currentColor" />
                  </button>
                </div>
                <span className="t-sub tx-3" style={{ whiteSpace: 'nowrap' }}>personnes</span>
              </div>
              {errors.numPeople && <p className="t-caption" style={{ color: 'var(--error)', marginTop: 6 }}>{errors.numPeople}</p>}

              {/* Per-day override panel */}
              {perDayOpen && numDays > 0 && (
                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
                  {Array.from({ length: numDays }).map((_, i) => {
                    const value = getPeopleForDay(globalPeople, form.numPeopleByDay, i)
                    const overridden = form.numPeopleByDay[i] != null && form.numPeopleByDay[i] !== globalPeople
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < numDays - 1 ? '1px solid var(--hairline)' : 'none' }}>
                        <span className="t-sub" style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{dayLabel(form.startDate, i)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {overridden && <span className="dot" style={{ background: 'var(--primary)', width: 6, height: 6 }} />}
                          <div style={{ display: 'inline-flex', alignItems: 'center', height: 30, background: 'var(--surface)', borderRadius: 'var(--r-sm)', boxShadow: overridden ? 'inset 0 0 0 1.5px var(--primary)' : 'inset 0 0 0 1px var(--border)' }}>
                            <button type="button" onClick={() => setDayCount(i, value - 1)}
                                    style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <I.Minus size={12} sw={2.2} />
                            </button>
                            <span style={{ minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-sub)', color: overridden ? 'var(--primary)' : 'var(--text)' }}>{value}</span>
                            <button type="button" onClick={() => setDayCount(i, value + 1)}
                                    style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <I.Plus size={12} sw={2.2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* CTA */}
            <button type="submit" className="btn btn-primary btn-lg" disabled={!canProceed} style={{ width: '100%' }}>
              {recipesLoading ? 'Chargement…' : 'Commencer'}
              {!recipesLoading && <I.Arrow size={18} sw={2} stroke="currentColor" />}
            </button>

            <div className="t-caption tx-3" style={{ textAlign: 'center', marginTop: 'calc(-1 * var(--space-3))' }}>
              Appuyez sur le logo pour réinitialiser
            </div>
          </form>

          <Signature />
        </div>
      </div>
    </div>
  )
}
