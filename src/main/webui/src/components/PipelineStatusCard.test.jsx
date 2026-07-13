import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PipelineStatusCard from './PipelineStatusCard'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const baseRun = {
  name: 'my-run-001',
  namespace: 'test-ns',
  pipelineName: 'my-pipeline',
  status: 'Succeeded',
  startTime: '2024-06-01T10:00:00Z',
  durationSeconds: 90,
  gitBranch: 'main',
  gitCommit: 'abc1234',
  taskRuns: [],
  message: null,
}

function renderCard(runOverrides = {}) {
  const run = { ...baseRun, ...runOverrides }
  return render(
    <MemoryRouter>
      <PipelineStatusCard run={run} />
    </MemoryRouter>
  )
}

describe('PipelineStatusCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders the run name', () => {
    renderCard()
    expect(screen.getByText('my-run-001')).toBeInTheDocument()
  })

  it('renders the pipeline name', () => {
    renderCard()
    expect(screen.getByText('my-pipeline')).toBeInTheDocument()
  })

  it('shows git branch label when gitBranch is set', () => {
    renderCard({ gitBranch: 'main' })
    expect(screen.getByText('main')).toBeInTheDocument()
  })

  it('does not show git branch section when gitBranch is null', () => {
    renderCard({ gitBranch: null, gitCommit: null })
    expect(screen.queryByText('main')).not.toBeInTheDocument()
  })

  it('shows duration formatted as "1m 30s" for 90 seconds', () => {
    renderCard({ durationSeconds: 90 })
    expect(screen.getByText(/1m 30s/)).toBeInTheDocument()
  })

  it('renders task run labels when taskRuns has entries', () => {
    renderCard({
      taskRuns: [
        { name: 'tr-1', taskName: 'git-clone', status: 'Succeeded' },
      ],
    })
    expect(screen.getByText('git-clone')).toBeInTheDocument()
  })

  it('renders status label', () => {
    renderCard({ status: 'Succeeded' })
    expect(screen.getByText('Succeeded')).toBeInTheDocument()
  })

  it('renders a Details button', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument()
  })
})
