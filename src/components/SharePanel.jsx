import { useState } from 'react'

function buildUrl(eventKey, teams, interviewed, mode) {
  const base = window.location.origin + window.location.pathname
  const params = new URLSearchParams()
  params.set('event', eventKey)
  if (mode === 'full') {
    params.set('teams', teams.map(t => t.number).join(','))
    const done = teams.filter(t => interviewed[t.number]).map(t => t.number)
    if (done.length) params.set('done', done.join(','))
  }
  return `${base}?${params.toString()}`
}

function ShareOption({ label, description, url, copied, onClick }) {
  return (
    <div
      className="share-option"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="share-option-row">
        <div>
          <div className="share-option-label">{label}</div>
          <div className="share-option-desc">{description}</div>
        </div>
        <span className={`share-copy-badge${copied ? ' copied' : ''}`}>
          {copied ? '✓ Copied' : '📋 Copy'}
        </span>
      </div>
      <div className="share-url-preview">{url}</div>
    </div>
  )
}

export default function SharePanel({ eventKey, teams, interviewed, onClose }) {
  const [copied, setCopied] = useState(null) // 'event' | 'full'

  async function copy(mode) {
    const url = buildUrl(eventKey, teams, interviewed, mode)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard API unavailable (non-https dev) — show URL to user
    }
    setCopied(mode)
    setTimeout(() => setCopied(null), 2000)
  }

  const doneCount = teams.filter(t => interviewed[t.number]).length

  return (
    <div
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Share schedule"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="settings-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2>Share schedule</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
          Send a link that pre-fills the event and teams. Opening the link loads the schedule automatically.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ShareOption
            label="Event link"
            description={`Shares event ${eventKey} — recipient selects their own teams`}
            url={buildUrl(eventKey, teams, interviewed, 'event')}
            copied={copied === 'event'}
            onClick={() => copy('event')}
          />
          <ShareOption
            label="Teams + progress link"
            description={`${teams.length} team${teams.length !== 1 ? 's' : ''}, ${doneCount} interviewed — recipient sees your current state`}
            url={buildUrl(eventKey, teams, interviewed, 'full')}
            copied={copied === 'full'}
            onClick={() => copy('full')}
          />
        </div>

        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}
