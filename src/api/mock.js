/**
 * Mock implementations of the TBA API functions.
 * Returns static data from mockData.js with a simulated network delay.
 * Activated when VITE_MOCK_MODE=true.
 */

import { MOCK_EVENTS, MOCK_TEAMS, MOCK_MATCHES } from './mockData.js'

const MOCK_DELAY_MS = 400

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchEventsMock(_year) {
  await delay(MOCK_DELAY_MS)
  return MOCK_EVENTS
}

export async function fetchEventTeamsMock(_eventKey) {
  await delay(MOCK_DELAY_MS)
  return MOCK_TEAMS
}

export async function fetchMatchesMock(_eventKey) {
  await delay(MOCK_DELAY_MS)
  return MOCK_MATCHES
}
