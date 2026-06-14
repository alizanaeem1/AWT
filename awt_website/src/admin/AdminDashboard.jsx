import { Activity, BookOpen, Download, FlaskConical, Users, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePWAInstall } from '../hooks/usePWAInstall.js'
import { supabase } from '../lib/supabase.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ lectures: 0, labs: 0, activities: 0, students: 0 })
  const [recentLectures, setRecentLectures] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [installNotice, setInstallNotice] = useState('')
  const { canInstall, installApp, installResult, isIOS, isStandalone } = usePWAInstall()

  useEffect(() => {
    async function load() {
      const [{ count: lectures }, { count: labs }, { count: activities }, { count: students }, { data: recent }] =
        await Promise.all([
          supabase.from('lectures').select('*', { count: 'exact', head: true }),
          supabase.from('labs').select('*', { count: 'exact', head: true }),
          supabase.from('activities').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('lectures').select('id,title,is_published,created_at').order('created_at', { ascending: false }).limit(5)
        ])
      setStats({ lectures: lectures || 0, labs: labs || 0, activities: activities || 0, students: students || 0 })
      setRecentLectures(recent || [])
      setIsLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Lectures',   value: stats.lectures,   icon: BookOpen,    color: 'text-blue-400',   bg: 'bg-blue-500/10',   ring: 'ring-blue-500/20',   from: 'from-blue-500/5',   to: 'to-indigo-500/5' },
    { label: 'Total Labs',       value: stats.labs,       icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-500/10', ring: 'ring-purple-500/20', from: 'from-purple-500/5', to: 'to-fuchsia-500/5' },
    { label: 'Total Activities', value: stats.activities, icon: Activity,    color: 'text-amber-400',  bg: 'bg-amber-500/10',  ring: 'ring-amber-500/20',  from: 'from-amber-500/5',  to: 'to-orange-500/5' },
    { label: 'Total Students',   value: stats.students,   icon: Users,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', from: 'from-emerald-500/5', to: 'to-cyan-500/5' }
  ]

  async function handleAdminInstall() {
    if (canInstall) {
      const result = await installApp('admin')
      if (result.outcome === 'accepted') {
        setInstallNotice('Admin app installation started.')
      } else if (result.outcome === 'dismissed') {
        setInstallNotice('Install was dismissed. You can install later from the browser menu.')
      }
      return
    }
    setInstallNotice(
      isIOS
        ? 'To install, tap Share then Add to Home Screen.'
        : 'Install is not available yet. Open the browser menu and choose Install app, or reload after the page finishes loading.'
    )
  }

  return (
    <div className="w-full space-y-5">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1727] to-slate-900 p-5 shadow-2xl ring-1 ring-white/5 sm:rounded-3xl sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-400/20">
              <Sparkles className="h-3 w-3" />
              Content Management Console
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Administrator
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Control learning content, configure labs, and monitor platform health.</p>
          </div>
          <div className="shrink-0 space-y-2 sm:space-y-3 sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">System Time</p>
            <p className="text-sm font-semibold text-slate-300">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {!isStandalone && (
              <button
                type="button"
                onClick={handleAdminInstall}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-4 text-sm font-black text-emerald-300 transition hover:border-emerald-300 hover:bg-emerald-400/15"
              >
                <Download className="h-4 w-4" />
                Install Admin App
              </button>
            )}
            {(installNotice || installResult === 'dismissed') && (
              <p className="max-w-xs text-xs font-semibold text-slate-500 sm:ml-auto">
                {installNotice || 'Install was dismissed. You can install later from the browser menu.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards — 2 cols mobile, 4 cols xl ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/5 transition-all card-hover"
          >
            <div className={`absolute -right-4 -top-4 h-14 w-14 rounded-full bg-gradient-to-br ${card.from} ${card.to} opacity-50 blur-xl transition group-hover:scale-125`} />
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${card.bg} transition duration-300 group-hover:scale-110`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-white">
              {isLoading ? (
                <span className="inline-block h-6 w-10 animate-pulse rounded bg-slate-800" />
              ) : (
                card.value
              )}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid — stacks on mobile, side-by-side on xl ── */}
      <div className="grid w-full gap-5 xl:grid-cols-[1fr_360px]">

        {/* Recent Lectures */}
        <div className="w-full min-w-0 rounded-2xl border border-white/5 bg-slate-900/60 p-5 backdrop-blur-md sm:rounded-3xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500/15 text-blue-400">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-black text-white">Recent Lectures</h2>
            </div>
            <Link to="/admin/lectures" className="shrink-0 text-xs font-bold text-emerald-400 transition hover:text-emerald-300">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-800/40" />
                ))
              : recentLectures.length
              ? recentLectures.map((lec, index) => (
                  <div
                    key={lec.id}
                    className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-800/30 px-3 py-3 transition hover:bg-slate-800/50 sm:px-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Icon */}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <BookOpen className="h-4 w-4" />
                    </span>

                    {/* Title — truncates, takes available space */}
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-200">
                      {lec.title}
                    </span>

                    {/* Badge only on sm+ — on mobile just show the status dot */}
                    <span
                      className={`hidden shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider sm:inline-flex ${
                        lec.is_published
                          ? 'bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20'
                          : 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20'
                      }`}
                    >
                      {lec.is_published ? 'Published' : 'Draft'}
                    </span>

                    {/* Mobile: just a colored dot */}
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full sm:hidden ${
                        lec.is_published ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                ))
              : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-10 w-10 text-slate-600" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No lectures yet</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Right Column: Quick Actions + Content Distribution */}
        <div className="flex w-full flex-col gap-5 min-w-0">

          {/* Quick Actions */}
          <div className="w-full rounded-2xl border border-white/5 bg-slate-900/60 p-5 backdrop-blur-md sm:rounded-3xl sm:p-6">
            <h2 className="mb-4 text-base font-black text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add Lecture',   to: '/admin/lectures/add', icon: BookOpen,    color: 'text-blue-400',   bg: 'bg-blue-500/10 hover:bg-blue-500/15' },
                { label: 'Add Lab',       to: '/admin/labs/add',     icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/15' },
                { label: 'Add Activity',  to: '/admin/activities',   icon: Activity,    color: 'text-amber-400',  bg: 'bg-amber-500/10 hover:bg-amber-500/15' },
                { label: 'Manage Users',  to: '/admin/users',        icon: Users,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/15' },
              ].map(({ label, to, icon: Icon, color, bg }) => (
                <Link
                  key={label}
                  to={to}
                  className={`flex flex-col items-center gap-2.5 rounded-2xl border border-white/5 p-4 text-center transition-all ${bg} group`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11">
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                  </span>
                  <span className="text-xs font-bold text-slate-200">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Content Distribution */}
          <div className="w-full rounded-2xl border border-white/5 bg-slate-900/60 p-5 backdrop-blur-md sm:rounded-3xl sm:p-6">
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Content Distribution</p>
            <div className="space-y-4">
              {[
                { label: 'Lectures',   value: stats.lectures,   color: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
                { label: 'Labs',       value: stats.labs,       color: 'bg-gradient-to-r from-purple-400 to-fuchsia-500' },
                { label: 'Activities', value: stats.activities, color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
              ].map(({ label, value, color }) => {
                const total = stats.lectures + stats.labs + stats.activities || 1
                return (
                  <div key={label}>
                    <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-400">
                      <span>{label}</span>
                      <span className="text-white">{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-1000`}
                        style={{ width: `${(value / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
