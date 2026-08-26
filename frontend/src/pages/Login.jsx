import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { signInWithGoogle, authEnabled } = useAuth()

  if (!authEnabled) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            Auth is not configured. Set <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> to enable Google sign-in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
            N
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">NurseAssist</p>
            <p className="text-xs text-slate-500">Sign in to continue</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Continue with Google
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">Reference lookup only. Not medical advice.</p>
      </div>
    </div>
  )
}
