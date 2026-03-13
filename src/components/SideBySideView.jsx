import { useMemo } from 'react'
import { teamAvailability, matchStartTime } from '../utils/availability.js'
import { matchesForTeam } from '../api/tba.js'
import { formatTime, PX_PER_HOUR } from './AvailabilityTimeline.jsx'
import { MATCH_DURATION_MINUTES } from '../config.js'

const HOUR = 3600
const COL_WIDTH = 100 // px — narrow enough for 3–4 columns on a phone

// A slot is yellow ('current') only when it has started but there is no longer
// enough time left for a full interview. If enough time remains it stays green.
function slotStatus(s, e, nowSec, minInterviewDuration) {
  if (!nowSec) return 'future'
  if (e <= nowSec) return 'past'
  if (s <= nowSec) {
    const remainingSec = e - nowSec
    return remainingSec < minInterviewDuration * 60 ? 'current' : 'future'
  }
  return 'future'
}

export default function SideBySideView({ teams, matches, dayStart, dayEnd, settings, lunchWindow, interviewed, onToggleInterviewed, nowSec }) {
  const totalSec = dayEnd - dayStart
  const totalPx = (totalSec / HOUR) * PX_PER_HOUR

  const ticks = useMemo(() => {
    const result = []
    const firstHour = Math.ceil(dayStart / HOUR) * HOUR
    for (let t = firstHour; t <= dayEnd; t += HOUR) result.push(t)
    return result
  }, [dayStart, dayEnd])

  function toPx(unix) {
    return ((unix - dayStart) / totalSec) * totalPx
  }

  function blockStyle(start, end) {
    const top = toPx(Math.max(start, dayStart))
    const bottom = toPx(Math.min(end, dayEnd))
    return { top, height: Math.max(bottom - top, 4) }
  }

  // Sort: non-interviewed teams first, interviewed teams at the back
  const sortedTeams = useMemo(() =>
    [...teams].sort((a, b) => {
      const ai = !!interviewed[a.number]
      const bi = !!interviewed[b.number]
      if (ai === bi) return 0
      return ai ? 1 : -1
    }),
    [teams, interviewed]
  )

  const teamData = useMemo(() => sortedTeams.map(t => {
    const tm = matchesForTeam(matches, t.number)
    const available = teamAvailability(tm, dayStart, dayEnd, settings, lunchWindow)
    const matchBlocks = tm
      .map(m => matchStartTime(m))
      .filter(x => x != null)
      .map(s => ({ start: s, end: s + MATCH_DURATION_MINUTES * 60 }))
    return { team: t, matchBlocks, available }
  }), [sortedTeams, matches, dayStart, dayEnd, settings])

  return (
    <div style={{ display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* Shared time axis */}
      <div style={{ flexShrink: 0, width: 48, position: 'relative', height: totalPx, marginTop: 44 }}>
        {ticks.map(t => (
          <div key={t} className="timeline-axis-label" style={{ top: toPx(t) }}>
            {formatTime(t)}
          </div>
        ))}
      </div>

      {/* Team columns */}
      <div className="side-by-side-container" style={{ flex: 1 }}>
        {teamData.map(({ team, matchBlocks, available }) => (
          <div
            key={team.number}
            className={`side-by-side-team${interviewed[team.number] ? ' interviewed' : ''}`}
            style={{ width: COL_WIDTH }}
          >
            <div className="side-by-side-team-header">
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{team.number}</div>
              {team.nickname && (
                <div style={{ fontSize: '0.6rem', color: 'var(--clr-text-muted)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {team.nickname}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', fontSize: '0.6rem', cursor: 'pointer', marginTop: '0.15rem' }}>
                <input
                  type="checkbox"
                  checked={!!interviewed[team.number]}
                  onChange={() => onToggleInterviewed(team.number)}
                  style={{ width: 13, height: 13, accentColor: 'var(--clr-available-light)', flexShrink: 0 }}
                />
                Done
              </label>
            </div>

            <div style={{ position: 'relative', height: totalPx }}>
              {ticks.map(t => (
                <div key={t} className="timeline-gridline" style={{ top: toPx(t) }} />
              ))}
              {matchBlocks.map((b, i) => (
                <div key={i} className="timeline-block match" style={blockStyle(b.start, b.end)}>
                  <span className="timeline-block-label">M</span>
                </div>
              ))}
              {available.map(([s, e], i) => {
                const status = slotStatus(s, e, nowSec, settings.minInterviewDuration ?? 15)
                return (
                  <div
                    key={i}
                    className={`timeline-block available ${status}`}
                    style={blockStyle(s, e)}
                    title={`${formatTime(s)}–${formatTime(e)}`}
                  />
                )
              })}
              {/* Current-time indicator */}
              {nowSec && nowSec >= dayStart && nowSec <= dayEnd && (
                <div className="timeline-now-line" style={{ top: toPx(nowSec) }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
