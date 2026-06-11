import { CalendarClock, ClipboardList, ListChecks, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAdminActivities } from '../hooks/useAdminData.js'
import { useToast } from '../hooks/useToast.js'
import {
  deleteActivity,
  fetchAdminActivities,
  saveActivity,
  setActivityPublished
} from '../lib/adminRepository.js'
import { slugify } from '../lib/slugify.js'
import { AdminCard, AdminPageHeader, Field, TextArea, TextInput, Toggle } from './AdminShell.jsx'
import { AdminLoadingLabel, StatusBadge } from './LectureList.jsx'

const activityTypes = [
  { title: 'Assignment', icon: ClipboardList },
  { title: 'Quiz', icon: ListChecks },
  { title: 'Deadline', icon: CalendarClock }
]

const emptyActivity = {
  id: '',
  title: '',
  slug: '',
  type: 'Assignment',
  description: '',
  deadline: '',
  is_published: false
}

export default function ActivitiesPage() {
  const { data: activities, isLoading } = useAdminActivities()
  const [rows, setRows] = useState(null)
  const [formValues, setFormValues] = useState(emptyActivity)
  const [busyId, setBusyId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const { showToast } = useToast()
  const visibleActivities = rows || activities

  async function refreshRows() {
    setRows(await fetchAdminActivities())
  }

  function updateField(field, value) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
      slug: field === 'title' && !current.slug ? slugify(value) : current.slug
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveActivity(formValues)
      await refreshRows()
      setFormValues(emptyActivity)
      showToast(formValues.id ? 'Activity updated successfully.' : 'Activity created successfully.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function togglePublished(activity) {
    setBusyId(activity.id)
    try {
      await setActivityPublished(activity.id, activity.status !== 'Published')
      await refreshRows()
      showToast('Activity publish status updated.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  async function removeActivity() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    try {
      await deleteActivity(pendingDelete.id)
      await refreshRows()
      setPendingDelete(null)
      showToast('Activity deleted successfully.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  function editActivity(activity) {
    setFormValues({
      id: activity.id,
      title: activity.title,
      slug: activity.slug || slugify(activity.title),
      type: activity.type,
      description: activity.description || '',
      deadline: activity.deadline === 'No deadline' ? '' : activity.deadline,
      is_published: activity.status === 'Published'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <AdminPageHeader eyebrow="Activities" title="Assignments and Quizzes" description="Create classroom activities, quiz items, deadlines, and publish states." />
      <AdminCard>
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
          <Field label="Activity title"><TextInput value={formValues.title} onChange={(event) => updateField('title', event.target.value)} placeholder="HTML Practice Assignment" required /></Field>
          <Field label="Slug"><TextInput value={formValues.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="html-practice-assignment" /></Field>
          <Field label="Type">
            <select value={formValues.type} onChange={(event) => updateField('type', event.target.value)} className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400">
              {activityTypes.map((item) => <option key={item.title}>{item.title}</option>)}
            </select>
          </Field>
          <Field label="Deadline"><TextInput value={formValues.deadline} onChange={(event) => updateField('deadline', event.target.value)} type="date" /></Field>
          <Field label="Description"><TextArea value={formValues.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Short instructions for students." /></Field>
          <div className="flex flex-col justify-end gap-4">
            <Toggle label="Published" checked={formValues.is_published} onChange={(event) => updateField('is_published', event.target.checked)} />
            <button type="submit" disabled={isSaving} className="h-11 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? 'Saving...' : formValues.id ? 'Save Activity' : 'Add Activity'}
            </button>
          </div>
        </form>
      </AdminCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {activityTypes.map((item) => (
          <AdminCard key={item.title}>
            <item.icon className="h-5 w-5 text-emerald-300" />
            <h2 className="mt-4 text-lg font-semibold text-white">Add {item.title.toLowerCase()}</h2>
            <button type="button" onClick={() => updateField('type', item.title)} className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400">
              Use this type
            </button>
          </AdminCard>
        ))}
      </div>

      <AdminCard className="mt-6">
        <h2 className="text-lg font-semibold text-white">Recent Activities</h2>
        {isLoading ? <AdminLoadingLabel label="Loading activities" /> : null}
        <div className="mt-4 space-y-3">
          {visibleActivities.map((activity) => (
            <div key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950 px-4 py-3">
              <div>
                <p className="font-medium text-white">{activity.title}</p>
                <p className="text-sm text-slate-500">{activity.type} | {activity.deadline}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={activity.status} />
                <button type="button" disabled={busyId === activity.id} onClick={() => togglePublished(activity)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400 disabled:opacity-50">
                  {activity.status === 'Published' ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" onClick={() => editActivity(activity)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400">
                  Edit
                </button>
                <button type="button" disabled={busyId === activity.id} onClick={() => setPendingDelete(activity)} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:border-red-300 disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete activity?"
        message={pendingDelete ? `This will permanently delete "${pendingDelete.title}". This action cannot be undone.` : ''}
        confirmLabel="Delete Activity"
        isLoading={Boolean(busyId)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={removeActivity}
      />
    </>
  )
}
