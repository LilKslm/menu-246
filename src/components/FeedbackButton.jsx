import { useState, useRef, useEffect } from 'react'

const FEEDBACK_EMAIL = 'khalil@246bdb.org'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSend() {
    const body = encodeURIComponent(`${message}\n\n— Envoyé depuis Menu 246`)
    const subject = encodeURIComponent('Feedback – Menu 246')
    window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`)
    setOpen(false)
    setMessage('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost text-xs text-apple-secondary gap-1 flex"
        title="Donner un avis"
      >
        💬 <span className="hidden sm:inline">Avis</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          border: '1px solid #F3F4F6',
          width: 280, padding: '16px',
          zIndex: 200,
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>Votre avis</h3>
            <button
              onClick={() => setOpen(false)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: 0 }}
            >×</button>
          </div>

          <textarea
            placeholder="Décrivez votre expérience…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            autoFocus
            style={{
              width: '100%', padding: '10px 12px',
              borderRadius: 10, border: '1.5px solid #E5E7EB',
              fontSize: 13, color: '#1C1C1E', resize: 'none',
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', lineHeight: 1.5,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#007AFF'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            style={{
              width: '100%', marginTop: 10,
              padding: '10px', borderRadius: 10, border: 'none',
              background: !message.trim() ? '#E5E7EB' : '#007AFF',
              color: !message.trim() ? '#9CA3AF' : '#fff',
              fontSize: 13, fontWeight: 700,
              cursor: !message.trim() ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Envoyer par email →
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#C7C7CC', margin: '8px 0 0' }}>
            Ouvre votre application email
          </p>
        </div>
      )}
    </div>
  )
}
