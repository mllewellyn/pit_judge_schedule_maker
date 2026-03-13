// Live network smoke test — skipped in CI.
// Run manually: npm run test -- --reporter=verbose
// Uses 2025casd (San Diego Regional 2025), a completed event with published data.

import { describe, it, expect } from 'vitest'
import { fetchEvents, fetchEventTeams, fetchMatches } from './tba.js'

describe.skip('TBA API smoke tests (live network)', () => {
  it('fetchEvents returns events with required fields', async () => {
    const events = await fetchEvents(2025)
    expect(Array.isArray(events)).toBe(true)
    expect(events.length).toBeGreaterThan(0)
    const event = events[0]
    expect(event).toHaveProperty('key')
    expect(event).toHaveProperty('name')
    expect(event).toHaveProperty('event_code')
  })

  it('fetchEventTeams returns teams with required fields', async () => {
    const teams = await fetchEventTeams('2025casd')
    expect(Array.isArray(teams)).toBe(true)
    expect(teams.length).toBeGreaterThan(0)
    const team = teams[0]
    expect(team).toHaveProperty('team_number')
    expect(team).toHaveProperty('nickname')
  })

  it('fetchMatches returns matches with required fields', async () => {
    const matches = await fetchMatches('2025casd')
    expect(Array.isArray(matches)).toBe(true)
    expect(matches.length).toBeGreaterThan(0)
    const match = matches[0]
    expect(match).toHaveProperty('key')
    expect(match).toHaveProperty('alliances')
    expect(match.alliances).toHaveProperty('red')
    expect(match.alliances).toHaveProperty('blue')
    expect(match.alliances.red).toHaveProperty('team_keys')
    expect(match.alliances.blue).toHaveProperty('team_keys')
    // At least one time field must be present
    const hasTime = match.time != null || match.predicted_time != null || match.actual_time != null
    expect(hasTime).toBe(true)
  })
})
