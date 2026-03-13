import React, { useState, useMemo } from 'react';
import { getScanHistory, deleteScanEntry, clearScanHistory, getHistoryStats } from '../utils/scanHistory';
import '../styles/ScanHistory.css';

const STATUS_CONFIG = {
  safe:       { icon: '✓', label: 'Safe',       color: 'var(--color-safe)'    },
  suspicious: { icon: '⚠', label: 'Suspicious', color: 'var(--color-warning)' },
  malicious:  { icon: '✕', label: 'Malicious',  color: 'var(--color-danger)'  },
  unknown:    { icon: '?', label: 'Unknown',     color: 'var(--color-neutral)' },
};

const FILTERS = ['all', 'safe', 'suspicious', 'malicious', 'unknown'];

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ScanHistory = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState(() => getScanHistory());
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const stats = useMemo(() => getHistoryStats(), [history]);

  const filtered = useMemo(() => {
    let h = history;
    if (filter !== 'all') h = h.filter(e => e.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      h = h.filter(e => (e.url || e.rawText || '').toLowerCase().includes(q));
    }
    return h;
  }, [history, filter, search]);

  const handleDelete = (id) => {
    deleteScanEntry(id);
    setHistory(getScanHistory());
  };

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    clearScanHistory();
    setHistory([]);
    setConfirmClear(false);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ─── Empty State ───────────────────────────────────
  if (history.length === 0) {
    return (
      <div className="history-container">
        <div className="history-header">
          <h2 className="history-title">Scan History</h2>
          <p className="history-subtitle">All your previous scans, stored locally</p>
        </div>
        <div className="history-empty">
          <div className="history-empty-icon">📋</div>
          <h3>No scans yet</h3>
          <p>Your scan history will appear here after you scan a QR code or check a URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2 className="history-title">Scan History</h2>
        <p className="history-subtitle">All your previous scans, stored locally on this device</p>
      </div>

      {/* ─── Stats Row ───────────────────────────────────── */}
      <div className="history-stats-row">
        <div className="hstat-card">
          <span className="hstat-value">{stats.total}</span>
          <span className="hstat-label">Total Scans</span>
        </div>
        <div className="hstat-card safe">
          <span className="hstat-value">{stats.safe}</span>
          <span className="hstat-label">Safe</span>
        </div>
        <div className="hstat-card suspicious">
          <span className="hstat-value">{stats.suspicious}</span>
          <span className="hstat-label">Suspicious</span>
        </div>
        <div className="hstat-card malicious">
          <span className="hstat-value">{stats.malicious}</span>
          <span className="hstat-label">Threats</span>
        </div>
        <div className="hstat-card score">
          <span className="hstat-value">{stats.avgScore}</span>
          <span className="hstat-label">Avg Score</span>
        </div>
      </div>

      {/* ─── Visual Bar ──────────────────────────────────── */}
      {stats.total > 0 && (
        <div className="history-bar-wrap">
          <div className="history-bar">
            {stats.safe > 0 && (
              <div className="bar-seg safe" style={{ width: `${(stats.safe / stats.total) * 100}%` }} title={`${stats.safe} safe`} />
            )}
            {stats.suspicious > 0 && (
              <div className="bar-seg suspicious" style={{ width: `${(stats.suspicious / stats.total) * 100}%` }} title={`${stats.suspicious} suspicious`} />
            )}
            {stats.malicious > 0 && (
              <div className="bar-seg malicious" style={{ width: `${(stats.malicious / stats.total) * 100}%` }} title={`${stats.malicious} malicious`} />
            )}
            {stats.unknown > 0 && (
              <div className="bar-seg unknown" style={{ width: `${(stats.unknown / stats.total) * 100}%` }} title={`${stats.unknown} unknown`} />
            )}
          </div>
          <div className="bar-legend">
            <span className="legend-item safe">✓ Safe</span>
            <span className="legend-item suspicious">⚠ Suspicious</span>
            <span className="legend-item malicious">✕ Threats</span>
          </div>
        </div>
      )}

      {/* ─── Search & Filters ────────────────────────────── */}
      <div className="history-controls">
        <div className="history-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="history-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search URLs..."
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className="history-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''} ${f}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All (${stats.total})` : `${f.charAt(0).toUpperCase() + f.slice(1)}`}
            </button>
          ))}
        </div>

        <button
          className={`clear-btn ${confirmClear ? 'confirm' : ''}`}
          onClick={handleClear}
          onBlur={() => setConfirmClear(false)}
        >
          {confirmClear ? '⚠ Confirm Clear' : '🗑 Clear All'}
        </button>
      </div>

      {/* ─── Results Count ───────────────────────────────── */}
      {filtered.length !== history.length && (
        <p className="history-result-count">
          Showing {filtered.length} of {history.length} entries
        </p>
      )}

      {/* ─── Entries List ────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="history-no-results">
          <p>No scans match your search.</p>
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((entry) => {
            const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.unknown;
            const displayText = entry.url || entry.rawText || '(unknown)';
            return (
              <div key={entry.id} className={`history-entry ${entry.status}`}>
                <div className="entry-status-dot" style={{ background: cfg.color }} title={cfg.label} />

                <div className="entry-body">
                  <div className="entry-url" title={displayText}>
                    {displayText.length > 70 ? displayText.slice(0, 70) + '…' : displayText}
                  </div>
                  <div className="entry-meta">
                    <span className={`entry-badge ${entry.status}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {entry.security_score !== null && (
                      <span className="entry-score">Score: {Math.round(entry.security_score)}/100</span>
                    )}
                    {entry.isHttps && <span className="entry-https">🔒 HTTPS</span>}
                    {entry.is_simulated && <span className="entry-simulated">Simulated</span>}
                    <span className="entry-time">{formatDate(entry.timestamp)}</span>
                  </div>
                </div>

                <div className="entry-actions">
                  <button
                    className="entry-btn copy"
                    onClick={() => handleCopy(displayText, entry.id)}
                    title="Copy URL"
                  >
                    {copiedId === entry.id ? '✓' : '📋'}
                  </button>
                  {(entry.url || entry.rawText || '').startsWith('http') && (
                    <a
                      className="entry-btn visit"
                      href={entry.url || entry.rawText}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open URL"
                    >
                      ↗
                    </a>
                  )}
                  <button
                    className="entry-btn delete"
                    onClick={() => handleDelete(entry.id)}
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
