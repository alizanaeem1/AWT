import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAdminLabs } from '../hooks/useAdminData.js'
import { useToast } from '../hooks/useToast.js'
import { deleteLab, fetchAdminLabs, setLabPublished } from '../lib/adminRepository.js'
import { AdminCard, AdminPageHeader } from './AdminShell.jsx'
import { AddButton, AdminLoadingLabel, StatusBadge } from './LectureList.jsx'

export default function LabList() {
  const { data: labs, isLoading } = useAdminLabs()
  const [rows, setRows] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const { showToast } = useToast()
  const visibleLabs = rows || labs || []

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

  return (
    <>
      <AdminPageHeader
        eyebrow="Practice"
        title="Labs"
        description="Manage interactive lab objectives, steps, examples, previews, and completion content."
        action={<AddButton to="/admin/labs/add" label="Add Lab" />}
      />
      {isLoading ? <AdminLoadingLabel label="Loading labs" /> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {visibleLabs.map((lab) => (
          <AdminCard key={lab.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Lab {lab.number}</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{lab.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{lab.steps} steps configured</p>
              </div>
              <StatusBadge status={lab.status} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" disabled={busyId === lab.id} onClick={() => togglePublished(lab)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400 disabled:opacity-50">
                {lab.status === 'Published' ? 'Unpublish' : 'Publish'}
              </button>
              <Link to={`/admin/labs/edit/${lab.id}`} className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400">
                Edit Lab
              </Link>
              <button type="button" disabled={busyId === lab.id} onClick={() => setPendingDelete(lab)} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-200 hover:border-red-300 disabled:opacity-50">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </AdminCard>
        ))}
      </div>
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
