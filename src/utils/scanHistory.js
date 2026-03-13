// ─── Scan History Manager ─────────────────────────────────────────────────────
// Persists scan history in localStorage with a max cap of 100 entries.

const STORAGE_KEY = 'trustscan_history';
const MAX_HISTORY = 100;

/**
 * Add a scan entry to history.
 * @param {Object} scanData - The security report or partial scan data
 * @param {string} rawText  - The raw decoded QR text (may differ from URL)
 */
export function addScanToHistory(scanData, rawText = '') {
  const history = getScanHistory();
  const entry = {
    id: Date.now() + Math.random(), // ensure uniqueness
    rawText: rawText || scanData.url || '',
    url: scanData.url || rawText || '',
    status: scanData.status || 'unknown',
    security_score: scanData.security_score ?? null,
    isHttps: scanData.isHttps ?? (scanData.url || '').startsWith('https://'),
    stats: scanData.stats || null,
    is_simulated: scanData.is_simulated || false,
    timestamp: new Date().toISOString(),
  };

  // Avoid adding exact duplicate back-to-back
  if (history.length > 0 && history[0].url === entry.url) return history[0];

  history.unshift(entry);
  const trimmed = history.slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
  return entry;
}

/**
 * Retrieve all scan history entries.
 */
export function getScanHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Delete a single entry by its id.
 */
export function deleteScanEntry(id) {
  const history = getScanHistory().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Clear all scan history.
 */
export function clearScanHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Compute aggregate stats from history.
 */
export function getHistoryStats() {
  const history = getScanHistory();
  const safe       = history.filter(e => e.status === 'safe').length;
  const suspicious = history.filter(e => e.status === 'suspicious').length;
  const malicious  = history.filter(e => e.status === 'malicious').length;
  const unknown    = history.length - safe - suspicious - malicious;

  const avgScore = history
    .filter(e => e.security_score !== null)
    .reduce((sum, e, _, arr) => sum + e.security_score / arr.length, 0);

  return {
    total: history.length,
    safe,
    suspicious,
    malicious,
    unknown,
    avgScore: Math.round(avgScore) || 0,
    threatsBlocked: malicious + suspicious,
  };
}
