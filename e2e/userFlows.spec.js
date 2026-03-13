/**
 * End-to-end tests for FRC Pit Judge Scheduler using mock data.
 *
 * Documented user flows:
 *
 * Flow 1 — Initial load in mock mode
 *   A judge opens the app for the first time (no localStorage). In mock mode
 *   the app skips setup and loads the schedule immediately with pre-filled
 *   demo teams and event.
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
 *   The judges decide they need a shorter lead time before matches. They
 *   reduce the pre-match buffer and confirm availability windows grow.
 *
 * Flow 7 — Page reload restores state (localStorage persistence)
 *   A judge closes and reopens their browser. The schedule and interviewed
 *   state load automatically without re-entering any information.
 *
 * Flow 8 — Editing event or teams
 *   The judges realise they entered a wrong team. They click Edit, see the
 *   setup screen with pre-filled data, and reload the schedule.
 *
 * Flow 9 — Schedule refresh after delay
 *   Match times have shifted due to field issues. The judge hits Refresh and
 *   the last-fetched timestamp updates.
 */

import { test, expect } from '@playwright/test'

// ── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Clear localStorage and reload. In mock mode the app auto-loads the schedule
 * directly (no setup screen shown on fresh load).
 */
async function freshLoad(page) {
  await page.goto('.')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

/**
 * Wait for the schedule screen to be fully loaded:
 * - Tab bar visible
 * - At least one timeline block rendered (mock data loads in ~400ms)
 */
async function waitForSchedule(page) {
  await expect(page.locator('.tab-bar')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.timeline-block').first()).toBeVisible({ timeout: 5000 })
}

// ── Flow 1: Initial load in mock mode ────────────────────────────────────────

test('Flow 1 — fresh load in mock mode shows schedule with MOCK badge', async ({ page }) => {
  await freshLoad(page)

  // In mock mode the app skips setup and goes straight to the schedule screen
  await waitForSchedule(page)

  // MOCK badge is visible in the header
  await expect(page.locator('.badge-warn')).toContainText('MOCK')

  // Tab bar is present with all 4 buttons
  await expect(page.locator('.tab-btn:has-text("Team")')).toBeVisible()
  await expect(page.locator('.tab-btn:has-text("Merged")')).toBeVisible()
  await expect(page.locator('.tab-btn:has-text("Side")')).toBeVisible()
  await expect(page.locator('.tab-btn[aria-label="Open settings"]')).toBeVisible()

  // Team dropdown exists and has all 8 demo teams
  const dropdown = page.locator('select[aria-label="Select team"]')
  await expect(dropdown).toBeVisible()
  const options = await dropdown.locator('option').all()
  expect(options.length).toBeGreaterThanOrEqual(8)
})

// ── Flow 2: Team View availability ───────────────────────────────────────────

test('Flow 2 — Team View shows match blocks and available windows', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Team View is active by default
  await expect(page.locator('.tab-btn.active')).toContainText('Team')

  // Switch to team 1678 (Citrus Circuits — plays 5 matches in mock data)
  const dropdown = page.locator('select[aria-label="Select team"]')
  await dropdown.selectOption({ value: '1678' })

  // Grey match blocks visible (team has 5 matches)
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

test('Flow 3 — Merged View shows 10-minute availability blocks with team lists', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Click Merged tab
  await page.locator('.tab-btn:has-text("Merged")').click()
  await expect(page.locator('.tab-btn.active')).toContainText('Merged')

  // Explanatory text mentions the uninterviewed team count
  await expect(page.locator('text=/\\d+ uninterviewed team/')).toBeVisible()

  // Multiple merged blocks are rendered across the day
  const blocks = page.locator('.merged-block')
  await expect(blocks.first()).toBeVisible()
  expect(await blocks.count()).toBeGreaterThan(5)

  // At least one block shows a count badge
  await expect(page.locator('.merged-count-badge').first()).toBeVisible()

  // Expand-mode control buttons are present
  await expect(page.locator('.merged-ctrl-btn').first()).toBeVisible()
})

// ── Flow 4: Side-by-Side View ─────────────────────────────────────────────────

test('Flow 4 — Side-by-Side View shows a column per team with blocks', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Click Side×Side tab
  await page.locator('.tab-btn:has-text("Side")').click()
  await expect(page.locator('.tab-btn.active')).toContainText('Side')

  // Multiple team column headers visible
  const headers = page.locator('.side-by-side-team-header')
  await expect(headers.first()).toBeVisible()
  expect(await headers.count()).toBeGreaterThanOrEqual(4)

  // Known team numbers appear in headers
  await expect(page.locator('.side-by-side-team-header').filter({ hasText: '254' })).toBeVisible()
  await expect(page.locator('.side-by-side-team-header').filter({ hasText: '1678' })).toBeVisible()

  // Match blocks and available blocks present across columns
  const matchBlocks = page.locator('.timeline-block.match')
  expect(await matchBlocks.count()).toBeGreaterThan(5)
  const availBlocks = page.locator('.timeline-block.available')
  expect(await availBlocks.count()).toBeGreaterThan(5)
})

// ── Flow 5: Marking a team as interviewed ─────────────────────────────────────

test('Flow 5 — Interviewing a team persists across tab switches', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Select team 254 in Team View and check the Interviewed box
  await page.locator('select[aria-label="Select team"]').selectOption({ value: '254' })
  const checkbox = page.locator('.interviewed-label input[type="checkbox"]')
  await expect(checkbox).not.toBeChecked()
  await checkbox.check()
  await expect(checkbox).toBeChecked()

  // Dropdown label now shows ✓ for team 254
  const selectedOption = page.locator('select[aria-label="Select team"] option[value="254"]')
  await expect(selectedOption).toContainText('✓')

  // Switch to Side×Side — Done checkbox for 254 is checked
  await page.locator('.tab-btn:has-text("Side")').click()
  const doneCheckbox = page.locator('.side-by-side-team-header')
    .filter({ hasText: '254' })
    .locator('input[type="checkbox"]')
  await expect(doneCheckbox).toBeChecked()

  // Switch back to Team View — still checked for 254
  await page.locator('.tab-btn:has-text("Team")').click()
  await page.locator('select[aria-label="Select team"]').selectOption({ value: '254' })
  await expect(page.locator('.interviewed-label input[type="checkbox"]')).toBeChecked()
})

// ── Flow 6: Adjusting availability settings ───────────────────────────────────

test('Flow 6 — Reducing pre-match buffer increases available windows', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Count available blocks for team 1678 with default settings (pre=10)
  await page.locator('select[aria-label="Select team"]').selectOption({ value: '1678' })
  const defaultCount = await page.locator('.timeline-block.available').count()

  // Open settings
  await page.locator('.tab-btn[aria-label="Open settings"]').click()
  await expect(page.locator('.settings-sheet')).toBeVisible()

  // Change pre-match buffer to 3 (smaller buffer → more availability)
  const preMatchInput = page.locator('.settings-row')
    .filter({ hasText: 'Pre-match buffer' })
    .locator('input[type="number"]')
  await preMatchInput.clear()
  await preMatchInput.fill('3')

  // Close settings
  await page.locator('button:has-text("Done")').click()
  await expect(page.locator('.settings-sheet')).not.toBeVisible()

  // Available count should be >= default (smaller buffer opens up more windows)
  const newCount = await page.locator('.timeline-block.available').count()
  expect(newCount).toBeGreaterThanOrEqual(defaultCount)

  // Setting persists: re-open settings and check value
  await page.locator('.tab-btn[aria-label="Open settings"]').click()
  const savedValue = await page.locator('.settings-row')
    .filter({ hasText: 'Pre-match buffer' })
    .locator('input[type="number"]')
    .inputValue()
  expect(savedValue).toBe('3')
  await page.locator('button:has-text("Done")').click()
})

// ── Flow 7: Page reload restores state ────────────────────────────────────────

test('Flow 7 — Reload restores schedule and interviewed state from localStorage', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Mark team 118 as interviewed
  await page.locator('select[aria-label="Select team"]').selectOption({ value: '118' })
  await page.locator('.interviewed-label input[type="checkbox"]').check()

  // Reload the page without clearing localStorage
  await page.reload()

  // Should land directly on schedule screen
  await waitForSchedule(page)
  await expect(page.locator('.tab-bar')).toBeVisible()
  await expect(page.locator('.badge-warn')).toContainText('MOCK')

  // Team 118's interviewed state is preserved
  await page.locator('select[aria-label="Select team"]').selectOption({ value: '118' })
  await expect(page.locator('.interviewed-label input[type="checkbox"]')).toBeChecked()
})

// ── Flow 8: Editing the team list ─────────────────────────────────────────────

test('Flow 8 — Edit shows setup screen with pre-filled data, load returns to schedule', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Mark team 3015 as interviewed before editing
  await page.locator('select[aria-label="Select team"]').selectOption({ value: '3015' })
  await page.locator('.interviewed-label input[type="checkbox"]').check()

  // Click Edit
  await page.locator('button:has-text("Edit")').click()

  // Setup screen is shown with mock mode banner
  await expect(page.locator('h1')).toContainText('FRC Pit Judge Scheduler')
  await expect(page.locator('text=Mock mode active')).toBeVisible()

  // Event field is pre-filled (not empty)
  await expect(page.locator('input[type="text"]')).not.toHaveValue('')

  // Team numbers are pre-filled
  await expect(page.locator('textarea')).toHaveValue(/254/)

  // Load the schedule again
  await page.locator('button:has-text("Load Schedule")').click()
  await waitForSchedule(page)

  // Interviewed state for team 3015 was preserved through the edit
  await page.locator('select[aria-label="Select team"]').selectOption({ value: '3015' })
  await expect(page.locator('.interviewed-label input[type="checkbox"]')).toBeChecked()
})

// ── Flow 9: Schedule refresh ──────────────────────────────────────────────────

test('Flow 9 — Refresh button updates the last-fetched timestamp', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Capture current timestamp text
  const timestampBefore = await page.locator('.last-fetched').textContent()

  // Wait a full second so the timestamp (which shows seconds) can change
  await page.waitForTimeout(1500)

  // Click Refresh
  await page.locator('button:has-text("Refresh")').click()

  // Wait for the re-fetch to complete (mock has 400ms delay) and timeline to re-render
  await page.waitForTimeout(800)
  await expect(page.locator('.timeline-block').first()).toBeVisible({ timeout: 3000 })

  // Timestamp should have changed (shows HH:MM:SS format)
  const timestampAfter = await page.locator('.last-fetched').textContent()
  expect(timestampAfter).not.toBe(timestampBefore)
})

// ── Mobile viewport: all tabs reachable ──────────────────────────────────────

test('Mobile — all tabs reachable and timeline renders on phone viewport', async ({ page }) => {
  await freshLoad(page)
  await waitForSchedule(page)

  // Tab bar is visible
  await expect(page.locator('.tab-bar')).toBeVisible()

  // Each tab is reachable and shows content
  const tabContentSelector = {
    Merged: '.merged-block',       // new 10-min block grid
    Side:   '.side-by-side-team',  // team columns
    Team:   '.timeline-block',     // availability timeline
  }
  for (const [tabText, selector] of Object.entries(tabContentSelector)) {
    await page.locator(`.tab-btn:has-text("${tabText}")`).click()
    await expect(page.locator('.tab-btn.active')).toContainText(tabText)
    await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 })
  }
})
