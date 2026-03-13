export default function RefreshButton({ onRefresh, loading, lastFetched }) {
  const timeStr = lastFetched
    ? new Date(lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="refresh-area">
      {timeStr && <span className="last-fetched">Updated {timeStr}</span>}
      <button
        className="btn btn-ghost btn-sm"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh schedule"
        title="Re-fetch match schedule from The Blue Alliance"
      >
        {loading ? <span className="spinner" /> : '↺ Refresh'}
      </button>
    </div>
  )
}
