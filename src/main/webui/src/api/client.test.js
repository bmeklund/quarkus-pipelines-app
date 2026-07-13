import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api } from './client'

describe('api/client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockFetchOk(data) {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(''),
    })
  }

  function mockFetchError(status = 500, text = 'Internal Server Error') {
    fetch.mockResolvedValue({
      ok: false,
      status,
      text: () => Promise.resolve(text),
    })
  }

  describe('listPipelines', () => {
    it('fetches the correct URL', async () => {
      mockFetchOk(['my-pipeline'])
      await api.listPipelines('test-ns')
      expect(fetch).toHaveBeenCalledWith(
        '/api/pipelineruns/test-ns/pipelines',
        expect.objectContaining({ headers: expect.any(Object) })
      )
    })

    it('uses GET method (no method override)', async () => {
      mockFetchOk([])
      await api.listPipelines('test-ns')
      const [, opts] = fetch.mock.calls[0]
      expect(opts.method).toBeUndefined()
    })

    it('returns the response data', async () => {
      mockFetchOk(['pipe-a', 'pipe-b'])
      const result = await api.listPipelines('test-ns')
      expect(result).toEqual(['pipe-a', 'pipe-b'])
    })

    it('encodes the namespace in the URL', async () => {
      mockFetchOk([])
      await api.listPipelines('my namespace')
      expect(fetch.mock.calls[0][0]).toBe('/api/pipelineruns/my%20namespace/pipelines')
    })

    it('throws when response is not ok', async () => {
      mockFetchError(500, 'server error')
      await expect(api.listPipelines('test-ns')).rejects.toThrow('HTTP 500')
    })
  })

  describe('listPipelineRuns', () => {
    it('fetches the correct URL', async () => {
      mockFetchOk([])
      await api.listPipelineRuns('test-ns')
      expect(fetch.mock.calls[0][0]).toBe('/api/pipelineruns/test-ns')
    })

    it('returns the response data', async () => {
      const runs = [{ name: 'run-1' }]
      mockFetchOk(runs)
      const result = await api.listPipelineRuns('test-ns')
      expect(result).toEqual(runs)
    })

    it('throws when response is not ok', async () => {
      mockFetchError(500)
      await expect(api.listPipelineRuns('test-ns')).rejects.toThrow('HTTP 500')
    })
  })

  describe('getPipelineRun', () => {
    it('fetches the correct URL', async () => {
      mockFetchOk({})
      await api.getPipelineRun('test-ns', 'my-run')
      expect(fetch.mock.calls[0][0]).toBe('/api/pipelineruns/test-ns/my-run')
    })

    it('encodes both namespace and name', async () => {
      mockFetchOk({})
      await api.getPipelineRun('my ns', 'my run')
      expect(fetch.mock.calls[0][0]).toBe('/api/pipelineruns/my%20ns/my%20run')
    })

    it('returns the response data', async () => {
      const run = { name: 'my-run', status: 'Succeeded' }
      mockFetchOk(run)
      const result = await api.getPipelineRun('test-ns', 'my-run')
      expect(result).toEqual(run)
    })

    it('throws when response is not ok', async () => {
      mockFetchError(404, 'not found')
      await expect(api.getPipelineRun('test-ns', 'missing')).rejects.toThrow('HTTP 404')
    })
  })

  describe('triggerPipelineRun', () => {
    it('fetches the correct URL', async () => {
      mockFetchOk({})
      await api.triggerPipelineRun('test-ns', { pipelineName: 'p' })
      expect(fetch.mock.calls[0][0]).toBe('/api/pipelineruns/test-ns/trigger')
    })

    it('uses POST method', async () => {
      mockFetchOk({})
      await api.triggerPipelineRun('test-ns', { pipelineName: 'p' })
      const [, opts] = fetch.mock.calls[0]
      expect(opts.method).toBe('POST')
    })

    it('sends pipelineName in the request body', async () => {
      mockFetchOk({})
      await api.triggerPipelineRun('test-ns', { pipelineName: 'my-pipeline' })
      const [, opts] = fetch.mock.calls[0]
      const body = JSON.parse(opts.body)
      expect(body.pipelineName).toBe('my-pipeline')
    })

    it('sets Content-Type to application/json', async () => {
      mockFetchOk({})
      await api.triggerPipelineRun('test-ns', { pipelineName: 'p' })
      const [, opts] = fetch.mock.calls[0]
      expect(opts.headers['Content-Type']).toBe('application/json')
    })

    it('throws when response is not ok', async () => {
      mockFetchError(500)
      await expect(api.triggerPipelineRun('test-ns', { pipelineName: 'p' })).rejects.toThrow('HTTP 500')
    })
  })

  describe('getConfig', () => {
    it('fetches the correct URL', async () => {
      mockFetchOk({})
      await api.getConfig()
      expect(fetch.mock.calls[0][0]).toBe('/api/config')
    })

    it('returns the response data', async () => {
      const config = { namespace: 'test-ns' }
      mockFetchOk(config)
      const result = await api.getConfig()
      expect(result).toEqual(config)
    })

    it('throws when response is not ok', async () => {
      mockFetchError(500)
      await expect(api.getConfig()).rejects.toThrow('HTTP 500')
    })
  })

  describe('getHealth', () => {
    it('fetches the correct URL', async () => {
      mockFetchOk({ status: 'UP' })
      await api.getHealth()
      expect(fetch.mock.calls[0][0]).toBe('/q/health')
    })

    it('returns the response data', async () => {
      const health = { status: 'UP', checks: [] }
      mockFetchOk(health)
      const result = await api.getHealth()
      expect(result).toEqual(health)
    })

    it('throws when response is not ok', async () => {
      mockFetchError(503)
      await expect(api.getHealth()).rejects.toThrow('HTTP 503')
    })
  })
})
