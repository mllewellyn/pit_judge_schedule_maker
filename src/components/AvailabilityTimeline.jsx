import { useMemo } from 'react'
import { matchStartTime } from '../utils/availability.js'
import { MATCH_DURATION_MINUTES } from '../config.js'

const HOUR = 3600
const PX_PER_HOUR = 80  // height in px per hour of event day

export function formatTime(unix) {
  const d = new Date(unix * 1000)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return `${h12}:${m}${ampm}`
}

/**
 * Classify an available slot relative to current time.
 * A slot is 'current' (yellow) only when it has started AND there is no longer
 * enough time left for a full interview — matching the side-by-side view logic.
 */
function slotStatus(s, e, nowSec, minInterviewDuration) {
  if (!nowSec) return 'future'
  if (e <= nowSec) return 'past'
  if (s <= nowSec) {
    return (e - nowSec) < minInterviewDuration * 60 ? 'current' : 'future'
  }
  return 'future'
}

/**
 * Renders a vertical timeline for one team.
 *
 * @param {object[]} matches      - TBA match objects for this team
 * @param {[number,number][]} availableSlots - computed available windows
 * @param {number}  dayStart      - Unix seconds start of view
 * @param {number}  dayEnd        - Unix seconds end of view
 * @param {boolean} showAxis      - whether to render time-axis labels
 * @param {number}  [nowSec]      - current time in Unix seconds for live indicator
 */
export default function AvailabilityTimeline({
  matches = [],
  availableSlots = [],
  dayStart,
  dayEnd,
  showAxis = true,
  nowSec,
  settings = {},
}) {
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

  const matchBlocks = useMemo(() => matches
    .map(m => matchStartTime(m))
    .filter(t => t != null)
    .map(startTs => ({
      start: startTs,
      end: startTs + MATCH_DURATION_MINUTES * 60,
    })), [matches])

  const showNowLine = nowSec && nowSec >= dayStart && nowSec <= dayEnd

  return (
    <div className="timeline-wrap" style={{ height: totalPx }}>
      {showAxis && (
        <div className="timeline-axis" style={{ height: totalPx }}>
          {ticks.map(t => (
            <div
              key={t}
              className="timeline-axis-label"
              style={{ top: toPx(t) }}
            >
              {formatTime(t)}
            </div>
          ))}
        </div>
      )}

      <div className="timeline-col" style={{ height: totalPx, position: 'relative' }}>
        {/* Hour gridlines */}
        {ticks.map(t => (
          <div key={t} className="timeline-gridline" style={{ top: toPx(t) }} />
        ))}

        {/* Match (unavailable) blocks */}
        {matchBlocks.map((b, i) => (
          <div
            key={i}
            className="timeline-block match"
            style={blockStyle(b.start, b.end)}
          >
            <span className="timeline-block-label">Match</span>
          </div>
        ))}

        {/* Available blocks — colour-coded by past / in-progress / future */}
        {availableSlots.map(([s, e], i) => {
          const status = slotStatus(s, e, nowSec, settings.minInterviewDuration ?? 15)
          return (
            <div
              key={i}
              className={`timeline-block available ${status}`}
              style={blockStyle(s, e)}
              title={`Available ${formatTime(s)} – ${formatTime(e)}${status === 'past' ? ' (past)' : status === 'current' ? ' (now)' : ''}`}
            >
              <span className="timeline-block-label">
                {formatTime(s)}–{formatTime(e)}
              </span>
            </div>
          )
        })}

        {/* Current-time indicator */}
        {showNowLine && (
          <div className="timeline-now-line" style={{ top: toPx(nowSec) }}>
            <span className="timeline-now-label">now</span>
          </div>
        )}
      </div>
    </div>
  )
}

export { PX_PER_HOUR }
