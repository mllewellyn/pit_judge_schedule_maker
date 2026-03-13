import { useState, useEffect, useCallback } from 'react'
import SetupForm from './components/SetupForm.jsx'
import TabBar from './components/TabBar.jsx'
import TeamView from './components/TeamView.jsx'
import MergedView from './components/MergedView.jsx'
import SideBySideView from './components/SideBySideView.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import RefreshButton from './components/RefreshButton.jsx'
import { fetchMatches } from './api/tba.js'
import { fetchEventTeams } from './api/tba.js'
import { deriveDayRange } from './utils/availability.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { DEFAULT_SETTINGS } from './config.js'

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

  // Schedule-screen state (not persisted — re-fetched on load)
  const [screen, setScreen] = useState(
    savedEventKey && savedTeamsRaw ? 'schedule' : 'setup'
  )
  const [teams,       setTeams]       = useState([])  // [{ number, nickname }]
  const [matches,     setMatches]     = useState([])
  const [dayStart,    setDayStart]    = useState(null)
  const [dayEnd,      setDayEnd]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [fetchError,  setFetchError]  = useState(null)
  const [lastFetched, setLastFetched] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [currentEventKey, setCurrentEventKey] = useState(savedEventKey || '')

  // Auto-load schedule when restoring from localStorage
  useEffect(() => {
    if (savedEventKey && savedTeamsRaw) {
      loadSchedule(savedEventKey, savedTeamsRaw, savedEventName)
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

      // Parse team numbers from stored raw string
      const numbers = teamsRaw
        .split(/[\n,]+/)
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n))

      // Build teams list with nicknames from roster
      const rosterMap = {}
      rosterData.forEach(t => { rosterMap[t.team_number] = t.nickname })
      const teamList = numbers.map(n => ({ number: n, nickname: rosterMap[n] || null }))

      const [ds, de] = deriveDayRange(matchData)
      setMatches(matchData)
      setTeams(teamList)
      setDayStart(ds)
      setDayEnd(de)
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
    setInterviewed(prev => ({
      ...prev,
      [teamNumber]: !prev[teamNumber],
    }))
  }

  function handleSettings(next) {
    setSettings(next)
  }

  function goToSetup() {
    setScreen('setup')
  }

  const ready = !loading && matches.length > 0 && teams.length > 0 && dayStart && dayEnd

  return (
    <div className="app">
      {screen === 'setup' ? (
        <SetupForm
          savedEventKey={savedEventKey}
          savedTeamsRaw={savedTeamsRaw}
          onLoad={handleSetupLoad}
        />
      ) : (
        <>
          <div className="screen">
            <div className="schedule-header">
              <h2>{savedEventName || currentEventKey}</h2>
              <div className="flex-gap" style={{ alignItems: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={goToSetup}>
                  ✏ Edit
                </button>
                <RefreshButton
                  onRefresh={handleRefresh}
                  loading={loading}
                  lastFetched={lastFetched}
                />
              </div>
            </div>

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
                matches={matches}
                dayStart={dayStart}
                dayEnd={dayEnd}
                settings={settings}
                interviewed={interviewed}
                onToggleInterviewed={handleToggleInterviewed}
              />
            )}

            {ready && activeTab === 'merged' && (
              <MergedView
                teams={teams}
                matches={matches}
                dayStart={dayStart}
                dayEnd={dayEnd}
                settings={settings}
              />
            )}

            {ready && activeTab === 'side' && (
              <SideBySideView
                teams={teams}
                matches={matches}
                dayStart={dayStart}
                dayEnd={dayEnd}
                settings={settings}
                interviewed={interviewed}
                onToggleInterviewed={handleToggleInterviewed}
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
              onChange={handleSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
