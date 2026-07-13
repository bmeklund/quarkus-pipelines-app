import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConfigPage from './ConfigPage'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: { getConfig: vi.fn() },
}))

const configResponse = {
  'application.name': 'quarkus-pipelines-app',
  'application.version': '1.0.0-SNAPSHOT',
  'http.port': 8080,
  namespace: 'test-ns',
  'api-server-url': 'https://api.example.com:6443',
  runtime: { 'java.version': '21', processors: 4, 'max-memory-mb': 512 },
}

function renderPage() {
  return render(<ConfigPage />)
}

describe('ConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    api.getConfig.mockReturnValue(new Promise(() => {}))
    renderPage()
    // The Refresh button also renders a spinner when isLoading is true,
    // so use getAllByRole and assert at least one progressbar is present.
    const spinners = screen.getAllByRole('progressbar')
    expect(spinners.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the application name', async () => {
    api.getConfig.mockResolvedValue(configResponse)
    renderPage()
    await screen.findByText('quarkus-pipelines-app')
    expect(screen.getByText('quarkus-pipelines-app')).toBeInTheDocument()
  })

  it('renders the namespace', async () => {
    api.getConfig.mockResolvedValue(configResponse)
    renderPage()
    await screen.findByText('test-ns')
    expect(screen.getByText('test-ns')).toBeInTheDocument()
  })

  it('shows error alert when API rejects', async () => {
    api.getConfig.mockRejectedValue(new Error('config unavailable'))
    renderPage()
    await screen.findByText(/failed to load configuration/i)
    expect(screen.getByText(/config unavailable/i)).toBeInTheDocument()
  })
})
