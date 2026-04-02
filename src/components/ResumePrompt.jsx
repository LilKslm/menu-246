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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '28px 24px 24px',
        width: '100%', maxWidth: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 16px',
        }}>
          📋
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E', margin: '0 0 6px' }}>
          Reprendre le menu?
        </h2>

        <p style={{ fontSize: 15, fontWeight: 700, color: '#007AFF', margin: '0 0 4px' }}>
          {campLabel}
        </p>

        <p style={{ fontSize: 13, color: '#636366', margin: '0 0 4px' }}>
          {[daysLabel, peopleLabel].filter(Boolean).join(' · ')}
        </p>

        <p style={{ fontSize: 12, color: '#C7C7CC', margin: '0 0 24px' }}>
          Sauvegardé {savedLabel}
        </p>

        {/* Buttons */}
        <button
          onClick={onResume}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: 'none', background: '#007AFF', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            marginBottom: 10, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Reprendre
        </button>

        <button
          onClick={onDiscard}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: 'none', background: '#F2F2F7', color: '#1C1C1E',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Nouveau camp
        </button>
      </div>
    </div>
  )
}
