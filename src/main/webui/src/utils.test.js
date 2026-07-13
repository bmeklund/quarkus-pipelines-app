import { describe, it, expect } from 'vitest'
import {
  normalizeStatus,
  getStatusLabelColor,
  getStatusAccentColor,
  formatDuration,
  formatTime,
  formatTimeOnly,
} from './utils'

describe('utils', () => {
  describe('normalizeStatus', () => {
    it('returns "Succeeded" for "Succeeded"', () => {
      expect(normalizeStatus('Succeeded')).toBe('Succeeded')
    })

    it('returns "Cancelled" for "Cancelled"', () => {
      expect(normalizeStatus('Cancelled')).toBe('Cancelled')
    })

    it('returns "Cancelled" for "CancelledRunFinally"', () => {
      expect(normalizeStatus('CancelledRunFinally')).toBe('Cancelled')
    })

    it('returns "Cancelled" for "Canceled" (single l)', () => {
      expect(normalizeStatus('Canceled')).toBe('Cancelled')
    })

    it('returns the status as-is for unknown strings', () => {
      expect(normalizeStatus('SomeUnknownStatus')).toBe('SomeUnknownStatus')
    })

    it('returns "Unknown" for null', () => {
      expect(normalizeStatus(null)).toBe('Unknown')
    })

    it('returns "Unknown" for undefined', () => {
      expect(normalizeStatus(undefined)).toBe('Unknown')
    })
  })

  describe('getStatusLabelColor', () => {
    it('returns "green" for "Succeeded"', () => {
      expect(getStatusLabelColor('Succeeded')).toBe('green')
    })

    it('returns "red" for "Failed"', () => {
      expect(getStatusLabelColor('Failed')).toBe('red')
    })

    it('returns "cyan" for "Running"', () => {
      expect(getStatusLabelColor('Running')).toBe('cyan')
    })

    it('returns "yellow" for "Cancelled"', () => {
      expect(getStatusLabelColor('Cancelled')).toBe('yellow')
    })

    it('returns "grey" for unknown status', () => {
      expect(getStatusLabelColor('SomethingUnknown')).toBe('grey')
    })
  })

  describe('getStatusAccentColor', () => {
    it('returns a non-empty string for "Succeeded"', () => {
      const color = getStatusAccentColor('Succeeded')
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    })

    it('returns a non-empty string for "Failed"', () => {
      const color = getStatusAccentColor('Failed')
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    })
  })

  describe('formatDuration', () => {
    it('returns "0s" for 0', () => {
      expect(formatDuration(0)).toBe('0s')
    })

    it('returns "45s" for 45', () => {
      expect(formatDuration(45)).toBe('45s')
    })

    it('returns "1m 30s" for 90', () => {
      expect(formatDuration(90)).toBe('1m 30s')
    })

    it('returns "60m 0s" for 3600', () => {
      expect(formatDuration(3600)).toBe('60m 0s')
    })

    it('returns "—" for null', () => {
      expect(formatDuration(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
      expect(formatDuration(undefined)).toBe('—')
    })
  })

  describe('formatTime', () => {
    it('returns a non-empty string for a valid ISO string', () => {
      const result = formatTime('2024-06-01T10:00:00Z')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns "—" for null', () => {
      expect(formatTime(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
      expect(formatTime(undefined)).toBe('—')
    })
  })

  describe('formatTimeOnly', () => {
    it('returns a non-empty string for a valid ISO string', () => {
      const result = formatTimeOnly('2024-06-01T10:00:00Z')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns "—" for null', () => {
      expect(formatTimeOnly(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
      expect(formatTimeOnly(undefined)).toBe('—')
    })
  })
})
