// ── API mode ─────────────────────────────────────────────────────────────────
//
//  Mock mode (no API key needed):
//    npm run dev:mock
//    Sets VITE_MOCK_MODE=true — uses local fake data from src/api/mockData.js
//
//  Real mode (requires a TBA API key):
//    Copy .env.example → .env.local and fill in VITE_TBA_KEY.
//    Then: npm run dev
//
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

// Read-only TBA API key — safe to commit for public data access.
// Provide via VITE_TBA_KEY in .env.local (preferred) or hardcode here.
// Register at https://www.thebluealliance.com/account to get a key.
export const TBA_API_KEY = import.meta.env.VITE_TBA_KEY ?? 'aPI3TrFE1dO99sdVlGytxY5Fjw9hZBIXS6bU2I7ff26y2k3LOaWxvy1Z6F9ZsdV0'

export const TBA_BASE = 'https://www.thebluealliance.com/api/v3'

// Current FRC season year
export const CURRENT_YEAR = new Date().getFullYear()

// Default availability settings
export const DEFAULT_SETTINGS = {
  preMatchBuffer: 10,       // minutes blocked before match start
  postMatchBuffer: 5,       // minutes blocked after match end
  minInterviewDuration: 15, // minimum available block in minutes
}

// Assumed FRC qualification match duration in minutes (used when end time unavailable)
export const MATCH_DURATION_MINUTES = 10
