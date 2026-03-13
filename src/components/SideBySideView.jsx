import { useMemo } from 'react'
import { teamAvailability, matchStartTime } from '../utils/availability.js'
import { matchesForTeam } from '../api/tba.js'
import { formatTime, PX_PER_HOUR } from './AvailabilityTimeline.jsx'
import { MATCH_DURATION_MINUTES } from '../config.js'

const HOUR = 3600

export default function SideBySideView({ teams, matches, dayStart, dayEnd, settings, interviewed, onToggleInterviewed }) {
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

  const teamData = useMemo(() => teams.map(t => {
    const tm = matchesForTeam(matches, t.number)
    const available = teamAvailability(tm, dayStart, dayEnd, settings)
    const matchBlocks = tm
      .map(m => matchStartTime(m))
      .filter(x => x != null)
      .map(s => ({ start: s, end: s + MATCH_DURATION_MINUTES * 60 }))
    return { team: t, matchBlocks, available }
  }), [teams, matches, dayStart, dayEnd, settings])

  return (
    <div style={{ display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* Shared time axis */}
      <div style={{ flexShrink: 0, width: 52, position: 'relative', height: totalPx, marginTop: 40 }}>
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
          >
            <div className="side-by-side-team-header">
              <div>{team.number}</div>
              {team.nickname && (
                <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontWeight: 400 }}>
                  {team.nickname}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.65rem', cursor: 'pointer', marginTop: '0.2rem' }}>
                <input
                  type="checkbox"
                  checked={!!interviewed[team.number]}
                  onChange={() => onToggleInterviewed(team.number)}
                  style={{ width: 14, height: 14, accentColor: 'var(--clr-available-light)' }}
                />
                Done
              </label>
            </div>

            <div style={{ position: 'relative', height: totalPx }}>
              {/* Gridlines */}
              {ticks.map(t => (
                <div key={t} className="timeline-gridline" style={{ top: toPx(t) }} />
              ))}

              {/* Match blocks */}
              {matchBlocks.map((b, i) => (
                <div key={i} className="timeline-block match" style={blockStyle(b.start, b.end)}>
                  <span className="timeline-block-label">M</span>
                </div>
              ))}

              {/* Available blocks */}
              {available.map(([s, e], i) => (
                <div
                  key={i}
                  className="timeline-block available"
                  style={blockStyle(s, e)}
                  title={`${formatTime(s)}–${formatTime(e)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
