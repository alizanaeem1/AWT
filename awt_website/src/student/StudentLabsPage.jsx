import { Download, FlaskConical, Search, X, CheckCircle2, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
import { StatusBadge } from './StudentLecturesPage.jsx'
import { getItemProgress, getItemStatus } from './studentProgress.js'

export default function StudentLabsPage() {
  const { labs, isLoading } = useStudentContent()
  const { records, readIds } = useProgress()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')

  const categories = useMemo(() => ['All Categories', ...new Set(labs.map((lab) => lab.group || 'Labs'))], [labs])
  const filteredLabs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return labs.filter((lab) => {
      const labCategory = lab.group || 'Labs'
      return (!q || lab.title.toLowerCase().includes(q)) && (category === 'All Categories' || labCategory === category)
    })
  }, [category, labs, search])

  const completed = labs.filter(l => getItemStatus(getItemProgress(records, 'lab', l.id, readIds)) === 'Completed').length

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">All Labs</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            <span className="font-bold text-purple-400">{completed}</span> of <span className="font-bold text-white">{labs.length}</span> labs completed
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-800/60 px-4 py-2.5 text-sm font-bold text-slate-300 ring-1 ring-slate-700/60 transition hover:bg-slate-700 hover:text-white print:hidden"
        >
          <Download className="h-4 w-4" />
          Download All
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex w-full items-center gap-3">
        <div className="relative flex h-12 min-w-0 flex-1 items-center rounded-2xl border border-slate-700/60 bg-slate-900/60 transition focus-within:border-purple-400/60 focus-within:ring-2 focus-within:ring-purple-400/10">
          <Search className="absolute left-4 h-4 w-4 text-slate-500" />
          <input
            type="search" autoComplete="off" spellCheck="false"
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search labs..."
            className="h-full w-full bg-transparent pl-11 pr-10 text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 rounded-full p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={category} onChange={(e) => setCategory(e.target.value)}
          className="h-12 w-[220px] shrink-0 rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 text-sm font-bold text-slate-200 outline-none transition focus:border-purple-400/60"
        >
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-800/40" />
          ))}
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800/60 bg-slate-900/40 py-20 text-center">
          <FlaskConical className="h-12 w-12 text-slate-600" />
          <p className="mt-4 text-base font-bold text-slate-400">No labs found</p>
          <p className="mt-1 text-sm text-slate-600">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLabs.map((lab, index) => {
            const percent = getItemProgress(records, 'lab', lab.id, readIds)
            const status = getItemStatus(percent)
            return <LabCard key={lab.id} lab={lab} percent={percent} status={status} index={index} />
          })}
        </div>
      )}
    </div>
  )
}

function LabCard({ lab, percent, status, index }) {
  const isCompleted = status === 'Completed'
  const isInProgress = status === 'In Progress'

  return (
    <Link
      to={`/student/labs/${lab.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-slate-900/60 p-5 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/80 hover:ring-purple-400/20 hover:shadow-2xl hover:shadow-purple-400/5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Glow */}
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${isCompleted ? 'bg-emerald-400/10 opacity-50' : isInProgress ? 'bg-amber-400/10 opacity-30' : 'bg-purple-400/5 opacity-0'}`} />

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/20 transition group-hover:bg-purple-500/25">
          <FlaskConical className="h-5 w-5" />
        </span>
        <LabStatusPill status={status} />
      </div>

      {/* Title */}
      <div className="mt-4 flex-1">
        <p className="font-black text-white leading-snug line-clamp-2">{lab.title}</p>
        {lab.objective && (
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{lab.objective}</p>
        )}
      </div>

      {/* Lab number badge */}
      {(lab.lab_number || lab.labNumber) && (
        <div className="mt-3">
          <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] font-black text-slate-400">
            Lab #{lab.lab_number || lab.labNumber}
          </span>
        </div>
      )}

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">Progress</span>
          <span className={isCompleted ? 'text-emerald-400' : isInProgress ? 'text-amber-400' : 'text-slate-500'}>{percent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : isInProgress ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-slate-700'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Open arrow */}
      <div className="mt-4 flex items-center justify-end">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/60 text-slate-400 transition group-hover:bg-purple-400/15 group-hover:text-purple-400">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

function LabStatusPill({ status }) {
  if (status === 'Completed') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-black text-emerald-400 ring-1 ring-emerald-400/20">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </span>
  )
  if (status === 'In Progress') return (
    <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-black text-amber-400 ring-1 ring-amber-400/20">
      In Progress
    </span>
  )
  return (
    <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[11px] font-black text-slate-400">
      Not Started
    </span>
  )
}
