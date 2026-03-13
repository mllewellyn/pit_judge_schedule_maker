import { useState, useEffect, useRef } from 'react'

export default function EventSearch({ events, value, onChange, loading }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // Sync external value changes (e.g. restoring from localStorage)
  useEffect(() => {
    if (value && value !== query) setQuery(value)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const filtered = query.length >= 2
    ? events.filter(e => {
        const q = query.toLowerCase()
        return (
          e.key.toLowerCase().includes(q) ||
          (e.name || '').toLowerCase().includes(q) ||
          (e.short_name || '').toLowerCase().includes(q) ||
          (e.event_code || '').toLowerCase().includes(q)
        )
      }).slice(0, 30)
    : []

  function select(event) {
    setQuery(event.name || event.key)
    setOpen(false)
    setFocusedIdx(-1)
    onChange(event.key, event)
  }

  function handleKeyDown(e) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      select(filtered[focusedIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="combobox-wrap" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder={loading ? 'Loading events…' : 'Search by name or event code…'}
        value={query}
        disabled={loading}
        onChange={e => {
          setQuery(e.target.value)
          setOpen(true)
          setFocusedIdx(-1)
          if (!e.target.value) onChange('', null)
        }}
        onFocus={() => { if (query.length >= 2) setOpen(true) }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCapitalize="off"
      />
      {open && filtered.length > 0 && (
        <div className="combobox-dropdown" role="listbox">
          {filtered.map((ev, idx) => (
            <div
              key={ev.key}
              className={`combobox-option${focusedIdx === idx ? ' focused' : ''}`}
              role="option"
              aria-selected={focusedIdx === idx}
              onMouseDown={() => select(ev)}
              onMouseEnter={() => setFocusedIdx(idx)}
            >
              <div>{ev.name || ev.key}</div>
              <div className="combobox-option-code">{ev.key} · {ev.city || ''}{ev.state_prov ? `, ${ev.state_prov}` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
