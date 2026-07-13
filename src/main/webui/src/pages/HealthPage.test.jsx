import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthPage from './HealthPage'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: { getHealth: vi.fn() },
}))

const healthResponse = {
  status: 'UP',
  checks: [
    { name: 'openshift-connectivity', status: 'UP', data: { namespace: 'test-ns' } },
    { name: 'memory', status: 'UP', data: { 'used-percent': '45.0' } },
  ],
}

function renderPage() {
  return render(<HealthPage />)
}

describe('HealthPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    api.getHealth.mockReturnValue(new Promise(() => {}))
    renderPage()
    // Both the body-level Spinner and the Refresh button spinner render with role="progressbar"
    const spinners = screen.getAllByRole('progressbar')
    expect(spinners.length).toBeGreaterThanOrEqual(1)
  })

  it('shows overall "UP" status after data loads', async () => {
    api.getHealth.mockResolvedValue(healthResponse)
    renderPage()
    await screen.findByText('Overall Status')
    const upLabels = screen.getAllByText('UP')
    expect(upLabels.length).toBeGreaterThan(0)
  })

  it('renders each health check name', async () => {
    api.getHealth.mockResolvedValue(healthResponse)
    renderPage()
    await screen.findByText('openshift-connectivity')
    expect(screen.getByText('openshift-connectivity')).toBeInTheDocument()
    expect(screen.getByText('memory')).toBeInTheDocument()
  })

  it('shows error alert when API rejects', async () => {
    api.getHealth.mockRejectedValue(new Error('health endpoint unreachable'))
    renderPage()
    await screen.findByText(/failed to fetch health data/i)
    expect(screen.getByText(/health endpoint unreachable/i)).toBeInTheDocument()
  })
})
