import AvailabilityTimeline from './AvailabilityTimeline.jsx'
import { teamAvailability, mergedAvailability } from '../utils/availability.js'
import { matchesForTeam } from '../api/tba.js'

export default function MergedView({ teams, matches, dayStart, dayEnd, settings }) {
  const slotsPerTeam = teams.map(t =>
    teamAvailability(matchesForTeam(matches, t.number), dayStart, dayEnd, settings)
  )

  const shared = mergedAvailability(slotsPerTeam)

  return (
    <div>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        Green windows show when <strong>all {teams.length} teams</strong> are simultaneously available for an interview.
      </p>

      {shared.length === 0 ? (
        <div className="merged-empty">
          <p>No shared availability windows found.</p>
          <p className="mt-1" style={{ fontSize: '0.8rem' }}>
            Try adjusting the buffer settings or check the Side-by-Side view for individual availability.
          </p>
        </div>
      ) : (
        <AvailabilityTimeline
          matches={[]}
          availableSlots={shared}
          dayStart={dayStart}
          dayEnd={dayEnd}
          showAxis
        />
      )}
    </div>
  )
}
