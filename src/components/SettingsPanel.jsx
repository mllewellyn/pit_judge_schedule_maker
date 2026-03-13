import { useState } from 'react'
import { DEFAULT_SETTINGS } from '../config.js'

export default function SettingsPanel({ settings, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  function set(key, val) {
    const num = Math.max(1, parseInt(val, 10) || 1)
    const next = { ...local, [key]: num }
    setLocal(next)
    onChange(next)
  }

  function reset() {
    setLocal({ ...DEFAULT_SETTINGS })
    onChange({ ...DEFAULT_SETTINGS })
  }

  return (
    <div className="settings-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="settings-sheet" role="dialog" aria-label="Availability Settings">
        <h2>Availability Settings</h2>

        <div className="settings-row">
          <div>
            <label>Pre-match buffer</label>
            <span className="settings-hint">Minutes blocked before match starts</span>
          </div>
          <input
            type="number"
            min="0"
            max="60"
            value={local.preMatchBuffer}
            onChange={e => set('preMatchBuffer', e.target.value)}
          />
        </div>

        <div className="settings-row">
          <div>
            <label>Post-match buffer</label>
            <span className="settings-hint">Minutes blocked after match ends</span>
          </div>
          <input
            type="number"
            min="0"
            max="60"
            value={local.postMatchBuffer}
            onChange={e => set('postMatchBuffer', e.target.value)}
          />
        </div>

        <div className="settings-row">
          <div>
            <label>Minimum interview duration</label>
            <span className="settings-hint">Shortest available window to show (minutes)</span>
          </div>
          <input
            type="number"
            min="1"
            max="120"
            value={local.minInterviewDuration}
            onChange={e => set('minInterviewDuration', e.target.value)}
          />
        </div>

        <div className="settings-actions">
          <button className="btn btn-ghost btn-sm" onClick={reset}>Reset to defaults</button>
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
