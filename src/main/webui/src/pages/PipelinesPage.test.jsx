import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PipelinesPage from './PipelinesPage'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: {
    listPipelineRuns: vi.fn(),
    listPipelines: vi.fn(),
    triggerPipelineRun: vi.fn(),
  },
}))

vi.mock('../context/AppConfigContext', () => ({
  useAppConfig: () => ({ namespace: 'test-ns' }),
  useAppConfigError: () => null,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const sampleRun = (name, status = 'Succeeded') => ({
  name,
  namespace: 'test-ns',
  pipelineName: 'my-pipeline',
  status,
  startTime: '2024-06-01T10:00:00Z',
  durationSeconds: 60,
  taskRuns: [],
  triggerType: 'manual',
})

function renderPage() {
  return render(
    <MemoryRouter>
      <PipelinesPage />
    </MemoryRouter>
  )
}

describe('PipelinesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows pipeline run rows in a table when data is returned', async () => {
    api.listPipelineRuns.mockResolvedValue([
      sampleRun('run-001'),
      sampleRun('run-002'),
    ])
    renderPage()
    await screen.findByText('run-001')
    expect(screen.getByText('run-002')).toBeInTheDocument()
  })

  it('shows empty state when API returns empty array', async () => {
    api.listPipelineRuns.mockResolvedValue([])
    renderPage()
    // EmptyState renders titleText in both a heading and body; query by heading role
    await screen.findByRole('heading', { name: 'No pipeline runs' })
  })

  it('"Trigger Run" button is visible', async () => {
    api.listPipelineRuns.mockResolvedValue([])
    renderPage()
    expect(screen.getByRole('button', { name: /trigger run/i })).toBeInTheDocument()
  })

  it('clicking "Trigger Run" opens the trigger modal', async () => {
    api.listPipelineRuns.mockResolvedValue([])
    api.listPipelines.mockResolvedValue(['my-pipeline'])
    renderPage()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /trigger run/i }))

    // PF6 Modal renders as a dialog; wait for it to appear
    await screen.findByRole('dialog')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closing/cancelling the modal hides it', async () => {
    api.listPipelineRuns.mockResolvedValue([])
    api.listPipelines.mockResolvedValue(['my-pipeline'])
    renderPage()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /trigger run/i }))
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
