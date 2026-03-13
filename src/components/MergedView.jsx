import { useMemo, useState, useCallback } from 'react'
import { teamAvailability } from '../utils/availability.js'
import { matchesForTeam } from '../api/tba.js'
import { formatTime } from './AvailabilityTimeline.jsx'

const BLOCK_MINUTES = 10
const BLOCK_SEC = BLOCK_MINUTES * 60
const PX_PER_BLOCK = 28      // px per 10-minute block (28 × 6 = 168 px/hour)
const HOUR_PX = PX_PER_BLOCK * 6
const AXIS_W = 48             // px width of the time axis column
// Minimum block height (px) at which team chips can actually be displayed
const MIN_TEAM_CHIP_PX = 18

/** Returns hsl color object based on availability ratio (0→red, 1→green). */
function blockColor(count, total) {
  if (total === 0) return { bg: 'var(--clr-surface2)', border: 'var(--clr-border)', text: 'var(--clr-text-muted)' }
  if (count === 0) return { bg: '#160808', border: '#3d1010', text: '#6b4040' }
  const ratio = count / total
  const hue = Math.round(ratio * 120)   // 0 = red, 120 = green
  const sat = 55
  const light = 20
  return {
    bg: `hsl(${hue}deg, ${sat}%, ${light}%)`,
    border: `hsl(${hue}deg, ${sat}%, ${light + 14}%)`,
    text: `hsl(${hue}deg, 50%, 72%)`,
  }
}

/** Teams with any available window overlapping [blockStart, blockEnd]. */
function teamsAvailableInBlock(teams, slotsPerTeam, blockStart, blockEnd) {
  return teams.filter((_, idx) =>
    slotsPerTeam[idx].some(([s, e]) => s < blockEnd && e > blockStart)
  )
}

/**
 * Group consecutive 10-minute blocks whose *active* (non-interviewed) available
 * team set is identical into a single taller merged block.
 */
function groupBlocks(rawBlocks) {
  if (rawBlocks.length === 0) return []
  const groups = []
  let cur = { ...rawBlocks[0] }
  for (let i = 1; i < rawBlocks.length; i++) {
    const b = rawBlocks[i]
    if (b.activeKey === cur.activeKey) {
      cur.end = b.end
      cur.blockCount += 1
    } else {
      groups.push(cur)
      cur = { ...b }
    }
  }
  groups.push(cur)
  return groups
}

// ── Expand mode control bar ────────────────────────────────────────────────

const MODES = [
  { id: 'default', label: '≤ 3', title: 'Show team numbers only when 3 or fewer are available' },
  { id: 'all',     label: 'All', title: 'Always show team numbers in every block' },
  { id: 'none',    label: 'None', title: 'Hide team numbers in all blocks' },
]

function ExpandControls({ mode, onMode }) {
  return (
    <div className="merged-controls">
      <span className="merged-controls-label">Teams:</span>
      {MODES.map(m => (
        <button
          key={m.id}
          className={`merged-ctrl-btn${mode === m.id ? ' active' : ''}`}
          onClick={() => onMode(m.id)}
          title={m.title}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MergedView({ teams, matches, dayStart, dayEnd, settings, interviewed, onToggleInterviewed, nowSec }) {
  // expand mode: 'default' | 'all' | 'none'
  const [expandMode, setExpandMode] = useState('default')
  // per-group index overrides: Set of group indices whose expand state is flipped
  const [blockOverrides, setBlockOverrides] = useState(() => new Set())

  // ── Derived team sets ─────────────────────────────────────────
  const activeTeams = useMemo(() =>
    teams.filter(t => !interviewed[t.number]),
    [teams, interviewed]
  )
  const excludedTeams = useMemo(() =>
    teams.filter(t => !!interviewed[t.number]),
    [teams, interviewed]
  )

  // ── Slot calculation ──────────────────────────────────────────
  const slotsPerTeam = useMemo(() =>
    teams.map(t => teamAvailability(matchesForTeam(matches, t.number), dayStart, dayEnd, settings)),
    [teams, matches, dayStart, dayEnd, settings]
  )

  // ── Grid geometry ─────────────────────────────────────────────
  const gridStart = Math.floor(dayStart / BLOCK_SEC) * BLOCK_SEC
  const gridEnd   = Math.ceil(dayEnd   / BLOCK_SEC) * BLOCK_SEC
  const totalSec  = gridEnd - gridStart
  const totalPx   = (totalSec / 3600) * HOUR_PX

  // ── Raw blocks ────────────────────────────────────────────────
  const rawBlocks = useMemo(() => {
    const result = []
    for (let t = gridStart; t < gridEnd; t += BLOCK_SEC) {
      const allAvail    = teamsAvailableInBlock(teams, slotsPerTeam, t, t + BLOCK_SEC)
      const activeAvail = allAvail.filter(tm => !interviewed[tm.number])
      result.push({
        start:       t,
        end:         t + BLOCK_SEC,
        blockCount:  1,
        allAvail,               // all available teams (incl. interviewed — for display)
        activeAvail,            // non-interviewed available teams (for count & colour)
        // Merge-key uses only active teams so blocks with the same "useful" availability merge
        activeKey: activeAvail.map(tm => tm.number).sort().join(','),
      })
    }
    return result
  }, [teams, slotsPerTeam, gridStart, gridEnd, interviewed])

  const groups = useMemo(() => groupBlocks(rawBlocks), [rawBlocks])

  // ── Hour ticks ────────────────────────────────────────────────
  const ticks = useMemo(() => {
    const result = []
    const firstHour = Math.ceil(gridStart / 3600) * 3600
    for (let t = firstHour; t <= gridEnd; t += 3600) result.push(t)
    return result
  }, [gridStart, gridEnd])

  function toPx(unix) {
    return ((unix - gridStart) / totalSec) * totalPx
  }

  // ── Expand helpers ────────────────────────────────────────────
  function isExpanded(groupIdx, activeAvailCount) {
    const base = expandMode === 'all'  ? true
               : expandMode === 'none' ? false
               : activeAvailCount <= 3
    return blockOverrides.has(groupIdx) ? !base : base
  }

  const handleSetMode = useCallback(mode => {
    setExpandMode(mode)
    setBlockOverrides(new Set())
  }, [])

  const toggleBlock = useCallback(idx => {
    setBlockOverrides(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>
      {/* Intro + controls row */}
      <div className="merged-header">
        <div className="merged-intro">
          <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '0.2rem' }}>
            Showing <strong>{activeTeams.length}</strong> uninterviewed team{activeTeams.length !== 1 ? 's' : ''}{excludedTeams.length > 0 ? `, hiding ${excludedTeams.length} interviewed` : ''}.
            Greener = more teams free simultaneously.
          </p>
        </div>
        <ExpandControls mode={expandMode} onMode={handleSetMode} />
      </div>

      {/* Team checklist — sorted by team number */}
      {teams.length > 0 && (() => {
        const sorted = [...teams].sort((a, b) => a.number - b.number)
        return (
          <div className="merged-checklist">
            {sorted.map(t => (
              <label key={t.number} className="merged-checklist-item">
                <input
                  type="checkbox"
                  checked={!!interviewed[t.number]}
                  onChange={() => onToggleInterviewed(t.number)}
                />
                <span style={{ textDecoration: interviewed[t.number] ? 'line-through' : 'none',
                               color: interviewed[t.number] ? 'var(--clr-text-muted)' : 'inherit' }}>
                  {t.number}
                </span>
              </label>
            ))}
          </div>
        )
      })()}

      {/* Timeline grid */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Time axis */}
        <div style={{ flexShrink: 0, width: AXIS_W, position: 'relative', height: totalPx }}>
          {ticks.map(t => (
            <div key={t} className="timeline-axis-label" style={{ top: toPx(t), right: 8 }}>
              {formatTime(t)}
            </div>
          ))}
        </div>

        {/* Block column */}
        <div style={{ flex: 1, position: 'relative', height: totalPx }}>
          {/* Hour gridlines */}
          {ticks.map(t => (
            <div key={t} className="timeline-gridline" style={{ top: toPx(t) }} />
          ))}

          {/* Current-time indicator */}
          {nowSec && nowSec >= gridStart && nowSec <= gridEnd && (
            <div className="timeline-now-line" style={{ top: toPx(nowSec), zIndex: 5 }} />
          )}

          {groups.map((group, idx) => {
            const top    = toPx(group.start)
            const height = toPx(group.end) - top
            const { bg, border, text } = blockColor(group.activeAvail.length, activeTeams.length)
            const isPast       = nowSec && group.end <= nowSec + 10 * 60
            const showDetails  = height >= 20
            const showTeams    = isExpanded(idx, group.activeAvail.length) && height >= MIN_TEAM_CHIP_PX

            // Only show non-interviewed teams; sort by team number
            const displayTeams = [...group.activeAvail].sort((a, b) => a.number - b.number)

            return (
              <div
                key={idx}
                className="merged-block"
                role="button"
                tabIndex={0}
                aria-label={`${formatTime(group.start)}–${formatTime(group.end)}: ${group.activeAvail.length}/${activeTeams.length} active teams available. Click to ${isExpanded(idx, group.activeAvail.length) ? 'hide' : 'show'} team numbers.`}
                onClick={() => toggleBlock(idx)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleBlock(idx)}
                style={{
                  position: 'absolute',
                  top,
                  height: height - 1,
                  left: 2,
                  right: 2,
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',   // single horizontal line
                  padding: '0 5px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  gap: 6,
                  opacity: isPast ? 0.4 : 1,
                }}
              >
                {/* Left: time · count · expand hint — fixed width, never shrinks */}
                {showDetails ? (
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap', lineHeight: 1 }}>
                      {formatTime(group.start)}
                    </span>
                    <span className="merged-count-badge" style={{ fontSize: '0.7rem', fontWeight: 700, color: text, whiteSpace: 'nowrap', lineHeight: 1 }}>
                      {group.activeAvail.length}/{activeTeams.length}
                    </span>
                    {!showTeams && group.activeAvail.length > 0 && (
                      <span style={{ fontSize: '0.55rem', color: 'var(--clr-text-muted)' }}>▸</span>
                    )}
                  </div>
                ) : (
                  group.activeAvail.length > 0 && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: text, lineHeight: 1 }}>
                      {group.activeAvail.length}/{activeTeams.length}
                    </span>
                  )
                )}

                {/* Right: team numbers on ONE horizontal scrollable line.
                    overflow-x:auto lets the user swipe/scroll if there are many
                    teams; the scrollbar is hidden visually (see .merged-team-scroll
                    CSS) but touch and trackpad scrolling still work. */}
                {showTeams && displayTeams.length > 0 && (
                  <div className="merged-team-scroll">
                    {displayTeams.map(tm => (
                      <span
                        key={tm.number}
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: text,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          lineHeight: 1,
                        }}
                      >
                        {tm.number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
