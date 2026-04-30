export const STATUS_COLOR = {
  Running: 'cyan',
  Succeeded: 'green',
  Failed: 'red',
  Cancelled: 'yellow',
  Canceled: 'yellow',
  Pending: 'grey',
  Unknown: 'grey',
}

export const STATUS_ACCENT_COLOR = {
  Running: 'var(--pf-t--global--color--status--info--default)',
  Succeeded: 'var(--pf-t--global--color--status--success--default)',
  Failed: 'var(--pf-t--global--color--status--danger--default)',
  Cancelled: 'var(--pf-t--global--color--status--warning--default)',
  Canceled: 'var(--pf-t--global--color--status--warning--default)',
  Pending: 'var(--pf-t--global--color--status--info--default)',
  Unknown: 'var(--pf-t--global--color--status--info--default)',
}

export function normalizeStatus(status) {
  if (!status) return 'Unknown'
  if (status.toLowerCase().includes('cancel')) return 'Cancelled'
  return status
}

export function getStatusLabelColor(status) {
  return STATUS_COLOR[normalizeStatus(status)] || STATUS_COLOR.Unknown
}

export function getStatusAccentColor(status) {
  return STATUS_ACCENT_COLOR[normalizeStatus(status)] || STATUS_ACCENT_COLOR.Unknown
}

export function formatDuration(s) {
  if (s === undefined || s === null) return '—'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export function formatTimeOnly(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString()
}
