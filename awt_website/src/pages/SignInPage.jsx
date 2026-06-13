import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'

export default function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, isLoading, signIn, signOut } = useAuth()
  const { websiteTitle } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = location.state?.from?.pathname || '/student'

  // If already logged in as student, redirect
  if (!isLoading && user && profile?.role === 'student') {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await signIn(email, password)
      const role = result.profile?.role
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/4 blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(52,211,153,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative flex min-h-screen">
        {/* ── LEFT PANEL ── */}
        <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-slate-800/60 p-12 lg:flex">
          {/* decorative rings */}
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full border border-emerald-400/10" />
          <div className="absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full border border-emerald-400/8" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[300px] translate-x-1/3 translate-y-1/3 rounded-full border border-cyan-400/10" />

          {/* Brand */}
          <Link to="/" className="relative flex items-center gap-3">
            <BrandLogo className="h-11 w-11 rounded-xl bg-emerald-400 text-[10px] font-black text-slate-950" />
            <span>
              <span className="block text-2xl font-black leading-tight">AWT</span>
              <span className="block text-xs font-medium text-slate-400">Interactive Learning Platform</span>
            </span>
          </Link>

          {/* Center content */}
          <div className="relative">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-emerald-400">Welcome Back</span>
            </div>

            <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white">
              Continue Your<br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Learning Journey
              </span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-400">
              Access your personalized dashboard, track your progress through lectures and labs, and pick up right where you left off.
            </p>

            {/* Feature highlights */}
            <div className="mt-10 space-y-4">
              {[
                { icon: '📚', text: 'Access all lectures and lab materials' },
                { icon: '📊', text: 'Track your progress and completion stats' },
                { icon: '🏆', text: 'Earn badges and showcase your skills' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/50 text-base">
                    {icon}
                  </span>
                  {text}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 flex items-center gap-8 text-sm">
              <div>
                <p className="text-2xl font-black text-white">5K+</p>
                <p className="text-slate-400">Students</p>
              </div>
              <div className="h-10 w-px bg-slate-700/60" />
              <div>
                <p className="text-2xl font-black text-white">24+</p>
                <p className="text-slate-400">Lectures</p>
              </div>
              <div className="h-10 w-px bg-slate-700/60" />
              <div>
                <p className="text-2xl font-black text-white">15+</p>
                <p className="text-slate-400">Labs</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} {websiteTitle || 'AWT Learning Platform'} · All rights reserved.
          </p>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <main className="flex w-full flex-col items-center justify-center px-5 py-12 lg:w-1/2 lg:px-16">
          {/* Mobile brand */}
          <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandLogo className="h-10 w-10 rounded-xl bg-emerald-400 text-[10px] font-black text-slate-950" />
            <span className="text-xl font-black">AWT</span>
          </Link>

          <div className="w-full max-w-md page-animate">
            {/* Card */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 ring-1 ring-emerald-400/30">
                <Lock className="h-7 w-7 text-emerald-400" />
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white">Sign in</h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="font-semibold text-emerald-400 transition hover:text-emerald-300">
                  Create one free
                </Link>
              </p>

              {/* Logged in as wrong role warning */}
              {user && profile?.role !== 'student' && (
                <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/8 px-4 py-3 text-sm text-amber-300">
                  You are currently signed in. Sign out to switch accounts.
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-300 animate-fade-in">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {/* Email */}
                <div className="group">
                  <label htmlFor="signin-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-emerald-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="signin-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-xl border border-slate-700/70 bg-slate-800/50 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="signin-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-emerald-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-slate-700/70 bg-slate-800/50 pl-11 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-700/60 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <span className="text-xs font-medium text-slate-400 cursor-default">
                    Forgot password? Contact your admin.
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="signin-submit"
                  disabled={isSubmitting || isLoading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in to your account'
                  )}
                </button>
              </form>

              {/* Sign out current */}
              {user && (
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-4 w-full text-center text-sm font-medium text-slate-400 transition hover:text-white"
                >
                  Sign out current account
                </button>
              )}

              {/* Divider */}
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-xs text-slate-600">OR</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* Admin login link */}
              <Link
                to="/admin/login"
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-800/30 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/60 hover:text-white"
              >
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                Admin login
              </Link>
            </div>

            {/* Back to home */}
            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-slate-500 transition hover:text-slate-300">
                ← Back to homepage
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
