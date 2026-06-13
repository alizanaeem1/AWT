import { Eye, EyeOff, Loader2, Mail, Sparkles, User, Lock, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'

/* Force dark rendering regardless of site theme */
const darkStyle = { colorScheme: 'dark' }

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw) => /\d/.test(pw) },
]

export default function SignUpPage() {
  const navigate = useNavigate()
  const { user, profile, isLoading, signUp } = useAuth()
  const { websiteTitle } = useTheme()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const location = useLocation()
  const from = location.state?.from?.pathname || '/student'

  // If already logged in redirect
  if (!isLoading && user && profile) {
    return <Navigate to={from} replace />
  }

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(password)).length
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][passwordStrength] || ''
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400'][passwordStrength] || ''

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Block admin emails immediately
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (adminEmails.includes(email.trim().toLowerCase())) {
      setError('This email cannot be used for a student account.')
      return
    }

    if (passwordStrength < 3) {
      setError('Please create a stronger password meeting all requirements.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.')
      return
    }

    setIsSubmitting(true)
    try {
      await signUp({ email, password, fullName })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020817] text-white" data-theme="dark" style={darkStyle}>
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 right-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-md page-animate text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white">You&apos;re in!</h2>
            <p className="mt-3 text-slate-400">
              Account created successfully. Check your email to confirm your address, then sign in to start learning.
            </p>
            <Link
              to="/signin"
              state={{ from: location.state?.from }}
              className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-xl bg-emerald-400 px-8 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300"
            >
              Sign in now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-white" data-theme="dark" style={darkStyle}>
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 right-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/8 blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative flex min-h-screen">
        {/* ── RIGHT side visual panel (shown on desktop left) ── */}
        <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-slate-800/60 p-12 lg:flex">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full border border-cyan-400/10" />
          <div className="absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full border border-cyan-400/8" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/3 translate-y-1/3 rounded-full border border-emerald-400/10" />

          {/* Brand */}
          <Link to="/" className="relative flex items-center gap-3">
            <BrandLogo className="h-11 w-11 rounded-xl bg-emerald-400 text-[10px] font-black text-slate-950" />
            <span>
              <span className="block text-2xl font-black leading-tight">AWT</span>
              <span className="block text-xs font-medium text-slate-400">Interactive Learning Platform</span>
            </span>
          </Link>

          <div className="relative">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-cyan-400">Start for Free</span>
            </div>

            <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white">
              Begin Your<br />
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Web Dev Journey
              </span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-400">
              Join thousands of students mastering advanced web technologies. Get instant access to all lectures, labs, and progress tracking.
            </p>

            {/* What you get */}
            <div className="mt-10 space-y-4">
              {[
                { icon: '⚡', label: 'Instant access', text: 'Start learning immediately after signing up' },
                { icon: '📈', label: 'Progress tracking', text: 'Monitor your growth with real-time stats' },
                { icon: '🎓', label: 'Expert content', text: 'Curated lectures and hands-on lab exercises' },
              ].map(({ icon, label, text }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/50 text-base mt-0.5">
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-12 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
              <p className="text-sm italic leading-6 text-slate-300">
                &ldquo;AWT transformed how I understand web development. The hands-on labs are exactly what I needed to go from theory to practice.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-black text-emerald-400">
                  AK
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Ahmed K.</p>
                  <p className="text-xs text-slate-500">CS Student, FAST</p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} {websiteTitle || 'AWT Learning Platform'} · All rights reserved.
          </p>
        </aside>

        {/* ── FORM PANEL ── */}
        <main className="relative flex w-full flex-col items-center justify-center px-5 py-12 lg:w-1/2 lg:px-16">
          {/* Top Right Back to Home */}
          <Link
            to="/"
            className="absolute right-6 top-6 hidden items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-400 backdrop-blur transition hover:bg-slate-800 hover:text-white sm:flex"
          >
            ← Back to Home
          </Link>

          {/* Mobile brand */}
          <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandLogo className="h-10 w-10 rounded-xl bg-emerald-400 text-[10px] font-black text-slate-950" />
            <span className="text-xl font-black">AWT</span>
          </Link>

          <div className="w-full max-w-md page-animate">
            <div className="rounded-2xl border p-8 shadow-2xl shadow-black/40 backdrop-blur-xl" style={{ backgroundColor: 'rgba(15,23,42,0.85)', borderColor: 'rgba(51,65,85,0.7)' }}>
              {/* Toggle Tabs */}
              <div className="mb-8 flex rounded-xl border border-slate-700/60 bg-slate-800/40 p-1">
                <Link
                  to="/signin"
                  state={{ from: location.state?.from }}
                  className="flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-bold text-slate-400 transition hover:text-white"
                >
                  Sign In
                </Link>
                <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-emerald-400 text-sm font-bold text-slate-950 shadow-sm">
                  Sign Up
                </div>
              </div>

              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 ring-1 ring-emerald-400/30">
                <User className="h-6 w-6 text-emerald-400" />
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Create account</h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Join our platform for free.
              </p>

              {/* Error */}
              {error && (
                <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-300 animate-fade-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {/* Full Name */}
                <div className="group">
                  <label htmlFor="signup-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Full name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ali Naeem"
                      style={{ backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(71,85,105,0.7)', color: '#f1f5f9' }}
                      className="h-12 w-full rounded-xl border pl-11 pr-4 text-sm placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-400/15"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{ backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(71,85,105,0.7)', color: '#f1f5f9' }}
                      className="h-12 w-full rounded-xl border pl-11 pr-4 text-sm placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-400/15"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      style={{ backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(71,85,105,0.7)', color: '#f1f5f9' }}
                    className="h-12 w-full rounded-xl border pl-11 pr-12 text-sm placeholder-slate-500 outline-none transition focus:ring-2"
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

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div className="mt-2.5 animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex flex-1 gap-1">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength ? strengthColor : 'bg-slate-700'}`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-semibold ${strengthColor.replace('bg-', 'text-')}`}>
                          {strengthLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {PASSWORD_RULES.map((rule) => (
                          <div key={rule.id} className={`flex items-center gap-1 text-xs transition-colors ${rule.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            {rule.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label htmlFor="signup-confirm" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Confirm password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="signup-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      style={{
                      backgroundColor: 'rgba(30,41,59,0.6)',
                      borderColor: confirmPassword.length > 0
                        ? confirmPassword === password ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)'
                        : 'rgba(71,85,105,0.7)',
                      color: '#f1f5f9'
                    }}
                    className="h-12 w-full rounded-xl border pl-11 pr-12 text-sm placeholder-slate-500 outline-none transition focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-700/60 hover:text-white"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <p className="text-xs text-slate-500">
                  By creating an account you agree to our{' '}
                  <span className="font-medium text-slate-400">Terms of Service</span>{' '}
                  and{' '}
                  <span className="font-medium text-slate-400">Privacy Policy</span>.
                </p>

                {/* Submit */}
                <button
                  type="submit"
                  id="signup-submit"
                  disabled={isSubmitting || isLoading}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    'Create free account'
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
