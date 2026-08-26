import { useEffect, useState } from 'react'
import { api } from './api/client.js'
import ChatWindow from './components/ChatWindow.jsx'
import DocumentList from './components/DocumentList.jsx'
import DocumentUploader from './components/DocumentUploader.jsx'
import SessionSidebar from './components/SessionSidebar.jsx'
import { useAuth } from './context/AuthContext.jsx'

const GREETING = {
  role: 'assistant',
  text: "Hi! I'm NurseAssist. Upload your clinical reference documents, then ask about any protocol, drug, or procedure — I'll answer using only what's in them, with cited sources.",
}

export default function App() {
  const { user, signOut, authEnabled } = useAuth()
  const [documents, setDocuments] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([GREETING])
  const [uploading, setUploading] = useState(false)
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    api
      .listDocuments()
      .then(setDocuments)
      .catch(() => {})
    api
      .listSessions()
      .then(setSessions)
      .catch(() => {})
  }, [user])

  async function refreshSessions(selectId) {
    const list = await api.listSessions()
    setSessions(list)
    if (selectId) setActiveSessionId(selectId)
  }

  async function handleSelectSession(sessionId) {
    setActiveSessionId(sessionId)
    try {
      const history = await api.getHistory(sessionId)
      if (history.length === 0) {
        setMessages([GREETING])
      } else {
        setMessages(
          history.map((m) => ({
            role: m.role,
            text: m.content,
            sources: m.sources ?? undefined,
            isError: false,
          })),
        )
      }
    } catch {
      setMessages([GREETING])
    }
  }

  async function handleCreateSession() {
    const session = await api.createSession()
    await refreshSessions(session.id)
    setMessages([GREETING])
  }

  async function handleDeleteSession(sessionId) {
    await api.deleteSession(sessionId)
    const list = await api.listSessions()
    setSessions(list)
    if (activeSessionId === sessionId) {
      setActiveSessionId(null)
      setMessages([GREETING])
    }
  }

  async function handleUpload(file) {
    setUploading(true)
    try {
      await api.uploadDocument(file)
      setDocuments(await api.listDocuments())
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', isError: true, text: `Upload failed: ${err.message}` },
      ])
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId) {
    try {
      await api.deleteDocument(docId)
      setDocuments(await api.listDocuments())
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', isError: true, text: `Delete failed: ${err.message}` },
      ])
    }
  }

  async function handleSend(text) {
    setMessages((prev) => [...prev, { role: 'user', text }])
    setThinking(true)
    const assistantIndex = messages.length + 1
    setMessages((prev) => [...prev, { role: 'assistant', text: '' }])
    let streamed = ''
    let finalSources = []
    // eslint-disable-next-line no-useless-assignment
    let sid = null
    try {
      const result = await api.sendMessageStream(text, activeSessionId, {
        onToken(token) {
          streamed += token
          setMessages((prev) => {
            const copy = [...prev]
            copy[assistantIndex] = { role: 'assistant', text: streamed }
            return copy
          })
        },
        onDone() {},
        onError(err) {
          throw new Error(err)
        },
      })
      sid = result.sessionId
      finalSources = result.sources
      setMessages((prev) => {
        const copy = [...prev]
        copy[assistantIndex] = { role: 'assistant', text: streamed, sources: finalSources }
        return copy
      })
      if (!activeSessionId && sid) {
        setActiveSessionId(sid)
        await refreshSessions(sid)
      } else if (sid) {
        await refreshSessions(sid)
      }
    } catch (err) {
      try {
        const { answer, sources, session_id } = await api.sendMessage(text, activeSessionId)
        setMessages((prev) => {
          const copy = [...prev]
          copy[assistantIndex] = { role: 'assistant', text: answer, sources }
          return copy
        })
        if (!activeSessionId && session_id) {
          setActiveSessionId(session_id)
          await refreshSessions(session_id)
        } else if (session_id) {
          await refreshSessions(session_id)
        }
      } catch (fallbackErr) {
        setMessages((prev) => {
          const copy = [...prev]
          copy[assistantIndex] = {
            role: 'assistant',
            isError: true,
            text: `Request failed: ${err.message || fallbackErr.message}`,
          }
          return copy
        })
      }
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 md:flex-row">
      <aside className="flex max-h-64 w-full shrink-0 flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 md:max-h-none md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
              N
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">NurseAssist</p>
              <p className="text-[11px] text-slate-500">Clinical Reference RAG</p>
            </div>
          </div>
          {authEnabled && user && (
            <button
              type="button"
              onClick={signOut}
              className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
            >
              Sign out
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SessionSidebar
            sessions={sessions}
            activeId={activeSessionId}
            onSelect={handleSelectSession}
            onCreate={handleCreateSession}
            onDelete={handleDeleteSession}
          />
        </div>

        <DocumentUploader onUpload={handleUpload} uploading={uploading} />

        <div className="min-h-0 max-h-32 overflow-y-auto">
          <DocumentList documents={documents} onDelete={handleDelete} />
        </div>

        <p className="text-[10px] leading-snug text-slate-400">
          Reference lookup only. Always follow institutional protocols and clinical judgment.
        </p>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <h1 className="text-sm font-semibold text-slate-900">Clinical Reference Assistant</h1>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
            {documents.length} document{documents.length === 1 ? '' : 's'} indexed
          </span>
        </header>

        <div className="bg-amber-50 px-6 py-1.5 text-center text-[11px] text-amber-800">
          Answers are generated from uploaded documents and may contain errors. Not medical advice.
        </div>

        <div className="min-h-0 flex-1">
          <ChatWindow messages={messages} thinking={thinking} onSend={handleSend} />
        </div>
      </main>
    </div>
  )
}
