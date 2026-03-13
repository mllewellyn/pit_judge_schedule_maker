import { TBA_API_KEY, TBA_BASE } from '../config.js'

function headers() {
  return { 'X-TBA-Auth-Key': TBA_API_KEY }
}

async function tbaFetch(path) {
  const res = await fetch(`${TBA_BASE}${path}`, { headers: headers() })
  if (!res.ok) {
    throw new Error(`TBA API error ${res.status} for ${path}`)
  }
  return res.json()
}

/**
 * Returns all events for a given year in simple format.
 * Each entry: { key, name, short_name, event_code, start_date, end_date, city, state_prov, country }
 */
export async function fetchEvents(year) {
  return tbaFetch(`/events/${year}/simple`)
}

/**
 * Returns all teams registered at an event in simple format.
 * Each entry: { key, team_number, nickname, city, state_prov, country }
 */
export async function fetchEventTeams(eventKey) {
  return tbaFetch(`/event/${eventKey}/teams/simple`)
}

/**
 * Returns all matches for an event in simple format.
 * Each entry: { key, comp_level, match_number, alliances, time, predicted_time, actual_time }
 * time fields are Unix timestamps (seconds). null if not yet scheduled.
 */
export async function fetchMatches(eventKey) {
  return tbaFetch(`/event/${eventKey}/matches/simple`)
}

/**
 * Filter a matches array to only those involving a specific team number.
 */
export function matchesForTeam(matches, teamNumber) {
  const teamKey = `frc${teamNumber}`
  return matches.filter(m => {
    const { red, blue } = m.alliances
    return (
      red.team_keys.includes(teamKey) ||
      blue.team_keys.includes(teamKey)
    )
  })
}
