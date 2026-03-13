import { useState } from 'react'
import { DEFAULT_SETTINGS } from '../config.js'
import { formatTime } from './AvailabilityTimeline.jsx'

// HH:MM ↔ minutes-since-midnight helpers
function minToTimeStr(min) {
  if (min == null) return '12:00'
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
function timeStrToMin(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  return h * 60 + (m || 0)
}

export default function SettingsPanel({ settings, detectedLunch, onChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })

  function set(key, val) {
    const num = Math.max(1, parseInt(val, 10) || 1)
    update(key, num)
  }

  function update(key, val) {
    const next = { ...local, [key]: val }
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

        {/* ── Lunch break ──────────────────────────────────────── */}
        <div className="settings-section-title">Lunch break</div>

        <div className="settings-row">
          <div>
            <label>Block lunch break</label>
            <span className="settings-hint">Mark all teams unavailable during lunch</span>
          </div>
          <input
            type="checkbox"
            checked={!!local.lunchBreakEnabled}
            onChange={e => update('lunchBreakEnabled', e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--clr-available-light)' }}
          />
        </div>

        {local.lunchBreakEnabled && (
          <>
            <div className="settings-row">
              <div>
                <label>Auto-detect from schedule</label>
                <span className="settings-hint">
                  {local.lunchBreakAuto
                    ? detectedLunch
                      ? `Detected: ${formatTime(detectedLunch[0])} – ${formatTime(detectedLunch[1])}`
                      : 'No large gap found in schedule'
                    : 'Using manually set time'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={!!local.lunchBreakAuto}
                onChange={e => update('lunchBreakAuto', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--clr-available-light)' }}
              />
            </div>

            {!local.lunchBreakAuto && (
              <>
                <div className="settings-row">
                  <div>
                    <label>Lunch start time</label>
                  </div>
                  <input
                    type="time"
                    value={minToTimeStr(local.lunchBreakStartMin)}
                    onChange={e => update('lunchBreakStartMin', timeStrToMin(e.target.value))}
                    style={{ fontSize: '0.9rem', background: 'var(--clr-surface2)', color: 'var(--clr-text)', border: '1px solid var(--clr-border)', borderRadius: 6, padding: '0.25rem 0.4rem' }}
                  />
                </div>
                <div className="settings-row">
                  <div>
                    <label>Lunch duration (minutes)</label>
                  </div>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={local.lunchBreakDuration}
                    onChange={e => set('lunchBreakDuration', e.target.value)}
                  />
                </div>
              </>
            )}
          </>
        )}

        <div className="settings-actions">
          <button className="btn btn-ghost btn-sm" onClick={reset}>Reset to defaults</button>
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
