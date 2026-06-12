import { BookOpen, Box, CalendarDays, Edit3, Eye, FileText, Plus, Search, Send, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LecturePreview from '../components/LecturePreview.jsx'
import { useAdminLectures } from '../hooks/useAdminData.js'
import { useToast } from '../hooks/useToast.js'
import { deleteLecture, fetchAdminLectures, fetchLectureForEdit, lectureToFormValues, setLecturePublished } from '../lib/adminRepository.js'
import { AdminCard } from './AdminShell.jsx'

export default function LectureList() {
  const { data: lectures, isLoading } = useAdminLectures()
  const [rows, setRows] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [previewLecture, setPreviewLecture] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [sortBy, setSortBy] = useState('latest')
  const { showToast } = useToast()
  const previewRequestRef = useRef(0)
  const visibleLectures = rows || lectures

  const stats = useMemo(() => {
    const total = visibleLectures.length
    const published = visibleLectures.filter((lecture) => lecture.status === 'Published').length
    const drafts = total - published
    const lastUpdated = 'Today'

    return { total, published, drafts, lastUpdated }
  }, [visibleLectures])

  const filteredLectures = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = visibleLectures.filter((lecture) => {
      const matchesSearch = !normalizedSearch || lecture.title.toLowerCase().includes(normalizedSearch) || lecture.slug?.toLowerCase().includes(normalizedSearch)
      const matchesStatus = statusFilter === 'All Status' || lecture.status === statusFilter
      const matchesCategory = categoryFilter === 'All Categories' || lecture.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return String(b.updatedAt).localeCompare(String(a.updatedAt))
    })
  }, [categoryFilter, search, sortBy, statusFilter, visibleLectures])

  const categories = useMemo(() => {
    return ['All Categories', ...new Set(visibleLectures.map((lecture) => lecture.category).filter(Boolean))]
  }, [visibleLectures])

  async function refreshRows() {
    setRows(await fetchAdminLectures())
  }

  async function togglePublished(lecture) {
    setBusyId(lecture.id)
    try {
      await setLecturePublished(lecture.id, lecture.status !== 'Published')
      await refreshRows()
      showToast('Lecture publish status updated.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  async function removeLecture() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    try {
      await deleteLecture(pendingDelete.id)
      await refreshRows()
      setPendingDelete(null)
      showToast('Lecture deleted successfully.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  async function openPreview(lecture) {
    const requestId = previewRequestRef.current + 1
    previewRequestRef.current = requestId
    setPreviewLoading(true)
    setPreviewLecture(null)
    try {
      const full = await fetchLectureForEdit(lecture.id)
      if (previewRequestRef.current !== requestId) return
      if (full && full.id !== lecture.id) return
      const values = full ? lectureToFormValues(full) : null
      setPreviewLecture(values && values.id === lecture.id ? values : lecture)
    } catch {
      if (previewRequestRef.current === requestId) setPreviewLecture(lecture)
    } finally {
      if (previewRequestRef.current === requestId) setPreviewLoading(false)
    }
  }

  return (
    <>
      <div className="mb-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <span>Content</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-white">Lectures</span>
        </div>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal text-white">Lectures</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
              Manage all lecture content, blocks, publish states, and student-facing documentation pages.
            </p>
          </div>
          <AddButton to="/admin/lectures/add" label="Add Lecture" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Box} label="Total Lectures" value={stats.total} caption="All time" color="purple" />
        <StatCard icon={Send} label="Published" value={stats.published} caption={`${stats.total ? Math.round((stats.published / stats.total) * 100) : 0}% of total`} color="emerald" />
        <StatCard icon={FileText} label="Drafts" value={stats.drafts} caption={`${stats.total ? Math.round((stats.drafts / stats.total) * 100) : 0}% of total`} color="amber" />
        <StatCard icon={CalendarDays} label="Last Updated" value={stats.lastUpdated} caption="Lecture records" color="blue" />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(180px,1fr)_150px_190px_210px_44px] gap-3">
        <label className="relative block min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search lectures..."
            className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-10 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
          />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 min-w-0 rounded-lg border border-slate-800 bg-slate-950/80 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-400">
          <option>All Status</option>
          <option>Published</option>
          <option>Draft</option>
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 min-w-0 rounded-lg border border-slate-800 bg-slate-950/80 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-400">
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 min-w-0 rounded-lg border border-slate-800 bg-slate-950/80 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-400">
          <option value="latest">Sort by: Latest Updated</option>
          <option value="title">Sort by: Title</option>
          <option value="status">Sort by: Status</option>
        </select>
        <button type="button" className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-cyan-400 hover:text-cyan-200" title="Filters">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <AdminCard className="mt-5 overflow-hidden p-0">
        <div className="overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-12 px-4 py-4">#</th>
                <th className="px-4 py-4">Lecture Title</th>
                <th className="w-28 px-4 py-4">Status</th>
                <th className="w-28 px-4 py-4">Updated</th>
                <th className="w-20 px-4 py-4">Blocks</th>
                <th className="w-44 px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="bg-slate-900/20">
                      <td className="px-4 py-4"><div className="h-4 w-5 animate-pulse rounded bg-slate-800" /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-800" />
                          <div className="space-y-2">
                            <div className="h-3.5 w-36 animate-pulse rounded bg-slate-800" />
                            <div className="h-2.5 w-24 animate-pulse rounded bg-slate-800/60" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><div className="h-5 w-16 animate-pulse rounded bg-slate-800" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 animate-pulse rounded bg-slate-800" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-6 animate-pulse rounded bg-slate-800" /></td>
                      <td className="px-4 py-4"><div className="flex justify-end gap-2">{[1,2,3,4].map(j=><div key={j} className="h-9 w-9 animate-pulse rounded-lg bg-slate-800"/>)}</div></td>
                    </tr>
                  ))
                : filteredLectures.map((lecture, index) => (
                <tr key={lecture.id} className="bg-slate-900/20 transition hover:bg-slate-900/60">
                  <td className="px-4 py-4 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/20">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="truncate font-bold text-white">{lecture.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{lecture.slug || 'lecture-page'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={lecture.status} /></td>
                  <td className="px-4 py-4 text-slate-400">{lecture.updatedAt}</td>
                  <td className="px-4 py-4 text-slate-300">{lecture.blocks ?? 0}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openPreview(lecture)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-blue-300 hover:border-blue-400 hover:bg-blue-400/10" title="Preview lecture">
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link to={`/admin/lectures/edit/${lecture.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:border-emerald-400 hover:bg-emerald-400/10" title="Edit lecture">
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === lecture.id}
                        onClick={() => togglePublished(lecture)}
                        className={[
                          'inline-flex h-9 w-12 items-center rounded-lg border px-1 transition disabled:opacity-50',
                          lecture.status === 'Published' ? 'border-emerald-400/30 bg-emerald-400/10 justify-end' : 'border-slate-800 bg-slate-950 justify-start'
                        ].join(' ')}
                        title={lecture.status === 'Published' ? 'Unpublish' : 'Publish'}
                      >
                        <span className={lecture.status === 'Published' ? 'h-5 w-5 rounded-full bg-emerald-400' : 'h-5 w-5 rounded-full bg-slate-500'} />
                      </button>
                      <button type="button" disabled={busyId === lecture.id} onClick={() => setPendingDelete(lecture)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:border-red-300 hover:bg-red-400/10 disabled:opacity-50" title="Delete lecture">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !filteredLectures.length ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">No lectures found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete lecture?"
        message={pendingDelete ? `This will permanently delete "${pendingDelete.title}". This action cannot be undone.` : ''}
        confirmLabel="Delete Lecture"
        isLoading={Boolean(busyId)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={removeLecture}
      />

      {/* ── Inline Preview Modal ── */}
      {(previewLecture || previewLoading) && (
        <LecturePreviewModal
          lecture={previewLecture}
          loading={previewLoading}
          onClose={() => { setPreviewLecture(null); setPreviewLoading(false) }}
        />
      )}
    </>
  )
}

// ─── Lecture Preview Modal ────────────────────────────────────────────────────

function LecturePreviewModal({ lecture, loading, onClose }) {
  const title = lecture?.title || 'Untitled Lecture'
  const blocks = lecture?.content_blocks || []

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-slate-950/85 px-4 py-8 backdrop-blur-sm"
      onMouseDown={handleBackdrop}
    >
      <div className="w-full max-w-5xl" onMouseDown={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-black text-cyan-300">
              STUDENT PREVIEW
            </span>
            <span className="text-sm font-bold text-white">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {lecture?.id && (
              <Link
                to={`/admin/lectures/edit/${lecture.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-300 hover:border-emerald-400"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Lecture
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:border-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          {(loading || !lecture) ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          ) : (
            <LecturePreview lecture={{ ...lecture, content_blocks: blocks }} />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, caption, color }) {
  const colors = {
    purple: 'bg-purple-500/15 text-purple-300 shadow-purple-500/10',
    emerald: 'bg-emerald-500/15 text-emerald-300 shadow-emerald-500/10',
    amber: 'bg-amber-500/15 text-amber-300 shadow-amber-500/10',
    blue: 'bg-blue-500/15 text-blue-300 shadow-blue-500/10'
  }

  return (
    <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/55 px-4 py-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-lg ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-black leading-tight text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
      </div>
    </section>
  )
}

export function AdminLoadingLabel({ label }) {
  return <p className="m-5 text-sm font-medium text-slate-400">{label}...</p>
}

export function AddButton({ to, label }) {
  return (
    <Link to={to} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-300">
      <Plus className="h-4 w-4" />
      {label}
    </Link>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={status === 'Published' ? 'rounded-md bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300' : 'rounded-md bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300'}>
      {status}
    </span>
  )
}
