import { useMemo } from 'react'
import { matchStartTime } from '../utils/availability.js'
import { MATCH_DURATION_MINUTES } from '../config.js'

const HOUR = 3600
const PX_PER_HOUR = 80  // height in px per hour of event day

function formatTime(unix) {
  const d = new Date(unix * 1000)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return `${h12}:${m}${ampm}`
}

/**
 * Renders a vertical timeline for one team.
 *
 * @param {object[]} matches - TBA match objects for this team
 * @param {[number, number][]} availableSlots - computed available windows
 * @param {number} dayStart - Unix seconds
 * @param {number} dayEnd - Unix seconds
 * @param {boolean} showAxis - whether to render the time axis labels
 * @param {number} totalDaySec - total seconds in the day view (dayEnd - dayStart)
 */
export default function AvailabilityTimeline({
  matches = [],
  availableSlots = [],
  dayStart,
  dayEnd,
  showAxis = true,
}) {
  const totalSec = dayEnd - dayStart
  const totalPx = (totalSec / HOUR) * PX_PER_HOUR

  // Build hour tick marks
  const ticks = useMemo(() => {
    const result = []
    // Start at first full hour at or after dayStart
    const firstHour = Math.ceil(dayStart / HOUR) * HOUR
    for (let t = firstHour; t <= dayEnd; t += HOUR) {
      result.push(t)
    }
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

  // Match blocks (unavailable)
  const matchBlocks = useMemo(() => matches
    .map(m => matchStartTime(m))
    .filter(t => t != null)
    .map(startTs => ({
      start: startTs,
      end: startTs + MATCH_DURATION_MINUTES * 60,
    })), [matches])

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
          <div
            key={t}
            className="timeline-gridline"
            style={{ top: toPx(t) }}
          />
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

        {/* Available blocks */}
        {availableSlots.map(([s, e], i) => (
          <div
            key={i}
            className="timeline-block available"
            style={blockStyle(s, e)}
            title={`Available ${formatTime(s)} – ${formatTime(e)}`}
          >
            <span className="timeline-block-label">
              {formatTime(s)}–{formatTime(e)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { formatTime, PX_PER_HOUR }
