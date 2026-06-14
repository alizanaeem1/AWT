import { Link, Outlet, useLocation } from 'react-router-dom'
import { ChevronLeft, Home } from 'lucide-react'
import BrandLogo from '../components/BrandLogo.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSEO } from '../hooks/useSEO.js'
import { useTheme } from '../hooks/useTheme.js'

export default function PublicViewerLayout() {
  const { user } = useAuth()
  const { websiteTitle } = useTheme()
  const location = useLocation()
  const isLab = location.pathname.startsWith('/labs/')

  useSEO({
    title: `${isLab ? 'AWT Lab' : 'AWT Lecture'} | AWT Lectures`,
    description: 'Open AWT lecture and lab content with practical examples, steps, outputs, and learning guidance.'
  })

  return (
    <div className="min-h-screen bg-[#0b1422] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#07111e]/90 px-4 py-3 backdrop-blur-md shadow-lg shadow-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Left: Brand / Back */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/45 px-3 text-xs font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link to="/" className="hidden items-center gap-2.5 sm:flex hover:opacity-90 transition-opacity">
              <BrandLogo className="h-8 w-8 rounded-lg bg-emerald-400 text-[9px] font-black text-slate-950" />
              <div className="min-w-0">
                <span className="block text-sm font-black leading-none text-white">AWT</span>
                <span className="block truncate text-[10px] font-medium text-slate-400 mt-0.5">{websiteTitle}</span>
              </div>
            </Link>
          </div>

          {/* Right: Auth / Portal */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/student"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Go to Portal
              </Link>
            ) : (
              <>
                <Link
                  to="/signin"
                  state={{ from: location }}
                  className="text-xs font-bold text-slate-400 transition hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  state={{ from: location }}
                  className="inline-flex h-9 items-center rounded-lg bg-emerald-400 px-4 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
