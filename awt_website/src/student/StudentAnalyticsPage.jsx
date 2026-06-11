import { BookOpen, CheckCircle2, FlaskConical, PieChart, TrendingUp, Zap, Target, Award } from 'lucide-react'
import { useProgress } from '../hooks/useProgress.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
import { calculateStudentStats } from './studentProgress.js'

export default function StudentAnalyticsPage() {
  const { lectures, labs } = useStudentContent()
  const { records, readIds } = useProgress()
  const stats = calculateStudentStats({ lectures, labs, records, readIds })

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1f35] to-slate-900 p-8 ring-1 ring-white/5">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-400 ring-1 ring-purple-400/20">
              <TrendingUp className="h-3 w-3" />
              Learning Analytics
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Your Progress Report</h1>
            <p className="mt-1.5 text-sm text-slate-400">A detailed breakdown of your learning journey.</p>
          </div>

          {/* Big overall stat */}
          <div className="flex shrink-0 flex-col items-center rounded-2xl bg-slate-800/40 px-8 py-5 text-center ring-1 ring-white/5">
            <p className="text-5xl font-black text-white">{stats.overallProgress}<span className="text-2xl text-slate-400">%</span></p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">Overall Progress</p>
            <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 transition-all duration-1000"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
        <StatCard icon={PieChart}    label="Overall Progress"     value={`${stats.overallProgress}%`}                         color="text-teal-400"   bg="bg-teal-400/10"   ring="ring-teal-400/20" />
        <StatCard icon={BookOpen}   label="Lectures Completed"   value={`${stats.completedLectures} / ${stats.totalLectures}`} color="text-blue-400"   bg="bg-blue-400/10"   ring="ring-blue-400/20" />
        <StatCard icon={FlaskConical} label="Labs Completed"     value={`${stats.completedLabs} / ${stats.totalLabs}`}         color="text-purple-400" bg="bg-purple-400/10" ring="ring-purple-400/20" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DonutChart title="Lectures" icon={BookOpen} completed={stats.completedLectures} total={stats.totalLectures} color="#3b82f6" glow="bg-blue-500/10" />
        <DonutChart title="Labs"     icon={FlaskConical} completed={stats.completedLabs} total={stats.totalLabs}     color="#a855f7" glow="bg-purple-500/10" />
        <MilestoneCard stats={stats} />
      </div>

      {/* Recent Activity */}
      <section className="rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/5">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
          <Zap className="h-4 w-4 text-amber-400" />
          Recent Activity
        </h2>
        {stats.recentCompleted.length ? (
          <div className="space-y-2">
            {stats.recentCompleted.map((record, i) => (
              <div
                key={record.id}
                className="flex items-center gap-4 rounded-2xl bg-slate-800/40 px-4 py-3.5 transition hover:bg-slate-800/60"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${record.content_type === 'lecture' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                  {record.content_type === 'lecture' ? <BookOpen className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{record.metadata?.title || record.content_id}</p>
                  <p className="mt-0.5 text-xs capitalize text-slate-500">{record.content_type} completed</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs text-slate-500 sm:block">
                    {new Date(record.completed_at || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
              <Zap className="h-7 w-7" />
            </span>
            <p className="mt-4 text-sm font-bold text-slate-400">No activity yet</p>
            <p className="mt-1 text-xs text-slate-600">Complete a lecture or lab to see your activity here.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg, ring }) {
  return (
    <div className={`group relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/5 transition-all hover:ring-1 hover:${ring} card-hover`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg} ${color} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

function DonutChart({ title, icon: Icon, completed, total, color, glow }) {
  const percent = total > 0 ? (completed / total) * 100 : 0
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * percent) / 100

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/5">
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${glow} blur-2xl`} />
      <h2 className="mb-6 flex items-center gap-2 text-sm font-black text-slate-300">
        <Icon className="h-4 w-4" style={{ color }} />
        {title} Progress
      </h2>
      <div className="flex flex-col items-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r={r}
              fill="transparent"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 8px ${color}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{Math.round(percent)}<span className="text-lg text-slate-400">%</span></span>
          </div>
        </div>
        <div className="mt-5 w-full space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-semibold text-slate-300">Completed</span>
            </div>
            <span className="text-xs font-black text-white">{completed}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
              <span className="text-xs font-semibold text-slate-300">Remaining</span>
            </div>
            <span className="text-xs font-black text-white">{total - completed}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function MilestoneCard({ stats }) {
  const milestones = [
    { label: 'First Lecture', done: stats.completedLectures >= 1, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'First Lab', done: stats.completedLabs >= 1, icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Half Way', done: stats.overallProgress >= 50, icon: Target, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'All Done!', done: stats.overallProgress >= 100, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ]

  return (
    <section className="rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/5">
      <h2 className="mb-6 flex items-center gap-2 text-sm font-black text-slate-300">
        <Award className="h-4 w-4 text-amber-400" />
        Milestones
      </h2>
      <div className="space-y-3">
        {milestones.map(({ label, done, icon: Icon, color, bg }) => (
          <div key={label} className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 transition ${done ? 'bg-slate-800/60 ring-1 ring-white/5' : 'bg-slate-800/20 opacity-50'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${done ? bg : 'bg-slate-800'} ${done ? color : 'text-slate-600'}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className={`text-sm font-bold ${done ? 'text-white' : 'text-slate-500'}`}>{label}</p>
            </div>
            {done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-slate-700" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
