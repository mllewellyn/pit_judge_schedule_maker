import { useState, useEffect, useCallback } from 'react'
import EventSearch from './EventSearch.jsx'
import TeamNumberInput, { parseTeamNumbers } from './TeamNumberInput.jsx'
import { fetchEvents, fetchEventTeams } from '../api/tba.js'
import { CURRENT_YEAR, MOCK_MODE } from '../config.js'
import { MOCK_DEFAULT_EVENT_KEY, MOCK_DEFAULT_TEAMS } from '../api/mockData.js'

export default function SetupForm({ savedEventKey, savedTeamsRaw, onLoad, onHelp }) {
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState(null)

  // In mock mode, pre-populate the demo event/teams if nothing is saved yet
  const defaultEventKey = savedEventKey || (MOCK_MODE ? MOCK_DEFAULT_EVENT_KEY : '')
  const defaultTeamsRaw = savedTeamsRaw || (MOCK_MODE ? MOCK_DEFAULT_TEAMS : '')

  const [eventKey, setEventKey] = useState(defaultEventKey)
  const [eventName, setEventName] = useState('')

  const [roster, setRoster] = useState(null)
  const [rosterLoading, setRosterLoading] = useState(false)

  const [teamsRaw, setTeamsRaw] = useState(defaultTeamsRaw)
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

  // Load roster for pre-saved or mock-default event on mount
  useEffect(() => {
    if (defaultEventKey) loadRoster(defaultEventKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        {onHelp && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onHelp}
            style={{ marginTop: '0.75rem' }}
          >
            ? How to use this app
          </button>
        )}
      </div>

      {MOCK_MODE && (
        <div className="card" style={{ marginBottom: '1rem', fontSize: '0.85rem', borderColor: 'var(--clr-primary)' }}>
          <strong>Mock mode active</strong> — using local demo data. Event and teams are pre-filled.
        </div>
      )}

      {eventsError && !MOCK_MODE && (
        <div className="error-msg">
          Could not load events list: {eventsError}
          <br />
          Add your TBA key to <code>.env.local</code> or run <code>npm run dev:mock</code> to use demo data.
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
