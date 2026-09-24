import { useEffect, useState } from 'react'
import { api } from './api/client.js'
import ChatWindow from './components/ChatWindow.jsx'
import DocumentList from './components/DocumentList.jsx'
import DocumentUploader from './components/DocumentUploader.jsx'
import SessionSidebar from './components/SessionSidebar.jsx'
import { BookIcon, ShieldIcon, SignOutIcon } from './components/icons.jsx'
import { useAuth } from './context/AuthContext.jsx'

const GREETING = {
  role: 'assistant',
  text: 'Upload a protocol for cited answers — or just ask, and I’ll tell you when I’m answering from general knowledge.',
}

const SAMPLE_PROMPTS = [
  'How long should you rub hands with alcohol-based hand rub?',
  'What are the five moments for hand hygiene?',
  'What is the independent double-check for high-alert medications?',
]

function BrandMark() {
  return (
    <span className="flex size-9 items-center justify-center rounded-xl bg-verified text-sheet shadow-[0_2px_10px_rgba(11,107,98,0.35),0_1px_2px_rgba(22,34,46,0.2)]">
      <BookIcon className="size-5" />
    </span>
  )
}

export default function App() {
  const { user, signOut, authEnabled } = useAuth()
  const [documents, setDocuments] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([GREETING])
  const [uploading, setUploading] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  useEffect(() => {
    api
      .listDocuments()
      .then((docs) => {
        setDocuments(docs)
        setBackendDown(false)
      })
      .catch(() => setBackendDown(true))
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
            isGeneral: (m.sources == null || m.sources.length === 0) && m.role === 'assistant' && !m.content.includes('There are no reference documents'),
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
      setBackendDown(false)
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
    let isGeneral = false
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
        onDone({ isGeneral: general }) {
          isGeneral = general ?? false
        },
        onError(err) {
          throw new Error(err)
        },
      })
      sid = result.sessionId
      finalSources = result.sources
      isGeneral = result.isGeneral ?? isGeneral
      setMessages((prev) => {
        const copy = [...prev]
        copy[assistantIndex] = { role: 'assistant', text: streamed, sources: finalSources, isGeneral }
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
        const { answer, sources, session_id, is_general } = await api.sendMessage(text, activeSessionId)
        setMessages((prev) => {
          const copy = [...prev]
          copy[assistantIndex] = { role: 'assistant', text: answer, sources, isGeneral: is_general ?? false }
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

  const showHero = messages.length <= 1 && !activeSessionId && !thinking

  return (
    <div className="flex h-screen flex-col bg-paper text-ink md:flex-row">
      <aside className="sheet-scroll flex max-h-72 w-full shrink-0 flex-col gap-5 overflow-y-auto border-b border-rule bg-side p-5 md:max-h-none md:w-[300px] md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <div>
              <p className="text-[15px] font-semibold leading-tight">NurseAssist</p>
              <p className="tnum text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Handover desk
              </p>
            </div>
          </div>
          {authEnabled && user && (
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-rule-soft hover:text-ink"
            >
              <SignOutIcon className="size-4" />
            </button>
          )}
        </div>

        <section aria-label="Chats" className="flex min-h-0 flex-col">
          <p className="tnum mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Handover chats
          </p>
          <div className="min-h-0 flex-1">
            <SessionSidebar
              sessions={sessions}
              activeId={activeSessionId}
              onSelect={handleSelectSession}
              onCreate={handleCreateSession}
              onDelete={handleDeleteSession}
            />
          </div>
        </section>

        <section aria-label="Library" className="flex min-h-0 flex-col">
          <p className="tnum mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Protocol library
          </p>
          <DocumentUploader onUpload={handleUpload} uploading={uploading} />
          <div className="sheet-scroll mt-3 min-h-0 max-h-44 overflow-y-auto">
            <DocumentList documents={documents} onDelete={handleDelete} />
          </div>
        </section>

        <p className="mt-auto text-[11px] leading-snug text-ink-faint">
          Reference lookup only. Always follow institutional protocols and clinical judgment.
        </p>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-rule bg-sheet px-5 py-3 md:px-8">
          <h1 className="font-display text-lg leading-tight md:text-xl">
            Clinical Reference Assistant
          </h1>
          <span
            className={`tnum inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
              backendDown
                ? 'bg-danger-wash text-danger'
                : documents.length === 0
                  ? 'bg-caution-wash text-caution-ink'
                  : 'bg-verified-wash text-verified-deep'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                backendDown ? 'bg-danger' : documents.length === 0 ? 'bg-caution-ink' : 'bg-verified'
              }`}
            />
            {backendDown
              ? 'Backend offline'
              : `${documents.length} doc${documents.length === 1 ? '' : 's'} on file`}
          </span>
        </header>

        <div className="flex items-center justify-center gap-2 bg-caution-wash px-5 py-1.5 text-center text-[11px] leading-snug text-caution-ink">
          <ShieldIcon className="size-3.5 shrink-0" />
          <span>
            {documents.length === 0
              ? 'No protocols on file — answers are general knowledge until you add one. Not medical advice.'
              : 'Answers are grounded in your uploaded protocols and may contain errors. Not medical advice.'}
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <ChatWindow
            messages={messages}
            thinking={thinking}
            onSend={handleSend}
            showHero={showHero}
            heroPrompts={SAMPLE_PROMPTS}
          />
        </div>
      </main>
    </div>
  )
}
