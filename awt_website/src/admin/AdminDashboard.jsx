import { Activity, BookOpen, FlaskConical, LayoutDashboard, Plus, Users, Sparkles, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ lectures: 0, labs: 0, activities: 0, students: 0 })
  const [recentLectures, setRecentLectures] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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
    { label: 'Total Lectures', value: stats.lectures, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20', from: 'from-blue-500/5', to: 'to-indigo-500/5' },
    { label: 'Total Labs', value: stats.labs, icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-500/10', ring: 'ring-purple-500/20', from: 'from-purple-500/5', to: 'to-fuchsia-500/5' },
    { label: 'Total Activities', value: stats.activities, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', from: 'from-amber-500/5', to: 'to-orange-500/5' },
    { label: 'Total Students', value: stats.students, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', from: 'from-emerald-500/5', to: 'to-cyan-500/5' }
  ]

  return (
    <div className="space-y-6 stagger-children">
      {/* Page Title / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a1727] to-slate-900 p-8 shadow-2xl ring-1 ring-white/5">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-400/20">
              <Sparkles className="h-3 w-3" />
              Content Management Console
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Administrator
              </span>
            </h1>
            <p className="mt-1 text-slate-400">Control learning content, configure labs, and monitor platform health.</p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">System Time</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`group relative overflow-hidden rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/5 transition-all hover:ring-1 hover:${card.ring} card-hover`}
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

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Recent Lectures */}
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/15 text-blue-400">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-black text-white">Recent Lectures</h2>
            </div>
            <Link to="/admin/lectures" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-800/40" />
                ))
              : recentLectures.length
              ? recentLectures.map((lec, index) => (
                  <div
                    key={lec.id}
                    className="group/item flex items-center justify-between rounded-2xl bg-slate-800/30 px-4 py-3.5 transition hover:bg-slate-850 hover:ring-1 hover:ring-white/5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover/item:bg-blue-500/20">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-bold text-slate-200 group-hover/item:text-white transition">
                        {lec.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-slate-500">
                        {new Date(lec.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                          lec.is_published
                            ? 'bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20'
                            : 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20'
                        }`}
                      >
                        {lec.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))
              : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-10 w-10 text-slate-600" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No lectures yet</p>
                  <p className="mt-1 text-xs text-slate-650">Create your first lecture to see it here.</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Quick Actions & Content Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md">
            <h2 className="mb-5 text-base font-black text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add Lecture', to: '/admin/lectures/add', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/15', ring: 'hover:ring-blue-500/20' },
                { label: 'Add Lab', to: '/admin/labs/add', icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/15', ring: 'hover:ring-purple-500/20' },
                { label: 'Add Activity', to: '/admin/activities', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/15', ring: 'hover:ring-amber-500/20' },
                { label: 'Manage Users', to: '/admin/users', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/15', ring: 'hover:ring-emerald-400/20' },
              ].map(({ label, to, icon: Icon, color, bg, ring }) => (
                <Link
                  key={label}
                  to={to}
                  className={`flex flex-col items-center gap-3 rounded-2xl border border-white/5 p-4 text-center transition-all ${bg} ${ring} group`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </span>
                  <span className="text-xs font-bold text-slate-200">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md">
            <p className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Content Distribution</p>
            <div className="space-y-4">
              {[
                { label: 'Lectures', value: stats.lectures, color: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
                { label: 'Labs', value: stats.labs, color: 'bg-gradient-to-r from-purple-400 to-fuchsia-500' },
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
