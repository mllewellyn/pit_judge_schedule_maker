/**
 * Mock FRC event data for local development without a TBA API key.
 *
 * Simulates: 2026 Spokane Regional (2026waspk)
 * Event day: current day, starting at 9:00 AM local time.
 * 20 qualification matches spread from 9:00 AM to 12:06 PM with a 42-minute lunch break.
 *
 * Judged teams: 254, 1678, 118, 148, 1114, 2056, 3015, 4414
 * Each plays exactly 5 qualification matches.
 *
 * With default settings (pre=10, post=5, min=15):
 *   - 24-min match gaps → merged unavailable (no interview window)
 *   - 32-min gaps → 7-min window (too short)
 *   - 40-min gaps → 15-min window (exactly enough)
 *   - 42-min lunch break creates a clear ~17-min shared window
 */

// Anchor: today at 9:00 AM local time (judges use this in their local timezone)
function todayAt(hoursOffset) {
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0)
  return Math.floor(base.getTime() / 1000) + hoursOffset * 60
}

// Match start times in minutes from 9:00 AM
const SCHEDULE_MINUTES = [
  0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88,
  // 42-minute lunch break (88 + 42 = 130)
  130, 138, 146, 154, 162, 170, 178, 186,
]

function makeMatch(num, minuteOffset, red, blue) {
  const startTs = todayAt(minuteOffset)
  return {
    key: `2026waspk_qm${num}`,
    comp_level: 'qm',
    match_number: num,
    alliances: {
      red:  { team_keys: red.map(n  => `frc${n}`),  score: null },
      blue: { team_keys: blue.map(n => `frc${n}`), score: null },
    },
    time: startTs,
    predicted_time: startTs,
    actual_time: null,
  }
}

// Match roster — each row: [matchNum, minuteOffset, redTeams, blueTeams]
// Filler teams (non-judged): 101, 202, 303, 404, 505, 606, 707
const MATCH_DEFS = [
  [1,   0,   [254, 101, 202],   [1678, 303, 404]],
  [2,   8,   [1114, 505, 606],  [148,  707, 101]],
  [3,  16,   [3015, 202, 303],  [2056, 404, 505]],
  [4,  24,   [4414, 606, 707],  [118,  101, 202]],
  [5,  32,   [254,  303, 404],  [1114, 505, 606]],
  [6,  40,   [1678, 707, 101],  [3015, 202, 303]],
  [7,  48,   [148,  404, 505],  [4414, 606, 707]],
  [8,  56,   [2056, 101, 202],  [254,  303, 404]],
  [9,  64,   [118,  505, 606],  [1678, 707, 101]],
  [10, 72,   [1114, 202, 303],  [148,  404, 505]],
  [11, 80,   [3015, 606, 707],  [2056, 101, 202]],
  [12, 88,   [4414, 303, 404],  [118,  505, 606]],
  // After lunch:
  [13, 130,  [254,  707, 101],  [1114, 202, 303]],
  [14, 138,  [1678, 404, 505],  [3015, 606, 707]],
  [15, 146,  [148,  101, 202],  [4414, 303, 404]],
  [16, 154,  [2056, 505, 606],  [118,  707, 101]],
  [17, 162,  [254,  202, 303],  [1678, 404, 505]],
  [18, 170,  [1114, 606, 707],  [148,  101, 202]],
  [19, 178,  [3015, 303, 404],  [2056, 505, 606]],
  [20, 186,  [4414, 707, 101],  [118,  202, 303]],
]

export const MOCK_MATCHES = MATCH_DEFS.map(([num, min, red, blue]) =>
  makeMatch(num, min, red, blue)
)

export const MOCK_EVENTS = [
  {
    key: '2026waspk',
    name: '2026 Spokane Regional',
    short_name: 'Spokane Regional',
    event_code: 'waspk',
    start_date: '2026-03-13',
    end_date: '2026-03-16',
    city: 'Spokane',
    state_prov: 'WA',
    country: 'USA',
  },
  {
    key: '2026casd',
    name: '2026 San Diego Regional',
    short_name: 'San Diego Regional',
    event_code: 'casd',
    start_date: '2026-03-13',
    end_date: '2026-03-16',
    city: 'San Diego',
    state_prov: 'CA',
    country: 'USA',
  },
  {
    key: '2026michi',
    name: '2026 Michigan State Championship',
    short_name: 'Michigan State',
    event_code: 'michi',
    start_date: '2026-04-08',
    end_date: '2026-04-11',
    city: 'Detroit',
    state_prov: 'MI',
    country: 'USA',
  },
]

export const MOCK_TEAMS = [
  { key: 'frc254',  team_number: 254,  nickname: 'The Cheesy Poofs' },
  { key: 'frc1678', team_number: 1678, nickname: 'Citrus Circuits' },
  { key: 'frc118',  team_number: 118,  nickname: 'Robonauts' },
  { key: 'frc148',  team_number: 148,  nickname: 'Robowranglers' },
  { key: 'frc1114', team_number: 1114, nickname: 'Simbotics' },
  { key: 'frc2056', team_number: 2056, nickname: 'OP Robotics' },
  { key: 'frc3015', team_number: 3015, nickname: 'Ranger Robotics' },
  { key: 'frc4414', team_number: 4414, nickname: 'HighTide' },
  // Filler teams also at the event (won't be judged but appear in match schedule)
  { key: 'frc101',  team_number: 101,  nickname: 'Team 101' },
  { key: 'frc202',  team_number: 202,  nickname: 'Team 202' },
  { key: 'frc303',  team_number: 303,  nickname: 'Team 303' },
  { key: 'frc404',  team_number: 404,  nickname: 'Team 404' },
  { key: 'frc505',  team_number: 505,  nickname: 'Team 505' },
  { key: 'frc606',  team_number: 606,  nickname: 'Team 606' },
  { key: 'frc707',  team_number: 707,  nickname: 'Team 707' },
]

// The suggested team list for the mock demo (comma-separated for the setup form)
export const MOCK_DEFAULT_TEAMS = '254, 1678, 118, 148, 1114, 2056, 3015, 4414'
export const MOCK_DEFAULT_EVENT_KEY = '2026waspk'
