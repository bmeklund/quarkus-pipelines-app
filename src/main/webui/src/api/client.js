const BASE = '/api'
const QUARKUS = '/q'

async function fetchJson(url, options = {}) {
  const headers = { ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  const res = await fetch(url, { headers, ...options })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json()
}

// Pipeline Runs
export const api = {
  listPipelines: (namespace) =>
    fetchJson(`${BASE}/pipelineruns/${encodeURIComponent(namespace)}/pipelines`),

  listPipelineRuns: (namespace) =>
    fetchJson(`${BASE}/pipelineruns/${encodeURIComponent(namespace)}`),

  getPipelineRun: (namespace, name) =>
    fetchJson(`${BASE}/pipelineruns/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`),

  triggerPipelineRun: (namespace, payload) =>
    fetchJson(`${BASE}/pipelineruns/${encodeURIComponent(namespace)}/trigger`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getConfig: () =>
    fetchJson(`${BASE}/config`),

  // Health
  getHealth: () =>
    fetchJson(`${QUARKUS}/health`),
}

