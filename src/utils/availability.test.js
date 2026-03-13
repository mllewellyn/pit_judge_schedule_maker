import { describe, it, expect } from 'vitest'
import {
  buildUnavailableWindows,
  buildAvailableSlots,
  mergeWindows,
  teamAvailability,
  mergedAvailability,
  intersectSlots,
} from './availability.js'

// All timestamps in Unix seconds.
// Base time: 9:00 AM (arbitrary anchor)
const T = (hours, minutes = 0) => 9 * 3600 + hours * 3600 + minutes * 60

// Helper to make a fake TBA match object
function makeMatch(startHour, startMin = 0) {
  return { predicted_time: T(startHour, startMin), actual_time: null, time: null }
}

const DEFAULT = { preMatchBuffer: 10, postMatchBuffer: 5, minInterviewDuration: 15 }

// ─── buildUnavailableWindows ──────────────────────────────────────────────────

describe('buildUnavailableWindows', () => {
  it('returns empty array for no matches', () => {
    expect(buildUnavailableWindows([], DEFAULT)).toEqual([])
  })

  it('produces correct window for a single match', () => {
    // Match at T(0,0) = 9:00. Window: [8:50, 9:15]
    const windows = buildUnavailableWindows([makeMatch(0)], DEFAULT)
    expect(windows).toHaveLength(1)
    expect(windows[0][0]).toBe(T(0) - 10 * 60)  // 8:50
    expect(windows[0][1]).toBe(T(0) + (10 + 5) * 60) // 9:15
  })

  it('merges overlapping windows from back-to-back matches', () => {
    // Match 1 at 9:00, match 2 at 9:20 — windows overlap
    const windows = buildUnavailableWindows([makeMatch(0), makeMatch(0, 20)], DEFAULT)
    expect(windows).toHaveLength(1)
  })

  it('does not merge well-separated matches', () => {
    // Match 1 at 9:00, match 2 at 10:30 — large gap between
    const windows = buildUnavailableWindows([makeMatch(0), makeMatch(1, 30)], DEFAULT)
    expect(windows).toHaveLength(2)
  })
})

// ─── mergeWindows ─────────────────────────────────────────────────────────────

describe('mergeWindows', () => {
  it('merges three overlapping windows into one', () => {
    const merged = mergeWindows([[0, 100], [50, 150], [120, 200]])
    expect(merged).toEqual([[0, 200]])
  })

  it('keeps non-overlapping windows separate', () => {
    const merged = mergeWindows([[0, 100], [200, 300]])
    expect(merged).toEqual([[0, 100], [200, 300]])
  })

  it('handles adjacent windows (touching, not overlapping)', () => {
    const merged = mergeWindows([[0, 100], [100, 200]])
    expect(merged).toEqual([[0, 200]])
  })
})

// ─── buildAvailableSlots ─────────────────────────────────────────────────────

describe('buildAvailableSlots', () => {
  const dayStart = T(-1)  // 8:00
  const dayEnd = T(9)     // 6:00 PM equivalent

  it('returns full day when no unavailable windows', () => {
    const slots = buildAvailableSlots([], dayStart, dayEnd, DEFAULT)
    expect(slots).toEqual([[dayStart, dayEnd]])
  })

  it('returns a 20-min gap as available', () => {
    // Unavailable: [8:00, 9:00] and [9:20, 10:00]. Gap: 9:00–9:20 = 20 min
    const unav = [[dayStart, T(0)], [T(0, 20), T(1)]]
    const slots = buildAvailableSlots(unav, dayStart, dayEnd, DEFAULT)
    expect(slots.some(([s, e]) => (e - s) >= 20 * 60)).toBe(true)
  })

  it('excludes a 14-min gap (below minInterviewDuration)', () => {
    // Gap of 14 minutes between windows
    const unav = [[dayStart, T(0)], [T(0, 14), T(1)]]
    const slots = buildAvailableSlots(unav, dayStart, dayEnd, DEFAULT)
    // The only gaps are before dayStart (none) and 14-min gap (excluded) and after T(1)
    expect(slots.every(([s, e]) => (e - s) >= 15 * 60)).toBe(true)
    // The 14-min gap specifically should not appear
    expect(slots.some(([s, e]) => s === T(0) && e === T(0, 14))).toBe(false)
  })

  it('returns empty when entire day is unavailable', () => {
    const slots = buildAvailableSlots([[dayStart, dayEnd]], dayStart, dayEnd, DEFAULT)
    expect(slots).toEqual([])
  })
})

// ─── teamAvailability with config changes ─────────────────────────────────────

describe('teamAvailability with configurable settings', () => {
  const dayStart = T(-1)
  const dayEnd = T(9)

  it('reducing preMatchBuffer from 10 to 5 can create a new available window', () => {
    // Two matches at 9:00 and 9:25. Gap between windows with preMatchBuffer=10:
    // Window 1 ends at 9:15, window 2 starts at 9:15 (9:25 - 10min). No gap.
    // With preMatchBuffer=5: window 2 starts at 9:20. Gap 9:15–9:20 = 5 min (still not 15).
    // Use matches 60 min apart instead to demonstrate buffer shrinking expands availability.
    // Match at 9:00 and 10:00. preMatchBuffer=10: gap = [9:15, 9:50] = 35 min ✓
    // preMatchBuffer=5: gap = [9:15, 9:55] = 40 min ✓ (bigger gap)
    const matches = [makeMatch(0), makeMatch(1)]
    const tight = { preMatchBuffer: 10, postMatchBuffer: 5, minInterviewDuration: 15 }
    const loose = { preMatchBuffer: 5, postMatchBuffer: 5, minInterviewDuration: 15 }

    const tightSlots = teamAvailability(matches, dayStart, dayEnd, tight)
    const looseSlots = teamAvailability(matches, dayStart, dayEnd, loose)

    // The gap between matches should be larger with smaller preMatchBuffer
    const tightGap = tightSlots.find(([s]) => s > T(0))
    const looseGap = looseSlots.find(([s]) => s > T(0))
    expect(looseGap[1] - looseGap[0]).toBeGreaterThan(tightGap[1] - tightGap[0])
  })

  it('increasing minInterviewDuration from 15 to 20 drops a 16-min window', () => {
    // Craft exactly a 16-min gap.
    // Match 1 ends (with buffers) at T(0) + 15min = T(0,15)
    // Match 2 starts blocking at T(0,31) - 10min = T(0,21)
    // Gap: T(0,15)–T(0,21) = 6 min (too small). Use bigger gap.
    // Match at 9:00 → blocked until 9:15. Match at 9:31 → blocked from 9:21.
    // Gap: 9:15–9:21 = 6 min. Too small. Use 26-min match spacing instead:
    // Match at 9:00 → blocked until 9:15. Match at 9:41 → blocked from 9:31.
    // Gap: 9:15–9:31 = 16 min. With minDuration=15 → available. With minDuration=20 → not.
    const m1 = makeMatch(0, 0)   // 9:00
    const m2 = makeMatch(0, 41)  // 9:41 → blocks from 9:31
    const matches = [m1, m2]

    const min15 = { preMatchBuffer: 10, postMatchBuffer: 5, minInterviewDuration: 15 }
    const min20 = { preMatchBuffer: 10, postMatchBuffer: 5, minInterviewDuration: 20 }

    const slots15 = teamAvailability(matches, dayStart, dayEnd, min15)
    const slots20 = teamAvailability(matches, dayStart, dayEnd, min20)

    // 16-min gap should appear with min=15
    const gap15 = slots15.find(([s, e]) => e - s >= 15 * 60 && e - s < 20 * 60)
    expect(gap15).toBeDefined()

    // Same gap should NOT appear with min=20
    const gap20 = slots20.find(([s, e]) => e - s >= 15 * 60 && e - s < 20 * 60)
    expect(gap20).toBeUndefined()
  })
})

// ─── mergedAvailability (intersection) ────────────────────────────────────────

describe('mergedAvailability', () => {
  it('returns empty for two teams with non-overlapping availability', () => {
    const teamA = [[T(0), T(1)]]     // 9:00–10:00
    const teamB = [[T(2), T(3)]]     // 11:00–12:00
    expect(mergedAvailability([teamA, teamB])).toEqual([])
  })

  it('returns shared window when teams have overlapping availability', () => {
    const teamA = [[T(0), T(2)]]     // 9:00–11:00
    const teamB = [[T(1), T(3)]]     // 10:00–12:00
    const shared = mergedAvailability([teamA, teamB])
    expect(shared).toEqual([[T(1), T(2)]])  // 10:00–11:00
  })

  it('returns the full shared window when one team is fully inside another', () => {
    const teamA = [[T(0), T(4)]]     // 9:00–1:00
    const teamB = [[T(1), T(2)]]     // 10:00–11:00
    const shared = mergedAvailability([teamA, teamB])
    expect(shared).toEqual([[T(1), T(2)]])
  })

  it('returns empty for three teams with no common window', () => {
    const teamA = [[T(0), T(2)]]
    const teamB = [[T(1), T(3)]]
    const teamC = [[T(4), T(5)]]
    expect(mergedAvailability([teamA, teamB, teamC])).toEqual([])
  })

  it('returns a single team\'s slots unchanged when only one team', () => {
    const teamA = [[T(0), T(1)], [T(2), T(3)]]
    expect(mergedAvailability([teamA])).toEqual(teamA)
  })
})

// ─── intersectSlots ───────────────────────────────────────────────────────────

describe('intersectSlots', () => {
  it('returns empty when no overlap', () => {
    expect(intersectSlots([[0, 10]], [[20, 30]])).toEqual([])
  })

  it('returns partial overlap correctly', () => {
    expect(intersectSlots([[0, 20]], [[10, 30]])).toEqual([[10, 20]])
  })

  it('handles multiple slots on each side', () => {
    const a = [[0, 10], [20, 30], [40, 50]]
    const b = [[5, 25], [35, 45]]
    const result = intersectSlots(a, b)
    expect(result).toEqual([[5, 10], [20, 25], [40, 45]])
  })
})
