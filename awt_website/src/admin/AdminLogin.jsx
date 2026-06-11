import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { TextInput } from './AdminShell.jsx'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin, isLoading, profile, signIn, signOut, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const from = location.state?.from?.pathname || '/admin/dashboard'

  if (!isLoading && isAdmin) return <Navigate to={from} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await signIn(email, password)
      if (result.profile?.role !== 'admin') {
        await signOut()
        setError('This account is not an admin. Please use an admin email address.')
        return
      }
      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">Admin Login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Sign in with your Supabase admin account to manage AWT content.</p>

        {user && profile && profile.role !== 'admin' ? (
          <div className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            You are signed in as a student. Sign out before using an admin account.
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <TextInput value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@example.com" required />
          <div className="relative">
            <TextInput value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Password" required className="pr-12" />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-emerald-400 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Continue to Dashboard'}
          </button>
        </form>

        {user ? (
          <button type="button" onClick={signOut} className="mt-4 w-full text-center text-sm font-medium text-slate-400 hover:text-white">
            Sign out current account
          </button>
        ) : null}

        <Link to="/" className="mt-6 block text-center text-sm font-medium text-slate-400 hover:text-white">
          Back to website
        </Link>
      </section>
    </main>
  )
}
