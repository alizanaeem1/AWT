import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'
import { TextInput } from './AdminShell.jsx'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin, isLoading, profile, signIn, signOut, user } = useAuth()
  const { websiteTitle } = useTheme()
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070e17] px-4 py-12 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Dynamic Background Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 rounded-full bg-cyan-500/10 blur-[80px]" />

      <section className="relative w-full max-w-[440px] rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl shadow-black/50 transition-all duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Lock className="h-6 w-6 text-slate-950 font-black" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-white">Admin Login</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Sign in with your Supabase admin account to manage {websiteTitle} content.
          </p>
        </div>

        {user && profile && profile.role !== 'admin' ? (
          <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3.5 text-xs font-semibold text-amber-300">
            You are signed in as a student. Sign out before using an admin account.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3.5 text-xs font-semibold text-red-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <TextInput 
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              type="email" 
              placeholder="admin@example.com" 
              required 
              className="border-slate-800 bg-slate-950/60 focus:border-emerald-500 focus:ring-emerald-500/10"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
            <div className="relative">
              <TextInput 
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password" 
                required 
                className="pr-12 border-slate-800 bg-slate-950/60 focus:border-emerald-500 focus:ring-emerald-500/10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800/60 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-emerald-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Continue to Dashboard'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 border-t border-slate-800/80 pt-6 text-sm font-medium">
          {user ? (
            <button 
              type="button" 
              onClick={signOut} 
              className="text-xs text-red-400 transition hover:text-red-300 hover:underline"
            >
              Sign out current account
            </button>
          ) : null}

          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
          >
            Back to website
          </Link>
        </div>
      </section>
    </main>
  )
}
