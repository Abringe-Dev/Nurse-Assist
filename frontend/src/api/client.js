import { authEnabled, supabase } from '../lib/supabase.js'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function authHeaders() {
  if (!authEnabled || !supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(response) {
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = body.detail || JSON.stringify(body)
    } catch {
      // keep fallback
    }
    throw new Error(detail)
  }
  return response.json()
}

export const api = {
  async uploadDocument(file) {
    const form = new FormData()
    form.append('file', file)
    return handle(
      await fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: await authHeaders(),
        body: form,
      }),
    )
  },

  async listDocuments() {
    const data = await handle(
      await fetch(`${BASE_URL}/documents`, { headers: await authHeaders() }),
    )
    return data.documents
  },

  async deleteDocument(docId) {
    return handle(
      await fetch(`${BASE_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      }),
    )
  },

  async sendMessage(message, sessionId) {
    return handle(
      await fetch(`${BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ message, session_id: sessionId ?? null }),
      }),
    )
  },

  async sendMessageStream(message, sessionId, handlers) {
    const response = await fetch(`${BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ message, session_id: sessionId ?? null }),
    })
    if (!response.ok) {
      let detail = response.statusText
      try {
        const body = await response.json()
        detail = body.detail || JSON.stringify(body)
      } catch {
        // ignore
      }
      throw new Error(detail)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let sessionIdOut = sessionId
    let sourcesOut = []
    let isGeneralOut = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data: ')) continue
        const payload = JSON.parse(line.slice(6))
        if (payload.token) handlers.onToken(payload.token)
        if (payload.done) {
          sessionIdOut = payload.session_id ?? sessionIdOut
          sourcesOut = payload.sources ?? []
          isGeneralOut = payload.is_general ?? false
          handlers.onDone({ sessionId: sessionIdOut, sources: sourcesOut, isGeneral: isGeneralOut })
        }
        if (payload.error) handlers.onError(payload.error)
      }
    }
    return { sessionId: sessionIdOut, sources: sourcesOut, isGeneral: isGeneralOut }
  },

  async listSessions() {
    const data = await handle(await fetch(`${BASE_URL}/sessions`, { headers: await authHeaders() }))
    return data.sessions
  },

  async createSession(title) {
    return handle(
      await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ title: title ?? null }),
      }),
    )
  },

  async deleteSession(sessionId) {
    return handle(
      await fetch(`${BASE_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      }),
    )
  },

  async getHistory(sessionId) {
    const data = await handle(
      await fetch(`${BASE_URL}/chat/history/${sessionId}`, { headers: await authHeaders() }),
    )
    return data.messages
  },

  async getMe() {
    return handle(await fetch(`${BASE_URL}/auth/me`, { headers: await authHeaders() }))
  },
}
