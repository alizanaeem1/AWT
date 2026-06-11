import { LogOut, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useDocsContent } from '../hooks/useDocsContent.js'
import { useAuth } from '../hooks/useAuth.js'
import { useProgress } from '../hooks/useProgress.js'

export default function StudentDashboard() {
  const { profile, signIn, signOut, signUp, user } = useAuth()
  const content = useDocsContent()
  const { isProgressLoading, records } = useProgress()
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        await signUp({ email, password, fullName })
        setMessage('Account created. You can now save your learning progress.')
      } else {
        await signIn(email, password)
        setMessage('Signed in successfully.')
      }
    } catch (authError) {
      setError(authError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    const lectureCount = content.filter((item) => item.type === 'lecture').length
    const labCount = content.filter((item) => item.type === 'lab').length
    const completedLectures = records.filter((record) => record.content_type === 'lecture' && record.status === 'completed')
    const completedLabs = records.filter((record) => record.content_type === 'lab' && record.status === 'completed')
    const totalTrackable = lectureCount + labCount
    const completedTotal = completedLectures.length + completedLabs.length
    const overallProgress = totalTrackable ? Math.round((completedTotal / totalTrackable) * 100) : 0
    const recentItems = records
      .filter((record) => record.status === 'completed')
      .slice(0, 5)

    return (
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">Student Workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            You are signed in as {user.email}. Your lesson and lab progress can now be saved to your account.
          </p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Overall course progress</p>
              <p className="text-sm font-bold text-cyan-600 dark:text-cyan-300">{isProgressLoading ? 'Loading...' : `${overallProgress}%`}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ProgressCard label="Completed lectures" value={`${completedLectures.length}/${lectureCount}`} />
            <ProgressCard label="Completed labs" value={`${completedLabs.length}/${labCount}`} />
            <ProgressCard label="Recent completions" value={recentItems.length} />
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent Completed Items</h2>
            <div className="mt-3 space-y-2">
              {recentItems.length ? recentItems.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{record.metadata?.title || record.content_id}</span>
                  <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-300">{record.content_type}</span>
                </div>
              )) : (
                <p className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">
                  No completed items yet.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">Student Auth</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Save Your AWT Progress</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Login or create a student account to keep lecture reads, lab completion, and activity progress connected to you.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950">
            {['login', 'signup'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={[
                  'h-10 flex-1 rounded-md text-sm font-bold capitalize transition',
                  mode === item ? 'bg-cyan-400 text-slate-950' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
                ].join(' ')}
              >
                {item}
              </button>
            ))}
          </div>

          {error ? <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-600 dark:text-red-100">{error}</p> : null}
          {message ? <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-700 dark:text-emerald-100">{message}</p> : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'signup' ? (
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full name"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            ) : null}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="student@example.com"
              required
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Password"
              required
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Create Student Account' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function ProgressCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}
