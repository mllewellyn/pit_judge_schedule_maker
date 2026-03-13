import { useMemo } from 'react'

/**
 * Parses a raw text block of team numbers into an array of integers.
 */
export function parseTeamNumbers(raw) {
  return raw
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n))
}

export default function TeamNumberInput({ value, onChange, roster, rosterLoading }) {
  const parsed = useMemo(() => parseTeamNumbers(value), [value])

  // Build a lookup map: team_number -> nickname
  const rosterMap = useMemo(() => {
    const map = {}
    if (roster) roster.forEach(t => { map[t.team_number] = t.nickname })
    return map
  }, [roster])

  const chips = useMemo(() => parsed.map(n => ({
    number: n,
    nickname: rosterMap[n] || null,
    valid: roster ? n in rosterMap : null, // null = unknown (no roster yet)
  })), [parsed, rosterMap, roster])

  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter team numbers separated by commas or newlines&#10;e.g. 254, 1678, 3015"
        inputMode="numeric"
        rows={4}
      />
      {chips.length > 0 && (
        <div className="team-chip-list" aria-label="Team validation">
          {chips.map(chip => (
            <span
              key={chip.number}
              className={`team-chip${chip.valid === true ? ' valid' : chip.valid === false ? ' invalid' : ''}`}
              title={chip.valid === false ? 'Team not found at this event' : chip.nickname || ''}
            >
              {chip.valid === false && <span aria-hidden>⚠</span>}
              {chip.valid === true && <span aria-hidden>✓</span>}
              {chip.number}
              {chip.nickname && <span className="team-chip-name">{chip.nickname}</span>}
            </span>
          ))}
        </div>
      )}
      {rosterLoading && (
        <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
          <span className="spinner" /> Validating team numbers…
        </p>
      )}
    </div>
  )
}
