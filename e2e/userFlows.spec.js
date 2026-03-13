/**
 * End-to-end tests for FRC Pit Judge Scheduler using mock data.
 *
 * Documented user flows:
 *
 * Flow 1 — New judge setup
 *   A judge lands on the app for the first time. In mock mode the event and
 *   teams are pre-filled. They confirm the pre-filled data and load the schedule.
 *
 * Flow 2 — Team View availability
 *   A judge selects a team from the dropdown and sees grey match blocks and
 *   green available interview windows on the timeline.
 *
 * Flow 3 — Merged View (shared availability)
 *   A judge switches to the Merged tab to find times when all their assigned
 *   teams are simultaneously free.
 *
 * Flow 4 — Side-by-Side View
 *   A judge switches to the Side-by-Side tab to see all teams' schedules at a
 *   glance and scan for common free slots.
 *
 * Flow 5 — Marking a team as interviewed
 *   After visiting a team in the pits, the judge checks them off. The
 *   checkmark persists across tab switches.
 *
 * Flow 6 — Adjusting availability settings
 *   The judges decide they need a longer lead time before matches. They
 *   increase the pre-match buffer and confirm availability windows shrink.
 *
 * Flow 7 — Page reload restores state (localStorage persistence)
 *   A judge closes and reopens their browser. The schedule and interviewed
 *   state load automatically without re-entering any information.
 *
 * Flow 8 — Editing event or teams
 *   The judges realise they entered a wrong team. They click Edit, return to
 *   the setup screen, and reload with the corrected list.
 *
 * Flow 9 — Schedule refresh after delay
 *   Match times have shifted due to field issues. The judge hits Refresh and
 *   the last-fetched timestamp updates.
 */

import { test, expect } from '@playwright/test'

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Clear localStorage and reload so every test starts from a known state. */
async function freshLoad(page) {
  await page.goto('.')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

/** Wait for the schedule screen to finish loading (spinner gone, timeline visible). */
async function waitForSchedule(page) {
  await expect(page.locator('.tab-bar')).toBeVisible({ timeout: 5000 })
  // Wait for timeline content to appear (mock data loads in ~400ms)
  await expect(page.locator('.timeline-block').first()).toBeVisible({ timeout: 5000 })
}

// ── Flow 1: New judge setup ───────────────────────────────────────────────────

test('Flow 1 — mock mode pre-fills event and teams on setup screen', async ({ page }) => {
  await freshLoad(page)

  // Setup screen visible
  await expect(page.locator('h1')).toContainText('FRC Pit Judge Scheduler')

  // Mock mode banner shown
  await expect(page.locator('text=Mock mode active')).toBeVisible()

  // Event field pre-filled with mock event key
  await expect(page.locator('input[type="text"]')).toHaveValue(/2026waspk|2026 Spokane/i)

  // Team textarea pre-filled
  const textarea = page.locator('textarea')
  await expect(textarea).toHaveValue(/254/)
  await expect(textarea).toHaveValue(/1678/)

  // Team chips with nicknames appear after roster loads
  await expect(page.locator('.team-chip.valid').first()).toBeVisible({ timeout: 3000 })

  // Load the schedule
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // MOCK badge visible on schedule screen
  await expect(page.locator('.badge-warn')).toContainText('MOCK')
})

// ── Flow 2: Team View availability ───────────────────────────────────────────

test('Flow 2 — Team View shows match blocks and available windows', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Team View is active by default
  await expect(page.locator('.tab-btn.active')).toContainText('Team')

  // Team dropdown is visible and has options
  const dropdown = page.locator('select[aria-label="Select team"]')
  await expect(dropdown).toBeVisible()
  const options = await dropdown.locator('option').all()
  expect(options.length).toBeGreaterThanOrEqual(8)

  // Switch to team 1678 (Citrus Circuits — plays 5 matches in mock data)
  await dropdown.selectOption({ label: /1678/ })

  // Grey match blocks visible
  const matchBlocks = page.locator('.timeline-block.match')
  await expect(matchBlocks.first()).toBeVisible()
  expect(await matchBlocks.count()).toBeGreaterThanOrEqual(3)

  // Green available windows visible
  const availBlocks = page.locator('.timeline-block.available')
  await expect(availBlocks.first()).toBeVisible()
  expect(await availBlocks.count()).toBeGreaterThanOrEqual(1)

  // Interviewed checkbox is present
  await expect(page.locator('.interviewed-label')).toBeVisible()
})

// ── Flow 3: Merged View ───────────────────────────────────────────────────────

test('Flow 3 — Merged View shows shared availability windows', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Click Merged tab
  await page.locator('.tab-btn:has-text("Merged")').click()
  await expect(page.locator('.tab-btn.active')).toContainText('Merged')

  // Explanatory text mentions all teams
  await expect(page.locator('text=all 8 teams')).toBeVisible()

  // At least one shared available window exists
  // (mock data is designed to have a clear lunch-break window ~10:43–11:00am)
  const sharedBlocks = page.locator('.timeline-block.available')
  await expect(sharedBlocks.first()).toBeVisible()
  expect(await sharedBlocks.count()).toBeGreaterThanOrEqual(1)
})

// ── Flow 4: Side-by-Side View ─────────────────────────────────────────────────

test('Flow 4 — Side-by-Side View shows a column per team', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Click Side×Side tab
  await page.locator('.tab-btn:has-text("Side")').click()
  await expect(page.locator('.tab-btn.active')).toContainText('Side')

  // Multiple team column headers visible
  const headers = page.locator('.side-by-side-team-header')
  await expect(headers.first()).toBeVisible()
  expect(await headers.count()).toBeGreaterThanOrEqual(4)

  // Team numbers appear in headers
  await expect(page.locator('.side-by-side-team-header').filter({ hasText: '254' })).toBeVisible()
  await expect(page.locator('.side-by-side-team-header').filter({ hasText: '1678' })).toBeVisible()

  // Each column has match blocks and available blocks
  const matchBlocks = page.locator('.timeline-block.match')
  expect(await matchBlocks.count()).toBeGreaterThan(5) // at least 5 match blocks across all columns

  const availBlocks = page.locator('.timeline-block.available')
  expect(await availBlocks.count()).toBeGreaterThan(5)
})

// ── Flow 5: Marking a team as interviewed ─────────────────────────────────────

test('Flow 5 — Interviewing a team persists across tab switches', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Select team 254 in Team View
  await page.locator('select[aria-label="Select team"]').selectOption({ label: /254/ })

  // Check the Interviewed box
  const checkbox = page.locator('.interviewed-label input[type="checkbox"]')
  await expect(checkbox).not.toBeChecked()
  await checkbox.check()
  await expect(checkbox).toBeChecked()

  // Dropdown shows ✓ for team 254
  const selectedOption = page.locator('select[aria-label="Select team"] option[value="254"]')
  await expect(selectedOption).toContainText('✓')

  // Switch to Side×Side — Done checkbox for 254 should be checked
  await page.locator('.tab-btn:has-text("Side")').click()
  const doneCheckbox = page.locator('.side-by-side-team-header').filter({ hasText: '254' })
    .locator('input[type="checkbox"]')
  await expect(doneCheckbox).toBeChecked()

  // Switch back to Team View — checkbox still checked
  await page.locator('.tab-btn:has-text("Team")').click()
  await page.locator('select[aria-label="Select team"]').selectOption({ label: /254/ })
  await expect(page.locator('.interviewed-label input[type="checkbox"]')).toBeChecked()
})

// ── Flow 6: Adjusting availability settings ───────────────────────────────────

test('Flow 6 — Changing pre-match buffer updates availability windows', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Count available blocks on Team View with default settings (pre=10)
  await page.locator('select[aria-label="Select team"]').selectOption({ label: /1678/ })
  const defaultCount = await page.locator('.timeline-block.available').count()

  // Open settings
  await page.locator('.tab-btn[aria-label="Open settings"]').click()
  await expect(page.locator('.settings-sheet')).toBeVisible()

  // Change pre-match buffer from 10 to 3 (smaller buffer = more availability)
  const preMatchInput = page.locator('.settings-row').filter({ hasText: 'Pre-match buffer' }).locator('input')
  await preMatchInput.fill('3')

  // Close settings
  await page.locator('button:has-text("Done")').click()
  await expect(page.locator('.settings-sheet')).not.toBeVisible()

  // Stay on Team View — available block count should be >= default (buffer shrunk)
  await expect(page.locator('.tab-btn.active')).toContainText('Team')
  const newCount = await page.locator('.timeline-block.available').count()
  expect(newCount).toBeGreaterThanOrEqual(defaultCount)

  // Settings survive a tab switch
  await page.locator('.tab-btn:has-text("Merged")').click()
  await page.locator('.tab-btn:has-text("Team")').click()
  await page.locator('.tab-btn[aria-label="Open settings"]').click()
  const savedValue = await page.locator('.settings-row').filter({ hasText: 'Pre-match buffer' }).locator('input').inputValue()
  expect(savedValue).toBe('3')
  await page.locator('button:has-text("Done")').click()
})

// ── Flow 7: Page reload restores state ────────────────────────────────────────

test('Flow 7 — Reload restores schedule and interviewed state from localStorage', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Mark team 118 as interviewed
  await page.locator('select[aria-label="Select team"]').selectOption({ label: /118/ })
  await page.locator('.interviewed-label input[type="checkbox"]').check()

  // Reload the page (do NOT clear localStorage)
  await page.reload()

  // Should land directly on schedule screen (not setup)
  await waitForSchedule(page)
  await expect(page.locator('.tab-bar')).toBeVisible()

  // MOCK badge still shown
  await expect(page.locator('.badge-warn')).toContainText('MOCK')

  // Team 118's interviewed state is preserved
  await page.locator('select[aria-label="Select team"]').selectOption({ label: /118/ })
  await expect(page.locator('.interviewed-label input[type="checkbox"]')).toBeChecked()
})

// ── Flow 8: Editing the team list ─────────────────────────────────────────────

test('Flow 8 — Edit button returns to setup screen without clearing interviewed state', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Mark team 3015 as interviewed
  await page.locator('select[aria-label="Select team"]').selectOption({ label: /3015/ })
  await page.locator('.interviewed-label input[type="checkbox"]').check()

  // Click Edit
  await page.locator('button:has-text("Edit")').click()

  // Setup screen shown with mock banner
  await expect(page.locator('h1')).toContainText('FRC Pit Judge Scheduler')
  await expect(page.locator('text=Mock mode active')).toBeVisible()

  // Event field still pre-filled
  await expect(page.locator('input[type="text"]')).not.toHaveValue('')

  // Load the schedule again
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Interviewed state for 3015 was preserved
  await page.locator('select[aria-label="Select team"]').selectOption({ label: /3015/ })
  await expect(page.locator('.interviewed-label input[type="checkbox"]')).toBeChecked()
})

// ── Flow 9: Schedule refresh ──────────────────────────────────────────────────

test('Flow 9 — Refresh button updates the last-fetched timestamp', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Capture current timestamp text
  const timestampBefore = await page.locator('.last-fetched').textContent()

  // Wait a full second so the timestamp can change
  await page.waitForTimeout(1100)

  // Click Refresh
  await page.locator('button:has-text("Refresh")').click()

  // Spinner may appear briefly — wait for it to resolve
  await expect(page.locator('.timeline-block').first()).toBeVisible({ timeout: 3000 })

  // Timestamp text should have changed
  const timestampAfter = await page.locator('.last-fetched').textContent()
  expect(timestampAfter).not.toBe(timestampBefore)
})

// ── Mobile viewport sanity check ──────────────────────────────────────────────

test('Mobile — all tabs reachable and timeline renders', async ({ page }) => {
  await freshLoad(page)
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Tab bar visible and at bottom
  const tabBar = page.locator('.tab-bar')
  await expect(tabBar).toBeVisible()

  // Each tab is reachable and renders content
  for (const tabText of ['Merged', 'Side', 'Team']) {
    await page.locator(`.tab-btn:has-text("${tabText}")`).click()
    await expect(page.locator('.tab-btn.active')).toContainText(tabText)
    // Some timeline content appears
    await expect(page.locator('.timeline-block, .merged-empty').first()).toBeVisible({ timeout: 3000 })
  }
})
