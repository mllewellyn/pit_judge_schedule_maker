import { MATCH_DURATION_MINUTES, DEFAULT_SETTINGS } from '../config.js'

const MIN_TO_SEC = 60

/**
 * Filters a TBA match list to only those scheduled on today's local calendar date.
 * Used for multi-day events so timelines only show the current competition day.
 */
export function filterTodayMatches(matches) {
  const todayStr = new Date().toDateString()
  return matches.filter(m => {
    const t = matchStartTime(m)
    return t != null && new Date(t * 1000).toDateString() === todayStr
  })
}

/**
 * Given a TBA match object, returns the best available start timestamp (seconds).
 * Priority: actual_time > predicted_time > time
 */
export function matchStartTime(match) {
  return match.actual_time ?? match.predicted_time ?? match.time
}

/**
 * Given a list of TBA match objects for a single team, returns sorted unavailable
 * windows as [startSec, endSec] pairs using the configured buffers.
 *
 * @param {object[]} matches - TBA match objects (already filtered to this team)
 * @param {object} settings
 * @param {number} settings.preMatchBuffer - minutes before match start that are blocked
 * @param {number} settings.postMatchBuffer - minutes after match end that are blocked
 * @returns {[number, number][]} sorted, merged unavailable windows in Unix seconds
 */
export function buildUnavailableWindows(matches, settings = {}) {
  const {
    preMatchBuffer = DEFAULT_SETTINGS.preMatchBuffer,
    postMatchBuffer = DEFAULT_SETTINGS.postMatchBuffer,
  } = settings

  const preSec = preMatchBuffer * MIN_TO_SEC
  const postSec = postMatchBuffer * MIN_TO_SEC
  const durationSec = MATCH_DURATION_MINUTES * MIN_TO_SEC

  const windows = matches
    .map(m => matchStartTime(m))
    .filter(t => t != null)
    .map(startTs => [
      startTs - preSec,
      startTs + durationSec + postSec,
    ])
    .sort((a, b) => a[0] - b[0])

  return mergeWindows(windows)
}

/**
 * Merges overlapping [start, end] windows. Input must be sorted by start.
 */
export function mergeWindows(sorted) {
  if (sorted.length === 0) return []
  const merged = [sorted[0].slice()]
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1])
    } else {
      merged.push(sorted[i].slice())
    }
  }
  return merged
}

/**
 * Given unavailable windows and the day's time range, returns available slots
 * of at least minInterviewDuration minutes.
 *
 * @param {[number, number][]} unavailableWindows - merged, sorted
 * @param {number} dayStart - Unix seconds for start of consideration window
 * @param {number} dayEnd - Unix seconds for end of consideration window
 * @param {object} settings
 * @param {number} settings.minInterviewDuration - minimum slot length in minutes
 * @returns {[number, number][]} available windows in Unix seconds
 */
export function buildAvailableSlots(unavailableWindows, dayStart, dayEnd, settings = {}) {
  const { minInterviewDuration = DEFAULT_SETTINGS.minInterviewDuration } = settings
  const minSec = minInterviewDuration * MIN_TO_SEC

  const available = []
  let cursor = dayStart

  for (const [unavStart, unavEnd] of unavailableWindows) {
    if (unavStart > cursor) {
      const slotEnd = Math.min(unavStart, dayEnd)
      if (slotEnd - cursor >= minSec) {
        available.push([cursor, slotEnd])
      }
    }
    cursor = Math.max(cursor, unavEnd)
  }

  // Gap after the last unavailable window
  if (cursor < dayEnd && dayEnd - cursor >= minSec) {
    available.push([cursor, dayEnd])
  }

  return available
}

/**
 * Top-level function: compute available interview slots for a single team.
 *
 * @param {object[]} teamMatches - TBA match objects for this team
 * @param {number} dayStart - Unix seconds
 * @param {number} dayEnd - Unix seconds
 * @param {object} settings
 * @returns {[number, number][]} available windows in Unix seconds
 */
export function teamAvailability(teamMatches, dayStart, dayEnd, settings = {}) {
  const unavailable = buildUnavailableWindows(teamMatches, settings)
  return buildAvailableSlots(unavailable, dayStart, dayEnd, settings)
}

/**
 * Compute the intersection of multiple teams' available slot arrays.
 * Returns windows where ALL teams are simultaneously available.
 *
 * @param {[number, number][][]} slotsPerTeam - array of available slot arrays
 * @returns {[number, number][]} shared available windows
 */
export function mergedAvailability(slotsPerTeam) {
  if (slotsPerTeam.length === 0) return []

  // Start with the first team's slots and intersect with each subsequent team
  let intersection = slotsPerTeam[0]

  for (let i = 1; i < slotsPerTeam.length; i++) {
    intersection = intersectSlots(intersection, slotsPerTeam[i])
  }

  return intersection
}

/**
 * Returns the intersection of two sorted available slot arrays.
 */
export function intersectSlots(aSlots, bSlots) {
  const result = []
  let ai = 0
  let bi = 0

  while (ai < aSlots.length && bi < bSlots.length) {
    const start = Math.max(aSlots[ai][0], bSlots[bi][0])
    const end = Math.min(aSlots[ai][1], bSlots[bi][1])
    if (start < end) {
      result.push([start, end])
    }
    if (aSlots[ai][1] < bSlots[bi][1]) {
      ai++
    } else {
      bi++
    }
  }

  return result
}

/**
 * Derive the day's time range from a list of all matches at an event.
 * Returns [earliest match start - 1 hour, latest match end + 1 hour] rounded to hour.
 */
export function deriveDayRange(allMatches) {
  const times = allMatches
    .map(m => matchStartTime(m))
    .filter(t => t != null)

  if (times.length === 0) {
    // Fallback: 8am–6pm today
    const now = new Date()
    const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    return [base / 1000 + 8 * 3600, base / 1000 + 18 * 3600]
  }

  const earliest = Math.min(...times)
  const latest = Math.max(...times) + MATCH_DURATION_MINUTES * MIN_TO_SEC

  // Round out to nearest hour
  const dayStart = Math.floor(earliest / 3600) * 3600 - 3600
  const dayEnd = Math.ceil(latest / 3600) * 3600 + 3600

  return [dayStart, dayEnd]
}
