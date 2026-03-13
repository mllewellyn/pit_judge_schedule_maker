/**
 * Screenshot generation for the Help section.
 *
 * Captures the app in mock mode at each major screen/state, saving PNGs to
 * public/screenshots/.  Designed to run with playwright.screenshots.config.js.
 *
 * ═══════════════════════════════════════════════════════════════
 * HOW TO UPDATE SCREENSHOTS
 * ═══════════════════════════════════════════════════════════════
 * Screenshots are static assets committed to the repo so the Help section
 * works without a build step.  Regenerate them whenever the UI changes.
 *
 *   npm run screenshots
 *
 * Then review the images in public/screenshots/ and commit them alongside
 * your UI changes so the Help section stays in sync.
 *
 * When to regenerate:
 *   • After any visible layout or colour change
 *   • After adding or removing UI elements
 *   • After changing mock data that affects what's displayed
 *   • Before tagging a release
 * ═══════════════════════════════════════════════════════════════
 */
import { test } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'screenshots')

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
})

/** Navigate to a fresh schedule screen (mock auto-loads). */
async function freshSchedule(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  // Wait for the Team view timeline to appear (mock data loads in ~400 ms).
  await page.waitForSelector('.timeline-wrap', { timeout: 10000 })
  // Let any CSS transitions finish.
  await page.waitForTimeout(300)
}

/** Save a viewport screenshot with a consistent name. */
const shot = (page, name) =>
  page.screenshot({
    path: path.join(OUT_DIR, name),
    animations: 'disabled',
    // Clip to 700 px tall to keep images focused; full portrait is very long.
    clip: { x: 0, y: 0, width: 390, height: 700 },
  })

// ── Individual captures ──────────────────────────────────────────────────────

test('capture: setup screen', async ({ page }) => {
  await freshSchedule(page)
  // Click Edit to reach the setup / event-input screen.
  await page.click('button:has-text("Edit")')
  // Wait for the heading — confirms React has committed the setup screen.
  await page.waitForSelector('h1:has-text("FRC Pit Judge")', { timeout: 5000 })
  // Mock EventSearch fetch has a 300 ms delay; wait past it so the event name
  // and team chips are all fully rendered before the shutter fires.
  await page.waitForTimeout(500)
  await shot(page, 'setup.png')
})

test('capture: team view', async ({ page }) => {
  await freshSchedule(page)
  // Team view is the default tab.  Select the first team for a populated timeline.
  const select = page.locator('select').first()
  await select.selectOption({ index: 1 })
  await page.waitForTimeout(200)
  await shot(page, 'team-view.png')
})

test('capture: merged view', async ({ page }) => {
  await freshSchedule(page)
  await page.click('button:has-text("Merged")')
  await page.waitForSelector('.merged-block')
  await page.waitForTimeout(200)
  await shot(page, 'merged-view.png')
})

test('capture: side-by-side view', async ({ page }) => {
  await freshSchedule(page)
  await page.click('button:has-text("Side")')
  await page.waitForSelector('.side-by-side-container')
  await page.waitForTimeout(200)
  await shot(page, 'side-by-side.png')
})

test('capture: settings panel', async ({ page }) => {
  await freshSchedule(page)
  await page.click('button:has-text("Settings")')
  await page.waitForSelector('.settings-sheet')
  await page.waitForTimeout(200)
  // Full height to show all settings.
  await page.screenshot({
    path: path.join(OUT_DIR, 'settings.png'),
    animations: 'disabled',
    clip: { x: 0, y: 0, width: 390, height: 700 },
  })
})
