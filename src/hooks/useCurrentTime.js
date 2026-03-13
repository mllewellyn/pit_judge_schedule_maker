import { useState, useEffect } from 'react'
import { MOCK_MODE } from '../config.js'
import { MOCK_NOW_SEC } from '../api/mockData.js'

/**
 * Returns the current time as Unix seconds, re-rendering every `intervalMs`
 * milliseconds so timelines stay live without a full page refresh.
 *
 * In mock mode the clock is frozen at the midpoint of the mock event day so
 * the now-line and past/current/future slot colours are all visible at once.
 */
export function useCurrentTime(intervalMs = 30_000) {
  const [now, setNow] = useState(() => MOCK_MODE ? MOCK_NOW_SEC : Date.now() / 1000)

  useEffect(() => {
    if (MOCK_MODE) return  // frozen — no interval needed
    const id = setInterval(() => setNow(Date.now() / 1000), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
