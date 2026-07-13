import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PipelineRunDetailPage from './PipelineRunDetailPage'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: { getPipelineRun: vi.fn() },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ namespace: 'test-ns', name: 'my-run' }),
    useNavigate: () => vi.fn(),
  }
})

const detailRun = {
  name: 'my-run',
  namespace: 'test-ns',
  pipelineName: 'my-pipeline',
  status: 'Succeeded',
  reason: 'Succeeded',
  startTime: '2024-06-01T10:00:00Z',
  completionTime: '2024-06-01T10:05:00Z',
  durationSeconds: 300,
  gitBranch: 'main',
  gitCommit: 'abc1234',
  triggerType: 'manual',
  taskRuns: [
    { name: 'tr-1', taskName: 'git-clone', status: 'Succeeded', durationSeconds: 30 },
  ],
  message: null,
  startedBy: null,
  managedBy: null,
  repository: null,
  repositoryUrl: null,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PipelineRunDetailPage />
    </MemoryRouter>
  )
}

describe('PipelineRunDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner before API resolves', () => {
    api.getPipelineRun.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders run name in the header', async () => {
    api.getPipelineRun.mockResolvedValue(detailRun)
    renderPage()
    await screen.findByText('my-pipeline')
    const headings = screen.getAllByText('my-run')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders task name in the tasks table', async () => {
    api.getPipelineRun.mockResolvedValue(detailRun)
    renderPage()
    await screen.findByText('git-clone')
    expect(screen.getByText('git-clone')).toBeInTheDocument()
  })

  it('shows error alert when API rejects', async () => {
    api.getPipelineRun.mockRejectedValue(new Error('not found'))
    renderPage()
    const alert = await screen.findByText(/failed to load pipeline run/i)
    expect(alert).toBeInTheDocument()
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })

  it('back button is present in the header', () => {
    api.getPipelineRun.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })
})
