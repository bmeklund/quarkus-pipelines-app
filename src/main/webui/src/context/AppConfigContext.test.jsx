import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AppConfigProvider, useAppConfig, useAppConfigError } from './AppConfigContext'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: { getConfig: vi.fn() },
}))

function ConfigConsumer() {
  const config = useAppConfig()
  const error = useAppConfigError()
  return (
    <div>
      {config && <span data-testid="config-namespace">{config.namespace}</span>}
      {error && <span data-testid="config-error">{error}</span>}
      {!config && !error && <span data-testid="loading">loading</span>}
    </div>
  )
}

describe('AppConfigContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides config data when getConfig resolves successfully', async () => {
    api.getConfig.mockResolvedValue({ namespace: 'test-ns', 'application.name': 'my-app' })

    render(
      <AppConfigProvider>
        <ConfigConsumer />
      </AppConfigProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('config-namespace')).toHaveTextContent('test-ns')
    })
  })

  it('provides error string when getConfig rejects', async () => {
    api.getConfig.mockRejectedValue(new Error('network failure'))

    render(
      <AppConfigProvider>
        <ConfigConsumer />
      </AppConfigProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('config-error')).toHaveTextContent('network failure')
    })
  })

  it('starts in loading state before the promise settles', () => {
    api.getConfig.mockReturnValue(new Promise(() => {}))

    render(
      <AppConfigProvider>
        <ConfigConsumer />
      </AppConfigProvider>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('useAppConfig returns null when there is no provider', () => {
    function NoProviderConsumer() {
      const config = useAppConfig()
      return <span>{config === null ? 'null' : 'not-null'}</span>
    }
    render(<NoProviderConsumer />)
    expect(screen.getByText('null')).toBeInTheDocument()
  })
})
