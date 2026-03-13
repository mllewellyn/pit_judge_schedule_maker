import { useState, useEffect, useMemo } from 'react'
import SetupForm from './components/SetupForm.jsx'
import TabBar from './components/TabBar.jsx'
import TeamView from './components/TeamView.jsx'
import MergedView from './components/MergedView.jsx'
import SideBySideView from './components/SideBySideView.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import HelpPanel from './components/HelpPanel.jsx'
import SharePanel from './components/SharePanel.jsx'
import RefreshButton from './components/RefreshButton.jsx'
import { fetchMatches } from './api/tba.js'
import { fetchEventTeams } from './api/tba.js'
import { deriveDayRange, filterTodayMatches } from './utils/availability.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useCurrentTime } from './hooks/useCurrentTime.js'
import { DEFAULT_SETTINGS, MOCK_MODE } from './config.js'
import { MOCK_DEFAULT_EVENT_KEY, MOCK_DEFAULT_TEAMS } from './api/mockData.js'

const LS_EVENT_KEY   = 'pitjudge_event_key'
const LS_EVENT_NAME  = 'pitjudge_event_name'
const LS_TEAMS_RAW   = 'pitjudge_teams_raw'
const LS_INTERVIEWED = 'pitjudge_interviewed'
const LS_SETTINGS    = 'pitjudge_settings'
const LS_TAB         = 'pitjudge_tab'

export default function App() {
  const [savedEventKey,  setSavedEventKey]  = useLocalStorage(LS_EVENT_KEY,  '')
  const [savedEventName, setSavedEventName] = useLocalStorage(LS_EVENT_NAME, '')
  const [savedTeamsRaw,  setSavedTeamsRaw]  = useLocalStorage(LS_TEAMS_RAW,  '')
  const [interviewed,    setInterviewed]    = useLocalStorage(LS_INTERVIEWED, {})
  const [settings,       setSettings]       = useLocalStorage(LS_SETTINGS,   DEFAULT_SETTINGS)
  const [activeTab,      setActiveTab]      = useLocalStorage(LS_TAB,        'team')

  const hasRestoredSession = savedEventKey && savedTeamsRaw
  const [screen, setScreen] = useState(
    hasRestoredSession || MOCK_MODE ? 'schedule' : 'setup'
  )
  const [teams,       setTeams]       = useState([])
  const [matches,     setMatches]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [fetchError,  setFetchError]  = useState(null)
  const [lastFetched, setLastFetched] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp,     setShowHelp]     = useState(false)
  const [showShare,    setShowShare]    = useState(false)
  const [currentEventKey, setCurrentEventKey] = useState(savedEventKey || '')

  // Live current-time — updates every 30 s so the now-line and slot colours stay fresh
  const nowSec = useCurrentTime(30_000)

  // Filter matches to today's competition day (supports multi-day events)
  const todayMatches = useMemo(() => filterTodayMatches(matches), [matches])

  // Derive the visible day range from today's matches only
  const [dayStart, dayEnd] = useMemo(() => {
    if (todayMatches.length > 0) return deriveDayRange(todayMatches)
    // Fall back to all-event range if no matches today (e.g. wrong day)
    if (matches.length > 0) return deriveDayRange(matches)
    return [0, 0]
  }, [todayMatches, matches])

  const ready = !loading && todayMatches.length > 0 && teams.length > 0 && dayStart && dayEnd

  // ── On mount: check for URL share params, then localStorage / mock ──────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlEvent = params.get('event')
    const urlTeams = params.get('teams')
    const urlDone  = params.get('done')

    if (urlEvent) {
      // A share link was opened — bootstrap from URL params
      if (urlDone) {
        const doneObj = Object.fromEntries(
          urlDone.split(',').filter(Boolean).map(n => [parseInt(n, 10), true])
        )
        setInterviewed(doneObj)
      }
      const teamsRaw = urlTeams
        ? urlTeams.split(',').join('\n')
        : savedTeamsRaw
      setSavedEventKey(urlEvent)
      if (teamsRaw) setSavedTeamsRaw(teamsRaw)
      // Remove params so a manual refresh doesn't override progress
      window.history.replaceState({}, '', window.location.pathname)
      if (teamsRaw) {
        loadSchedule(urlEvent, teamsRaw, '')
      } else {
        setScreen('setup')
      }
      return
    }

    // Normal start: restore from localStorage or mock defaults
    const eventKey = savedEventKey || (MOCK_MODE ? MOCK_DEFAULT_EVENT_KEY : '')
    const teamsRaw = savedTeamsRaw || (MOCK_MODE ? MOCK_DEFAULT_TEAMS : '')
    if (eventKey && teamsRaw) {
      if (!savedEventKey) setSavedEventKey(eventKey)
      if (!savedTeamsRaw) setSavedTeamsRaw(teamsRaw)
      loadSchedule(eventKey, teamsRaw, savedEventName)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSchedule(eventKey, teamsRaw, eventName) {
    setLoading(true)
    setFetchError(null)
    try {
      const [matchData, rosterData] = await Promise.all([
        fetchMatches(eventKey),
        fetchEventTeams(eventKey).catch(() => []),
      ])

      const numbers = teamsRaw
        .split(/[\n,]+/)
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n))

      const rosterMap = {}
      rosterData.forEach(t => { rosterMap[t.team_number] = t.nickname })
      const teamList = numbers.map(n => ({ number: n, nickname: rosterMap[n] || null }))

      setMatches(matchData)
      setTeams(teamList)
      setCurrentEventKey(eventKey)
      setLastFetched(Date.now())
      setScreen('schedule')
    } catch (err) {
      setFetchError(err.message)
      setScreen('schedule')
    } finally {
      setLoading(false)
    }
  }

  function handleSetupLoad({ eventKey, eventName, teamNumbers, teamsRaw }) {
    setSavedEventKey(eventKey)
    setSavedEventName(eventName)
    setSavedTeamsRaw(teamsRaw)
    loadSchedule(eventKey, teamsRaw, eventName)
  }

  function handleRefresh() {
    if (currentEventKey && savedTeamsRaw) {
      loadSchedule(currentEventKey, savedTeamsRaw, savedEventName)
    }
  }

  function handleToggleInterviewed(teamNumber) {
    setInterviewed(prev => ({ ...prev, [teamNumber]: !prev[teamNumber] }))
  }

  return (
    <div className="app">
      {screen === 'setup' ? (
        <>
          <SetupForm
            savedEventKey={savedEventKey}
            savedTeamsRaw={savedTeamsRaw}
            onLoad={handleSetupLoad}
            onHelp={() => setShowHelp(true)}
          />
          {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
        </>
      ) : (
        <>
          <div className="screen">
            <div className="schedule-header">
              <h2>
                {savedEventName || currentEventKey}
                {MOCK_MODE && (
                  <span className="badge badge-warn" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                    MOCK
                  </span>
                )}
              </h2>
              <div className="flex-gap" style={{ alignItems: 'center' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowHelp(true)}
                  aria-label="Open help"
                  title="How to use this app"
                >
                  ?
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowShare(true)}
                  aria-label="Share schedule"
                  title="Copy a share link"
                  disabled={!currentEventKey}
                >
                  ↗
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setScreen('setup')}>
                  ✏ Edit
                </button>
                <RefreshButton
                  onRefresh={handleRefresh}
                  loading={loading}
                  lastFetched={lastFetched}
                />
              </div>
            </div>

            {/* Warn when today has no matches (e.g. practice day or wrong date) */}
            {!loading && matches.length > 0 && todayMatches.length === 0 && (
              <div className="error-msg" style={{ borderColor: 'var(--clr-primary)', color: 'var(--clr-primary)' }}>
                No matches scheduled for today. Showing all-event data.
              </div>
            )}

            {fetchError && (
              <div className="error-msg">
                Error loading schedule: {fetchError}
                <br />
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={handleRefresh}>
                  Try again
                </button>
              </div>
            )}

            {loading && !ready && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--clr-text-muted)' }}>
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                <p className="mt-1">Loading schedule…</p>
              </div>
            )}

            {ready && activeTab === 'team' && (
              <TeamView
                teams={teams}
                matches={todayMatches}
                dayStart={dayStart}
                dayEnd={dayEnd}
                settings={settings}
                interviewed={interviewed}
                onToggleInterviewed={handleToggleInterviewed}
                nowSec={nowSec}
              />
            )}

            {ready && activeTab === 'merged' && (
              <MergedView
                teams={teams}
                matches={todayMatches}
                dayStart={dayStart}
                dayEnd={dayEnd}
                settings={settings}
                interviewed={interviewed}
                onToggleInterviewed={handleToggleInterviewed}
                nowSec={nowSec}
              />
            )}

            {ready && activeTab === 'side' && (
              <SideBySideView
                teams={teams}
                matches={todayMatches}
                dayStart={dayStart}
                dayEnd={dayEnd}
                settings={settings}
                interviewed={interviewed}
                onToggleInterviewed={handleToggleInterviewed}
                nowSec={nowSec}
              />
            )}
          </div>

          <TabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSettings={() => setShowSettings(true)}
          />

          {showSettings && (
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onClose={() => setShowSettings(false)}
            />
          )}

          {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}

          {showShare && (
            <SharePanel
              eventKey={currentEventKey}
              teams={teams}
              interviewed={interviewed}
              onClose={() => setShowShare(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
