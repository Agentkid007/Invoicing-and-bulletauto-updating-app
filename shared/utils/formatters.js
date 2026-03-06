/**
 * shared/utils/formatters.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Currency, date and text formatters — pure JS, works on web + mobile + Node.
 */

'use strict';

/** Format a number as South-African Rand: "R 1 045,00" */
function formatRands(value) {
  const n = Number(value || 0);
  return 'R\u00A0' + n.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format an ISO date string to "DD MMM YYYY" */
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Capitalise first letter of each word */
function titleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/** Convert booking status key to display label */
const STATUS_LABELS = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  in_progress:'In Progress',
  completed:  'Completed',
  cancelled:  'Cancelled',
};
function statusLabel(status) { return STATUS_LABELS[status] || status; }

/** Return a hex colour for a booking status */
const STATUS_COLORS = {
  pending:    '#FF9800',
  confirmed:  '#2196F3',
  in_progress:'#9C27B0',
  completed:  '#4CAF50',
  cancelled:  '#F44336',
};
function statusColor(status) { return STATUS_COLORS[status] || '#9E9E9E'; }

module.exports = { formatRands, formatDate, titleCase, statusLabel, statusColor, STATUS_LABELS, STATUS_COLORS };
