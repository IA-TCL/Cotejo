const BASE = '/api'

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-Analista': localStorage.getItem('analista_nombre') || '',
  }
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  expedientes: {
    list: () => req('GET', '/expedientes'),
    create: (body) => req('POST', '/expedientes', body),
    get: (id) => req('GET', `/expedientes/${id}`),
  },
  campos: {
    patch: (expId, campoId, body) =>
      req('PATCH', `/expedientes/${expId}/campos/${campoId}`, body),
  },
  resoluciones: {
    upsert: (expId, campoId, body) =>
      req('PUT', `/expedientes/${expId}/resoluciones/${campoId}`, body),
  },
  decision: {
    post: (expId, body) => req('POST', `/expedientes/${expId}/decision`, body),
  },
}
