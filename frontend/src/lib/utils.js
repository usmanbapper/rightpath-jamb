import { clsx } from 'clsx';

// ─── Class name merger ────────────────────────────────────────
export function cn(...inputs) {
  return clsx(inputs);
}

// ─── Date formatting ──────────────────────────────────────────
export function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ─── Time (seconds → mm:ss or hh:mm:ss) ─────────────────────
export function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00';
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// ─── Score helpers ────────────────────────────────────────────
export function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--brand)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Average';
  if (score >= 30) return 'Below Average';
  return 'Poor';
}

export function getScoreBg(score) {
  if (score >= 80) return '#f0fdf4';
  if (score >= 60) return 'var(--brand-light)';
  if (score >= 40) return '#fff7ed';
  return '#fef2f2';
}

// ─── Error message extractor ──────────────────────────────────
export function getErrorMessage(err) {
  // Axios error with backend response
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.error)   return err.response.data.error;
  // Network / timeout
  if (err?.code === 'ERR_NETWORK')  return 'Network error. Check your connection.';
  if (err?.code === 'ECONNABORTED') return 'Request timed out. Try again.';
  // Fallback
  return err?.message || 'Something went wrong. Please try again.';
}

// ─── Misc ─────────────────────────────────────────────────────
export function truncate(str, n = 60) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function pluralize(n, word, plural) {
  return `${n} ${n === 1 ? word : (plural || word + 's')}`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}
