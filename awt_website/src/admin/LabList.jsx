import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Code2,
  Edit3,
  Eye,
  FileText,
  FlaskConical,
  Hammer,
  Lightbulb,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  TerminalSquare,
  Trash2,
  X
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LabPreview from '../components/LabPreview.jsx'
import { useAdminLabs } from '../hooks/useAdminData.js'
import { useToast } from '../hooks/useToast.js'
import { deleteLab, fetchAdminLabs, fetchLabForEdit, setLabPublished } from '../lib/adminRepository.js'
import { AdminCard } from './AdminShell.jsx'
import { AddButton, AdminLoadingLabel, StatusBadge } from './LectureList.jsx'

export default function LabList() {
  const { data: labs, isLoading } = useAdminLabs()
  const [rows, setRows] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [previewLab, setPreviewLab] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [sortBy, setSortBy] = useState('number')
  const { showToast } = useToast()
  const previewRequestRef = useRef(0)

  const visibleLabs = useMemo(() => rows || labs || [], [labs, rows])

  const stats = useMemo(() => {
    const total = visibleLabs.length
    const published = visibleLabs.filter((l) => l.status === 'Published').length
    const drafts = total - published
    return { total, published, drafts }
  }, [visibleLabs])

  const filteredLabs = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = visibleLabs.filter((lab) => {
      const matchSearch = !q || lab.title.toLowerCase().includes(q) || String(lab.number).includes(q)
      const matchStatus = statusFilter === 'All Status' || lab.status === statusFilter
      return matchSearch && matchStatus
    })
    return [...filtered].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return (a.number ?? 0) - (b.number ?? 0)
    })
  }, [search, sortBy, statusFilter, visibleLabs])

  async function refreshRows() {
    setRows(await fetchAdminLabs())
  }

  async function togglePublished(lab) {
    setBusyId(lab.id)
    try {
      await setLabPublished(lab.id, lab.status !== 'Published')
      await refreshRows()
      showToast('Lab publish status updated.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  async function removeLab() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    try {
      await deleteLab(pendingDelete.id)
      await refreshRows()
      setPendingDelete(null)
      showToast('Lab deleted successfully.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  async function openPreview(lab) {
    const requestId = previewRequestRef.current + 1
    previewRequestRef.current = requestId
    setPreviewLoading(true)
    setPreviewLab(null)
    try {
      const full = await fetchLabForEdit(lab.id)
      if (previewRequestRef.current !== requestId) return
      if (full && full.id !== lab.id) return
      const data = full || lab
      // Prefer the visual builder blocks so the list preview matches the edit page preview.
      const savedBlocks = Array.isArray(data.content_blocks) ? data.content_blocks : []
      const blocks = savedBlocks.length ? [...savedBlocks] : []
      // Convert older flat lab fields into blocks only when this lab has no saved builder blocks.
      if (!savedBlocks.length) {
      if (data.objective) blocks.push({ id: '1', type: 'objective', label: 'Objective', collapsed: false, settings: {}, content: { text: data.objective } })
      if (data.required_tools) {
        const items = Array.isArray(data.required_tools) ? data.required_tools : String(data.required_tools).split('\n').filter(Boolean)
        if (items.length) blocks.push({ id: '2', type: 'tools', label: 'Required Tools', collapsed: false, settings: {}, content: { items } })
      }
      if (data.steps) {
        const items = Array.isArray(data.steps) ? data.steps : String(data.steps).split('\n').filter(Boolean)
        if (items.length) blocks.push({ id: '3', type: 'steps', label: 'Instructions', collapsed: false, settings: {}, content: { items } })
      }
      if (data.code_examples) blocks.push({ id: '4', type: 'code', label: 'Code Example', collapsed: false, settings: {}, content: { language: 'HTML', code: data.code_examples } })
      if (data.output_preview) blocks.push({ id: '5', type: 'output', label: 'Output Preview', collapsed: false, settings: {}, content: { text: data.output_preview } })
      if (data.common_errors) {
        const raw = Array.isArray(data.common_errors) ? data.common_errors : String(data.common_errors).split('\n').filter(Boolean)
        const items = raw.map((e) => { const p = e.split(' — '); return { error: p[0] || e, cause: p[1] || '', solution: p[2] || '' } })
        if (items.length) blocks.push({ id: '6', type: 'errors', label: 'Common Errors', collapsed: false, settings: {}, content: { items } })
      }
      if (data.tips) {
        const items = Array.isArray(data.tips) ? data.tips : String(data.tips).split('\n').filter(Boolean)
        if (items.length) blocks.push({ id: '7', type: 'tips', label: 'Helpful Tips', collapsed: false, settings: {}, content: { items } })
      }
      }
      setPreviewLab({
        id: data.id || lab.id,
        meta: {
          title: data.title || lab.title || 'Untitled Lab',
          lab_number: data.lab_number ?? lab.number ?? 0,
          category: data.category || 'General',
          difficulty: data.difficulty || 'Beginner',
          estimated_time: data.estimated_time || '',
          short_description: data.short_description || '',
          settings: {}
        },
        blocks
      })
    } catch {
      if (previewRequestRef.current === requestId) setPreviewLab(null)
    } finally {
      if (previewRequestRef.current === requestId) setPreviewLoading(false)
    }
  }

  return (
    <>
      {/* ── Page Header ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FlaskConical className="h-4 w-4 text-slate-500" />
          <span>Practice</span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-white">Labs</span>
        </div>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal text-white">Labs</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
              Manage interactive lab objectives, steps, examples, previews, and completion content.
            </p>
          </div>
          <AddButton to="/admin/labs/add" label="Add Lab" />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FlaskConical} label="Total Labs"   value={stats.total}     caption="All time"   color="cyan"   />
        <StatCard icon={Send}         label="Published"    value={stats.published} caption={`${stats.total ? Math.round((stats.published/stats.total)*100) : 0}% of total`} color="emerald" />
        <StatCard icon={FileText}     label="Drafts"       value={stats.drafts}    caption={`${stats.total ? Math.round((stats.drafts/stats.total)*100) : 0}% of total`}    color="amber"  />
        <StatCard icon={CalendarDays} label="Last Updated" value="Today"           caption="Lab records" color="blue"  />
      </div>

      {/* ── Filters ── */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(180px,1fr)_150px_210px_44px]">
        <label className="relative block min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search labs..."
            className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-10 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
          />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 min-w-0 rounded-lg border border-slate-800 bg-slate-950/80 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-400">
          <option>All Status</option>
          <option>Published</option>
          <option>Draft</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-11 min-w-0 rounded-lg border border-slate-800 bg-slate-950/80 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-400">
          <option value="number">Sort by: Lab Number</option>
          <option value="title">Sort by: Title</option>
          <option value="status">Sort by: Status</option>
        </select>
        <button type="button" className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-cyan-400 hover:text-cyan-200">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ── Table ── */}
      <AdminCard className="mt-5 overflow-hidden p-0">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-14 px-5 py-4">#</th>
                <th className="px-5 py-4">Lab Title</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Blocks</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="bg-slate-900/20">
                      <td className="px-5 py-4"><div className="h-4 w-5 animate-pulse rounded bg-slate-800" /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-800" />
                          <div className="space-y-2">
                            <div className="h-3.5 w-36 animate-pulse rounded bg-slate-800" />
                            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-800/60" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded bg-slate-800" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-6 animate-pulse rounded bg-slate-800" /></td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2">{[1,2,3,4].map(j=><div key={j} className="h-9 w-9 animate-pulse rounded-lg bg-slate-800"/>)}</div></td>
                    </tr>
                  ))
                : filteredLabs.map((lab, index) => (
                <tr key={lab.id} className="bg-slate-900/20 transition hover:bg-slate-900/60">
                  <td className="px-5 py-4 text-slate-400">{index + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                        <FlaskConical className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-bold text-white">{lab.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Lab {lab.number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={lab.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      {lab.blocks ?? lab.steps ?? 0}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {/* Preview — inline modal */}
                      <button
                        type="button"
                        onClick={() => openPreview(lab)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-blue-300 hover:border-blue-400 hover:bg-blue-400/10"
                        title="Preview lab"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {/* Edit */}
                      <Link
                        to={`/admin/labs/edit/${lab.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:border-emerald-400 hover:bg-emerald-400/10"
                        title="Edit lab"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      {/* Publish toggle */}
                      <button
                        type="button"
                        disabled={busyId === lab.id}
                        onClick={() => togglePublished(lab)}
                        className={[
                          'inline-flex h-9 w-12 items-center rounded-lg border px-1 transition disabled:opacity-50',
                          lab.status === 'Published'
                            ? 'border-emerald-400/30 bg-emerald-400/10 justify-end'
                            : 'border-slate-800 bg-slate-950 justify-start'
                        ].join(' ')}
                        title={lab.status === 'Published' ? 'Unpublish' : 'Publish'}
                      >
                        <span className={lab.status === 'Published' ? 'h-5 w-5 rounded-full bg-emerald-400' : 'h-5 w-5 rounded-full bg-slate-500'} />
                      </button>
                      {/* Delete */}
                      <button
                        type="button"
                        disabled={busyId === lab.id}
                        onClick={() => setPendingDelete(lab)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:border-red-300 hover:bg-red-400/10 disabled:opacity-50"
                        title="Delete lab"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredLabs.length && !isLoading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-500">No labs found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 lg:hidden">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
                  <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-800/70" />
                </div>
              ))
            : filteredLabs.map((lab) => (
                <article key={lab.id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
                      <FlaskConical className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{lab.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Lab {lab.number}</p>
                    </div>
                    <StatusBadge status={lab.status} />
                  </div>
                  <div className="mt-3 text-xs text-slate-400">Blocks: {lab.blocks ?? lab.steps ?? 0}</div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => openPreview(lab)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-blue-300 hover:border-blue-400 hover:bg-blue-400/10" title="Preview lab">
                      <Eye className="h-4 w-4" />
                    </button>
                    <Link to={`/admin/labs/edit/${lab.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:border-emerald-400 hover:bg-emerald-400/10" title="Edit lab">
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button type="button" disabled={busyId === lab.id} onClick={() => togglePublished(lab)} className="inline-flex h-9 w-12 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-xs font-bold text-slate-300 disabled:opacity-50">
                      {lab.status === 'Published' ? 'On' : 'Off'}
                    </button>
                    <button type="button" disabled={busyId === lab.id} onClick={() => setPendingDelete(lab)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:border-red-300 hover:bg-red-400/10 disabled:opacity-50" title="Delete lab">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
          {!filteredLabs.length && !isLoading ? (
            <p className="px-2 py-8 text-center text-sm text-slate-500">No labs found.</p>
          ) : null}
        </div>
      </AdminCard>

      {/* ── Inline Preview Modal ── */}
      {(previewLab || previewLoading) && (
        <LabPreviewModal
          lab={previewLab}
          loading={previewLoading}
          onClose={() => { setPreviewLab(null); setPreviewLoading(false) }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete lab?"
        message={pendingDelete ? `This will permanently delete "${pendingDelete.title}". This action cannot be undone.` : ''}
        confirmLabel="Delete Lab"
        isLoading={Boolean(busyId)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={removeLab}
      />
    </>
  )
}

// ─── Inline Preview Modal ─────────────────────────────────────────────────────

function LabPreviewModal({ lab, loading, onClose }) {
  if (loading || !lab) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <LabPreview
      lab={lab}
      onClose={onClose}
      footer={(
        <div className="flex justify-end">
          {lab?.id ? (
            <Link
              to={`/admin/labs/edit/${lab.id}`}
              className="mr-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:border-emerald-400"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Lab
            </Link>
          ) : null}
          <button type="button" disabled className="inline-flex cursor-default items-center gap-2 rounded-lg bg-emerald-500/20 px-5 py-2.5 text-sm font-bold text-emerald-300 opacity-60">
            Mark as Complete
          </button>
        </div>
      )}
    />
  )
}
// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, caption, color }) {
  const colors = {
    cyan:    'bg-cyan-500/15    text-cyan-300    shadow-cyan-500/10',
    emerald: 'bg-emerald-500/15 text-emerald-300 shadow-emerald-500/10',
    amber:   'bg-amber-500/15   text-amber-300   shadow-amber-500/10',
    blue:    'bg-blue-500/15    text-blue-300    shadow-blue-500/10'
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
