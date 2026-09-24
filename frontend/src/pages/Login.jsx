import { useAuth } from '../context/AuthContext.jsx'
import { AlertIcon, BookIcon, DocIcon, ShieldIcon } from '../components/icons.jsx'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c0 1.1-.7 2.7-2.2 3.8l-.1.1 3.2 2.5.2.1c2-1.9 4-4.2 3.9-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.6 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.1 2.4-.1.1C3.9 21.4 7.7 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3-2.3-.1.1C.7 9.4 0 10.6 0 12s.7 2.6 2 4.7l3.2-2.3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.7 0 3.9 2.6 2 6.9l3.2 2.5C6.1 6.8 8.8 4.7 12 4.7z"
      />
    </svg>
  )
}

function TrustRow({ icon, title, body }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-night-soft text-paper">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-[13px] leading-relaxed text-paper/70">{body}</span>
      </span>
    </li>
  )
}

function SampleStub() {
  return (
    <div className="rounded-xl border border-paper/15 bg-night-soft p-4" aria-hidden="true">
      <p className="tnum text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/60">
        Provenance · 2 sources
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="tnum rounded-lg bg-verified px-2.5 py-1 text-[11px] font-medium text-sheet">
          hand_hygiene.md · p.1
        </span>
        <span className="tnum rounded-lg bg-verified px-2.5 py-1 text-[11px] font-medium text-sheet">
          infection_control.md · p.1
        </span>
      </div>
      <p className="mt-2 border-t-2 border-dashed border-caution-rule/60 pt-2 text-xs leading-snug text-paper/60">
        …or a clearly labeled general-knowledge answer when no document matches.
      </p>
    </div>
  )
}

export default function Login() {
  const { signInWithGoogle, authEnabled } = useAuth()

  if (!authEnabled) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper p-6 text-ink">
        <div className="max-w-sm rounded-2xl border border-rule bg-sheet p-8 text-center shadow-[0_2px_8px_rgba(22,34,46,0.12)]">
          <p className="text-sm leading-relaxed text-ink-soft">
            Auth is not configured. Set <code className="tnum rounded bg-rule-soft px-1">VITE_SUPABASE_URL</code> and{' '}
            <code className="tnum rounded bg-rule-soft px-1">VITE_SUPABASE_ANON_KEY</code> to enable Google sign-in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-screen md:grid-cols-2">
      <div className="flex flex-col justify-between bg-night p-8 text-paper md:p-12">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-verified text-sheet">
            <BookIcon className="size-5" />
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-tight">NurseAssist</p>
            <p className="tnum text-[11px] uppercase tracking-[0.14em] text-paper/60">
              Handover desk
            </p>
          </div>
        </div>

        <div className="py-10">
          <h1 className="font-display max-w-[16ch] text-3xl leading-tight md:text-[2.75rem]">
            Every answer shows its work.
          </h1>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-paper/70">
            File your protocols, ask your question, and get a cited answer you can verify at a
            glance — built for the pace of the ward.
          </p>
          <ul className="mt-8 max-w-[52ch] space-y-5">
            <TrustRow
              icon={<DocIcon className="size-4" />}
              title="Cited from your documents"
              body="Answers arrive with document, page, and passage attached — never a bare claim."
            />
            <TrustRow
              icon={<ShieldIcon className="size-4" />}
              title="Guardrails that refuse"
              body="No diagnosis, no personal dosing. Out-of-scope questions are turned away, not guessed at."
            />
            <TrustRow
              icon={<AlertIcon className="size-4" />}
              title="Honest when unsure"
              body="No matching document means a clearly labeled general-knowledge answer — never invented citations."
            />
          </ul>
        </div>

        <div className="space-y-4">
          <SampleStub />
          <p className="text-[11px] leading-snug text-paper/50">
            Reference lookup only. Always follow institutional protocols and clinical judgment.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-paper p-6 text-ink">
        <div className="w-full max-w-sm rounded-2xl border border-rule bg-sheet p-8 shadow-[0_2px_8px_rgba(22,34,46,0.12)]">
          <p className="tnum text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Sign in to your desk
          </p>
          <h2 className="font-display mt-2 text-2xl leading-tight">Welcome back.</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Your protocols, handovers, and cited history are filed per user — sign in to open
            your own desk.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-rule bg-paper px-4 py-3 text-sm font-semibold transition-colors hover:border-verified hover:bg-verified-wash"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <p className="mt-5 text-center text-[11px] leading-snug text-ink-faint">
            Reference lookup only. Not medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
