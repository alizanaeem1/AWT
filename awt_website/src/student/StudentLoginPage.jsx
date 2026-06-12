import { BookOpen, CheckCircle2, Eye, EyeOff, FlaskConical, Lock, Mail, TrendingUp, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'

export default function StudentLoginPage() {
  const { signIn, signUp } = useAuth()
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

    // Block admin emails from student portal immediately — no network call needed
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (adminEmails.includes(email.trim().toLowerCase())) {
      setError('Invalid email or password.')
      setIsSubmitting(false)
      return
    }

    try {
      if (mode === 'signup') {
        const data = await signUp({ email, password, fullName })
        if (!data?.session) {
          setMessage('Account created! Check your inbox or try logging in.')
          setMode('login')
        } else {
          setMessage('Account created successfully.')
        }
      } else {
        const res = await signIn(email, password)
        if (res.profile?.role === 'admin') {
          // Fallback: sign out if admin somehow slips through
          await import('../lib/supabase.js').then(m => m.supabase.auth.signOut())
          setError('This portal is for students only. Please use the Admin Panel.')
        } else {
          setMessage('Signed in successfully.')
        }
      }
    } catch (authError) {
      setError(authError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-[#060e1a] text-slate-100">
      {/* Left Panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[55%]">
        {/* Gradient BG */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f38] to-[#071020]" />
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-20 h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[80px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/30">
            A
          </span>
          <div>
            <p className="font-black text-white">AWT</p>
            <p className="text-xs text-slate-500">Learning Platform</p>
          </div>
        </div>

        {/* Main Copy */}
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Student Portal</p>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-tight text-white">
            Learn Web<br />
            Technology<br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Interactively</span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-slate-400">
            Track your lecture progress, complete lab exercises, and monitor your learning analytics all in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: BookOpen, label: 'Lectures', desc: 'Rich lecture content' },
              { icon: FlaskConical, label: 'Lab Exercises', desc: 'Hands-on practice' },
              { icon: TrendingUp, label: 'Analytics', desc: 'Track your growth' },
              { icon: CheckCircle2, label: 'Progress', desc: 'Mark completions' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-[#1a2e45] bg-[#0d1a2a]/60 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-xs text-slate-600">© 2026 AWT Learning Platform. All rights reserved.</p>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14">
        {/* Mobile Logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/30">A</span>
          <p className="font-black text-white">AWT Learning Platform</p>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-black text-white">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login' ? 'Sign in to continue your learning journey.' : 'Join the AWT student learning platform.'}
          </p>

          {/* Toggle Tabs */}
          <div className="mt-7 flex rounded-xl border border-[#1a2d42] bg-[#0c1825] p-1">
            {['login', 'signup'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setMode(item); setError(''); setMessage('') }}
                className={[
                  'h-9 flex-1 rounded-lg text-sm font-bold capitalize transition-all',
                  mode === item
                    ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20'
                    : 'text-slate-400 hover:text-white'
                ].join(' ')}
              >
                {item === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <AuthInput
                icon={User}
                value={fullName}
                onChange={setFullName}
                placeholder="Full name"
                autoComplete="name"
              />
            )}
            <AuthInput
              icon={Mail}
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="Email address"
              required
              autoComplete="email"
            />
            <AuthInput
              icon={Lock}
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="Password"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full rounded-xl bg-emerald-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
              className="font-bold text-emerald-400 hover:text-emerald-300"
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}

function AuthInput({ icon: Icon, value, onChange, type = 'text', ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="relative">
      {Icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <input
        {...props}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-[#1a2d42] bg-[#0c1825] pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}
