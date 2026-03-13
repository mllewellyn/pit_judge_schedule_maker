# FRC Pit Judge Scheduler

A mobile-friendly web app that helps FRC pit judge pairs know when to visit which teams. It pulls live match schedules from [The Blue Alliance](https://www.thebluealliance.com) and highlights windows when each team is free in their pit.

**[→ Open the app](https://mllewellyn.github.io/pit_judge_schedule_maker/)**

---

## Quick links

| Link | What it opens |
|------|--------------|
| [North Shore event](https://mllewellyn.github.io/pit_judge_schedule_maker/?event=2026marea) | 2026 NE District North Shore Event — enter your own teams |
| [North Shore — judge pair teams](https://mllewellyn.github.io/pit_judge_schedule_maker/?event=2026marea&teams=125%2C1761%2C2713%2C2876%2C3566%2C5735%2C8626%2C10156) | North Shore pre-loaded with teams 125, 1761, 2713, 2876, 3566, 5735, 8626, 10156 |

---

## How to use

### 1 · Getting started

When you first open the app you land on the **Setup screen**.

1. Type your event code (e.g. `2026marea`) or a few letters of the event name in the search box and select the matching event from the dropdown.
2. Enter your assigned team numbers — one per line, or comma-separated.
3. Green chips appear as each number is validated against the event roster. Unknown numbers show in orange.
4. Tap **Load Schedule** to fetch match times from The Blue Alliance.

> 💾 Your event and teams are saved automatically — reloading the page restores them.  
> ✏️ Tap **Edit** in the header at any time to correct the event or team list.

---

### 2 · Team View

Select a team from the dropdown to see their full-day timeline.

- **Grey blocks** — match time or buffer before/after a match (team is unavailable).
- **Green blocks** — windows long enough for an interview (at least 15 min by default).
- **Yellow blocks** — window has started but less than 15 min remains; act fast or move on.
- **Dimmed blocks** — the window has already passed.

Check **Interviewed ✓** once you've visited the team. They move to the back of the dropdown so you can focus on remaining teams.

---

### 3 · Merged View

The **Merged tab** breaks the day into 10-minute blocks and shows how many of your remaining teams are free in each window.

- **Deep red** — no teams available (everyone in a match or buffer).
- **Amber / yellow** — only one or two teams free.
- **Green** — most or all remaining teams free.
- **Dimmed blocks** — end time is in the past or less than 10 minutes away.

Blocks with identical available teams are merged into a single taller unit. Tap any block to reveal the team numbers; use the **≤ 3 / All / None** buttons to control which blocks show team numbers by default.

The checklist at the top lets you mark teams as interviewed directly from this view.

> 💡 **Key strategy — target the amber blocks first.** When only one team is available in a window, that is the *only* chance to interview them during that gap. Save the large green windows for teams that have many opportunities throughout the day.

---

### 4 · Side-by-Side View

The **Side×Side tab** lines up all teams in scrollable columns on a shared time axis so you can spot patterns at a glance.

- Scroll horizontally to see all teams.
- Green blocks are available windows; grey is unavailable; yellow means less than 15 min remains.
- Interviewed teams move to the right.

> 📱 On a phone, scroll left-to-right with your finger.

---

### 5 · Refreshing after delays

FRC events run late — match times shift throughout the day.

Tap **↻ Refresh** in the header to pull the latest schedule from The Blue Alliance. The timestamp next to the button shows when data was last fetched.

> ⚠️ Your *Interviewed* checkmarks are preserved when you refresh — only the match times update.

---

### 6 · Availability settings

Tap **⚙ Settings** to tune how availability is calculated.

| Setting | Default | Description |
|---------|---------|-------------|
| Pre-match buffer | 10 min | How many minutes before a match the team is considered unavailable. Teams often head to queue early. |
| Post-match buffer | 5 min | How many minutes after a match the team needs in the pit. |
| Min interview window | 15 min | The shortest block that counts as a real opportunity. Shorter gaps are ignored. |

Changes take effect immediately — all views update without a re-fetch.

---

### 7 · Sharing a link

Tap **↗** in the header to copy a link pre-filled with the current event, team numbers, and interviewed status. Useful for handing off mid-day to a second judge pair or resuming on a different device.

---

## Development

```bash
# Install dependencies
npm install

# Run with live TBA data (requires VITE_TBA_KEY in .env.local)
npm run dev

# Run with mock data (no API key needed)
npm run dev:mock

# Unit tests
npm test

# End-to-end tests (Playwright, mock mode)
npm run test:e2e

# Regenerate help screenshots
npm run screenshots
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your TBA API key:

```
VITE_TBA_KEY=your_key_here
```

Register for a free read-only key at <https://www.thebluealliance.com/account>.

### Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which runs tests and deploys to GitHub Pages. Add your TBA key as a repository secret named `VITE_TBA_KEY`.
