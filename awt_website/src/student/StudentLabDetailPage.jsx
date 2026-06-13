import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useParams, useLocation } from 'react-router-dom'
import LabPreview, { LabPreviewCompleteButton } from '../components/LabPreview.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { fetchPublishedLabBySlug } from '../lib/contentDetailsRepository.js'
import { getItemProgress } from './studentProgress.js'

export default function StudentLabDetailPage() {
  const { slug } = useParams()
  const location = useLocation()
  const isPublic = !location.pathname.startsWith('/student')
  const { progressMessage, records, readIds, saveLabSteps } = useProgress()
  const [lab, setLab] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let ignore = false

    // Immediately clear stale data and show loading
    setLab(null)
    setIsLoading(true)
    setNotFound(false)

    async function loadLab() {
      try {
        const remote = await fetchPublishedLabBySlug(slug)
        if (ignore) return

        // Only accept data that exactly matches the current slug
        if (remote && remote.slug === slug) {
          setLab(remote)
        } else {
          setNotFound(true)
        }
      } catch {
        if (!ignore) setNotFound(true)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadLab()

    return () => {
      ignore = true
    }
  }, [slug])

  // Show skeleton while loading — never show stale/wrong content
  if (isLoading) return <LoadingDetail label="Loading lab..." />

  // Redirect if not found
  if (notFound || !lab) return <Navigate to="/student/labs" replace />

  // Final guard: only render if slug matches
  if (lab.slug !== slug) return <LoadingDetail label="Loading lab..." />

  const current = mapLab(lab)
  if (!current) return <Navigate to="/student/labs" replace />

  const percent = getItemProgress(records, 'lab', current.id, readIds)

  async function markComplete() {
    await saveLabSteps({
      contentId: current.id,
      title: current.title,
      checkedSteps: current.steps.map((_, index) => `${current.id}-step-${index}`),
      totalSteps: current.steps.length
    })
  }

  function downloadPDF() {
    window.print()
  }

  return (
    <article className="mx-auto max-w-5xl print:max-w-none">
      <LabPreview
        lab={current}
        headerAside={isPublic ? null : (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/35 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Student Tools</span>
              <button
                type="button"
                onClick={downloadPDF}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Lab Progress</span>
                  <span>{percent}% Complete</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-[#22c55e] transition-all" style={{ width: `${percent}%` }} />
                </div>
                {progressMessage ? <p className="mt-2 text-xs font-semibold text-[#22c55e]">{progressMessage}</p> : null}
              </div>
              <LabPreviewCompleteButton isComplete={percent >= 100} onClick={markComplete} />
            </div>
          </div>
        )}
      />
    </article>
  )
}

function LoadingDetail({ label }) {
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
      <div className="mb-5 h-5 w-36 animate-pulse rounded bg-slate-800" />
      <div className="mb-8 h-10 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-800" />
        <div className="h-32 w-full animate-pulse rounded-xl bg-slate-800/80" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  )
}

function mapLab(lab) {
  if (!lab) return null
  const labNumber = lab.lab_number ?? lab.labNumber ?? lab.order ?? 0
  const contentBlocks = lab.content_blocks || lab.blocks || []
  const blockSteps = Array.isArray(contentBlocks)
    ? contentBlocks.flatMap((block) => {
        if (block.type === 'steps') return block.content?.items || []
        if (block.type === 'solved-activity') return block.content?.instructions || []
        if (block.type === 'graded-task') return block.content?.requirements || []
        return []
      })
    : []
  const steps = blockSteps.length
    ? blockSteps
    : Array.isArray(lab.steps) && lab.steps.length
    ? lab.steps
    : ['Complete this lab.']
  return {
    id: lab.id,
    title: labNumber === 8 ? 'Mid Term' : labNumber === 15 ? 'Final Term' : lab.title,
    labNumber,
    category: lab.category || 'General',
    level: lab.level || lab.difficulty || 'Beginner',
    duration: lab.duration || lab.estimated_time || '',
    status: lab.status || (lab.is_published ? 'Published' : 'Draft'),
    content_blocks: contentBlocks,
    blocks: contentBlocks,
    objective: lab.objective || 'Complete the lab objective and submit your finished practice work.',
    tools: Array.isArray(lab.required_tools) ? lab.required_tools : ['VS Code', 'Browser', 'Node.js'],
    steps,
    code: lab.code_examples || '<!-- Lab code example will appear here -->',
    output: lab.output_preview || 'Expected output preview will appear here.',
    errors: Array.isArray(lab.common_errors) ? lab.common_errors : ['Check file paths and console errors.'],
    tips: Array.isArray(lab.tips) ? lab.tips : ['Complete one step at a time.']
  }
}
