export const STATUS_COLOR = {
  Running: 'blue',
  Succeeded: 'green',
  Failed: 'red',
  Cancelled: 'orange',
  Pending: 'grey',
  Unknown: 'grey',
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
