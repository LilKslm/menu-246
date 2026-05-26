import { useState, useRef, useEffect } from 'react'
import { I } from '../shared/icons.jsx'

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
      <button onClick={() => setOpen(o => !o)} className="btn-icon" title="Donner un avis">
        <I.Message size={18} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--surface)', borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-3)', border: '1px solid var(--hairline)',
          width: 280, padding: 16, zIndex: 200, animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Votre avis</h3>
            <button onClick={() => setOpen(false)} className="btn-icon" style={{ width: 28, height: 28 }}><I.X size={15} /></button>
          </div>

          <textarea
            placeholder="Décrivez votre expérience…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            autoFocus
            className="input"
            style={{ height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.5, fontSize: 14 }}
          />

          <button onClick={handleSend} disabled={!message.trim()} className="btn btn-primary" style={{ width: '100%', marginTop: 10, height: 40 }}>
            Envoyer par email →
          </button>

          <p className="t-caption tx-3" style={{ textAlign: 'center', margin: '8px 0 0' }}>Ouvre votre application email</p>
        </div>
      )}
    </div>
  )
}
