import { ArrowRight, BookOpen, BriefcaseBusiness, CheckCircle2, ClipboardList, Code2, FileCheck2, FlaskConical, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useProgress } from '../hooks/useProgress.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
import { calculateStudentStats } from './studentProgress.js'

export default function StudentOverviewPage() {
  const { profile } = useAuth()
  const { lectures, labs, isLoading } = useStudentContent()
  const { records, readIds, isProgressLoading } = useProgress()
  const stats = calculateStudentStats({ lectures, labs, records, readIds })
  const nextLecture = lectures.find((lecture) => !readIds.has(lecture.id)) || lectures[0]
  const upcomingLabs = labs.filter((lab) => !readIds.has(lab.id)).slice(0, 3)
  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  const circumference = 2 * Math.PI * 36
  const dashOffset = circumference - (circumference * stats.overallProgress) / 100

  return (
    <div className="mx-auto max-w-6xl space-y-6 stagger-children">

      {/* Hero Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1f35] to-slate-900 p-8 shadow-2xl ring-1 ring-white/5">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-32 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-blue-500/5 blur-2xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-400/20">
              <Sparkles className="h-3 w-3" />
              Learning Dashboard
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="mt-2 text-slate-400">Keep pushing forward — every lesson counts.</p>
          </div>

          {/* Progress Ring */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="36" fill="transparent"
                  stroke="url(#progressGradient)" strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={isProgressLoading ? circumference : dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{stats.overallProgress}%</span>
                <span className="text-[10px] font-semibold text-slate-400">Overall</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              {stats.overallProgress >= 50 ? 'Great progress!' : 'Keep going!'}
            </div>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 stagger-children">
        <StatCard icon={BookOpen} label="Total Lectures" value={isLoading ? '…' : stats.totalLectures} from="from-blue-500" to="to-indigo-600" iconBg="bg-blue-500/15 text-blue-300" />
        <StatCard icon={ClipboardList} label="Total Labs" value={isLoading ? '…' : stats.totalLabs} from="from-purple-500" to="to-violet-600" iconBg="bg-purple-500/15 text-purple-300" />
        <StatCard icon={CheckCircle2} label="Completed Lectures" value={isProgressLoading ? '…' : stats.completedLectures} from="from-emerald-500" to="to-teal-600" iconBg="bg-emerald-500/15 text-emerald-300" />
        <StatCard icon={BriefcaseBusiness} label="Completed Labs" value={isProgressLoading ? '…' : stats.completedLabs} from="from-amber-500" to="to-orange-600" iconBg="bg-amber-500/15 text-amber-300" />
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Continue Learning */}
        <section className="group relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/5 transition hover:ring-emerald-400/20">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition group-hover:bg-emerald-500/10" />
          <h2 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
            <Code2 className="h-4 w-4 text-emerald-400" />
            Continue Learning
          </h2>
          {nextLecture ? (
            <div className="mb-5 flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-300 ring-1 ring-emerald-500/20">
                <BookOpen className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-white text-lg leading-tight">{nextLecture.title}</p>
                <p className="mt-1 text-xs text-slate-400">Next lecture ready for you</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${stats.overallProgress}%`, transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-5 text-sm text-slate-400">No lecture available yet.</p>
          )}
          <Link
            to={nextLecture ? `/student/lectures/${nextLecture.slug}` : '/student/lectures'}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:from-emerald-300 hover:to-cyan-300 hover:shadow-emerald-400/30"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Recent Completed */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/5">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Recently Completed
          </h2>
          <div className="space-y-3">
            {stats.recentCompleted.length ? stats.recentCompleted.slice(0, 4).map((record, i) => (
              <div key={record.id} className="flex items-center gap-4 rounded-2xl bg-slate-800/40 px-4 py-3 transition hover:bg-slate-800/60" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-100">{record.metadata?.title || record.content_id}</p>
                  <p className="mt-0.5 text-[11px] font-medium capitalize text-slate-500">{record.content_type}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Done
                </span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-400">Nothing completed yet</p>
                <p className="mt-1 text-xs text-slate-600">Start a lecture to see your progress here.</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Labs */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900/60 p-6 ring-1 ring-white/5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
              <FlaskConical className="h-4 w-4 text-purple-400" />
              Upcoming Labs
            </h2>
            <Link to="/student/labs" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition">
              View all →
            </Link>
          </div>
          {upcomingLabs.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {upcomingLabs.map((lab, i) => (
                <Link
                  key={lab.id}
                  to={`/student/labs/${lab.slug}`}
                  className="group/lab flex items-center gap-4 rounded-2xl bg-slate-800/40 px-4 py-4 transition hover:bg-purple-500/10 hover:ring-1 hover:ring-purple-500/20"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300 transition group-hover/lab:bg-purple-500/25">
                    <FlaskConical className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{lab.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Lab {lab.labNumber || lab.order || i + 1}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <FlaskConical className="h-7 w-7" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-300">All labs completed!</p>
              <p className="mt-1 text-xs text-slate-500">Great job — you've finished all available labs.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, from, to, iconBg }) {
  return (
    <div className={`group relative overflow-hidden rounded-3xl bg-slate-900/60 p-5 ring-1 ring-white/5 transition hover:ring-white/10 card-hover`}>
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${from} ${to} opacity-5 blur-2xl transition group-hover:opacity-10`} />
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} transition group-hover:scale-110`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1.5 text-3xl font-black tracking-tight text-white">{value}</p>
    </div>
  )
}

export function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-bold uppercase text-cyan-300">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-normal text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}

export function StatCard2({ icon: Icon, label, value, tone = 'blue' }) {
  const styles = {
    blue: 'bg-blue-500/15 text-blue-300',
    purple: 'bg-purple-500/15 text-purple-300',
    emerald: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300'
  }
  return (
    <section className="min-w-0 rounded-xl border border-[#1d2d3f] bg-[#121d2b] p-4 shadow-lg shadow-black/10">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${styles[tone]}`}>
          {tone === 'emerald' ? <FileCheck2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
        </div>
      </div>
    </section>
  )
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}
