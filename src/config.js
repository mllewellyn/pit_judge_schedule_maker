// Read-only TBA API key — safe to commit for public data access.
// Register at https://www.thebluealliance.com/account to get a key.
export const TBA_API_KEY = 'REPLACE_WITH_YOUR_TBA_KEY'

export const TBA_BASE = 'https://www.thebluealliance.com/api/v3'

// Current FRC season year
export const CURRENT_YEAR = new Date().getFullYear()

// Default availability settings
export const DEFAULT_SETTINGS = {
  preMatchBuffer: 10,   // minutes blocked before match start
  postMatchBuffer: 5,   // minutes blocked after match end
  minInterviewDuration: 15, // minimum available block in minutes
}

// Assumed FRC qualification match duration in minutes (used when end time unavailable)
export const MATCH_DURATION_MINUTES = 10
