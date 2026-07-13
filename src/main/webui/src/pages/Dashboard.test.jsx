import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: { listPipelineRuns: vi.fn() },
}))

vi.mock('../context/AppConfigContext', () => ({
  useAppConfig: () => ({ namespace: 'test-ns' }),
  useAppConfigError: () => null,
}))

const sampleRun = (name, status) => ({
  name,
  namespace: 'test-ns',
  pipelineName: 'my-pipeline',
  status,
  startTime: '2024-06-01T10:00:00Z',
  durationSeconds: 60,
  taskRuns: [],
  message: null,
  gitBranch: null,
  gitCommit: null,
})

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading spinner on initial render before API resolves', () => {
    api.listPipelineRuns.mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders pipeline run cards when API returns data', async () => {
    api.listPipelineRuns.mockResolvedValue([
      sampleRun('run-a', 'Succeeded'),
      sampleRun('run-b', 'Failed'),
    ])
    renderDashboard()
    await screen.findByText('run-a')
    expect(screen.getByText('run-b')).toBeInTheDocument()
  })

  it('shows an error alert when API rejects', async () => {
    api.listPipelineRuns.mockRejectedValue(new Error('connection refused'))
    renderDashboard()
    // PF6 Alert does not carry role="alert"; query by its title text instead
    await screen.findByText(/failed to load pipeline data/i)
    expect(screen.getByText(/connection refused/i)).toBeInTheDocument()
  })

  it('shows an empty state when API returns an empty array', async () => {
    api.listPipelineRuns.mockResolvedValue([])
    renderDashboard()
    // EmptyState renders titleText as both a heading and body text; use heading role
    await screen.findByRole('heading', { name: /no pipeline runs found/i })
  })

  it('shows correct stat counts for 1 Succeeded and 1 Failed run', async () => {
    api.listPipelineRuns.mockResolvedValue([
      sampleRun('run-a', 'Succeeded'),
      sampleRun('run-b', 'Failed'),
    ])
    renderDashboard()

    await screen.findByText('run-a')

    const statValues = screen.getAllByText('1')
    expect(statValues.length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
