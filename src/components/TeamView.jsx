import { useState, useMemo } from 'react'
import AvailabilityTimeline from './AvailabilityTimeline.jsx'
import { teamAvailability } from '../utils/availability.js'
import { matchesForTeam } from '../api/tba.js'

export default function TeamView({ teams, matches, dayStart, dayEnd, settings, lunchWindow, interviewed, onToggleInterviewed, nowSec }) {
  // Sort: non-interviewed first, interviewed at the back
  const sortedTeams = useMemo(() =>
    [...teams].sort((a, b) => {
      const ai = !!interviewed[a.number]
      const bi = !!interviewed[b.number]
      if (ai === bi) return 0
      return ai ? 1 : -1
    }),
    [teams, interviewed]
  )

  const [selectedTeam, setSelectedTeam] = useState(sortedTeams[0]?.number ?? '')

  const team = teams.find(t => t.number === Number(selectedTeam))
  const teamMatches = team ? matchesForTeam(matches, team.number) : []
  const available = team
    ? teamAvailability(teamMatches, dayStart, dayEnd, settings, lunchWindow)
    : []

  return (
    <div>
      <div className="team-selector">
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(Number(e.target.value))}
          aria-label="Select team"
        >
          {sortedTeams.map(t => (
            <option key={t.number} value={t.number}>
              {t.number}{t.nickname ? ` · ${t.nickname}` : ''}
              {interviewed[t.number] ? ' ✓' : ''}
            </option>
          ))}
        </select>

        {team && (
          <label className="interviewed-label">
            <input
              type="checkbox"
              checked={!!interviewed[team.number]}
              onChange={() => onToggleInterviewed(team.number)}
            />
            Interviewed
          </label>
        )}
      </div>

      {team ? (
        <>
          {available.length === 0 && (
            <p className="merged-empty">No available interview windows found for this team.</p>
          )}
          <AvailabilityTimeline
            matches={teamMatches}
            availableSlots={available}
            dayStart={dayStart}
            dayEnd={dayEnd}
            showAxis
            nowSec={nowSec}
            settings={settings}
          />
        </>
      ) : (
        <p className="text-muted">Select a team above.</p>
      )}
    </div>
  )
}
