import { useState } from 'react'
import AvailabilityTimeline from './AvailabilityTimeline.jsx'
import { teamAvailability } from '../utils/availability.js'
import { matchesForTeam } from '../api/tba.js'

export default function TeamView({ teams, matches, dayStart, dayEnd, settings, interviewed, onToggleInterviewed }) {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.number ?? '')

  const team = teams.find(t => t.number === Number(selectedTeam))
  const teamMatches = team ? matchesForTeam(matches, team.number) : []
  const available = team
    ? teamAvailability(teamMatches, dayStart, dayEnd, settings)
    : []

  return (
    <div>
      <div className="team-selector">
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(Number(e.target.value))}
          aria-label="Select team"
        >
          {teams.map(t => (
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
          />
        </>
      ) : (
        <p className="text-muted">Select a team above.</p>
      )}
    </div>
  )
}
