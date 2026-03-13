import { useState, useEffect, useCallback } from 'react'
import EventSearch from './EventSearch.jsx'
import TeamNumberInput, { parseTeamNumbers } from './TeamNumberInput.jsx'
import { fetchEvents, fetchEventTeams } from '../api/tba.js'
import { CURRENT_YEAR } from '../config.js'

export default function SetupForm({ savedEventKey, savedTeamsRaw, onLoad }) {
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState(null)

  const [eventKey, setEventKey] = useState(savedEventKey || '')
  const [eventName, setEventName] = useState('')

  const [roster, setRoster] = useState(null)
  const [rosterLoading, setRosterLoading] = useState(false)

  const [teamsRaw, setTeamsRaw] = useState(savedTeamsRaw || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch event list once on mount
  useEffect(() => {
    fetchEvents(CURRENT_YEAR)
      .then(data => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
        setEvents(sorted)
        // Resolve name for pre-saved event key
        if (savedEventKey) {
          const found = sorted.find(e => e.key === savedEventKey)
          if (found) setEventName(found.name)
        }
      })
      .catch(err => setEventsError(err.message))
      .finally(() => setEventsLoading(false))
  }, [savedEventKey])

  // Fetch roster whenever eventKey changes
  const loadRoster = useCallback((key) => {
    if (!key) { setRoster(null); return }
    setRosterLoading(true)
    fetchEventTeams(key)
      .then(setRoster)
      .catch(() => setRoster(null))
      .finally(() => setRosterLoading(false))
  }, [])

  // Load roster for pre-saved event on mount
  useEffect(() => {
    if (savedEventKey) loadRoster(savedEventKey)
  }, [savedEventKey, loadRoster])

  function handleEventSelect(key, eventObj) {
    setEventKey(key)
    setEventName(eventObj?.name || key)
    setError(null)
    loadRoster(key)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!eventKey) { setError('Please select an event.'); return }
    const teamNumbers = parseTeamNumbers(teamsRaw)
    if (teamNumbers.length === 0) { setError('Please enter at least one team number.'); return }

    setLoading(true)
    setError(null)
    try {
      onLoad({ eventKey, eventName, teamNumbers, teamsRaw })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="screen setup-screen">
      <div className="setup-header">
        <h1>FRC Pit Judge Scheduler</h1>
        <p>Track team interview availability during competition</p>
      </div>

      {eventsError && (
        <div className="error-msg">
          Could not load events list: {eventsError}. Check your TBA API key in config.js.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="event-search">Event</label>
          <EventSearch
            events={events}
            value={eventName || eventKey}
            onChange={handleEventSelect}
            loading={eventsLoading}
          />
          {eventKey && (
            <span className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
              Selected: <strong>{eventKey}</strong>
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="team-numbers">Assigned Team Numbers</label>
          <TeamNumberInput
            value={teamsRaw}
            onChange={setTeamsRaw}
            roster={roster}
            rosterLoading={rosterLoading}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? <><span className="spinner" /> Loading…</> : 'Load Schedule'}
        </button>
      </form>
    </div>
  )
}
