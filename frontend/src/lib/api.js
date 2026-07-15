const BASE = '/api'
const MAX_RETRIES = 2

async function request(method, path, body = null, options = {}) {
  const { retries = MAX_RETRIES, headers = {} } = options
  const url = `${BASE}${path}`
  const config = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  }
  if (body) config.body = JSON.stringify(body)

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, config)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { success: false, data: null, message: data?.message || data?.detail || `HTTP ${res.status}`, error: true }
      }
      return { success: true, data, message: data?.message || 'OK', error: false }
    } catch (err) {
      if (attempt === retries) {
        return { success: false, data: null, message: err.message || 'Network error', error: true }
      }
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
    }
  }
  return { success: false, data: null, message: 'Request failed', error: true }
}

export const api = {
  get: (path, options) => request('GET', path, null, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  del: (path, options) => request('DELETE', path, null, options),
}
