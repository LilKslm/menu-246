export default function ResumePrompt({ session, onResume, onDiscard }) {
  const { campSetup, savedAt } = session

  const savedLabel = (() => {
    try {
      const d = new Date(savedAt)
      return d.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })
        + ' à ' + d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Récemment'
    }
  })()

  const campLabel = campSetup?.campName || 'Camp sans nom'
  const daysLabel = campSetup?.numDays ? `${campSetup.numDays} jour${campSetup.numDays > 1 ? 's' : ''}` : ''
  const peopleLabel = campSetup?.numPeople ? `${campSetup.numPeople} personnes` : ''

  return (
    <div className="app" style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(30, 22, 14, 0.42)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ padding: '28px 24px 24px', width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 'var(--r-lg)', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>
          📋
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Reprendre le menu?</h2>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)', margin: '0 0 4px' }}>{campLabel}</p>
        <p className="t-sub tx-2" style={{ margin: '0 0 4px' }}>{[daysLabel, peopleLabel].filter(Boolean).join(' · ')}</p>
        <p className="t-caption tx-3" style={{ margin: '0 0 24px' }}>Sauvegardé {savedLabel}</p>

        <button onClick={onResume} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 10 }}>Reprendre</button>
        <button onClick={onDiscard} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>Nouveau camp</button>
      </div>
    </div>
  )
}
