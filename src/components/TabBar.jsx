const TABS = [
  { id: 'team',   label: 'Team',    icon: '👤' },
  { id: 'merged', label: 'Merged',  icon: '📋' },
  { id: 'side',   label: 'Side×Side', icon: '⊞' },
]

export default function TabBar({ activeTab, onTabChange, onSettings }) {
  return (
    <nav className="tab-bar" role="tablist" aria-label="Schedule views">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
      <button
        className="tab-btn"
        onClick={onSettings}
        aria-label="Open settings"
        title="Availability settings"
      >
        <span className="tab-icon" aria-hidden="true">⚙</span>
        Settings
      </button>
    </nav>
  )
}
