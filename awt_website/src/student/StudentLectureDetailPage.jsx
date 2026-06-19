import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import LecturePreview from '../components/LecturePreview.jsx'
import { useLanguage } from '../hooks/useLanguage.js'
import { useProgress } from '../hooks/useProgress.js'
import { fetchPublishedLectureBySlug } from '../lib/contentDetailsRepository.js'
import { getItemProgress } from './studentProgress.js'

export default function StudentLectureDetailPage() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isPublic = !location.pathname.startsWith('/student')
  const { markLectureRead, progressMessage, records, readIds } = useProgress()
  const { isRomanUrdu } = useLanguage()
  const [lecture, setLecture] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let ignore = false

    // Immediately clear stale data and show loading
    setLecture(null)
    setIsLoading(true)
    setNotFound(false)

    async function loadLecture() {
      try {
        const remote = await fetchPublishedLectureBySlug(slug)
        if (ignore) return

        // Only accept data that exactly matches the current slug
        if (remote && remote.slug === slug) {
          setLecture(remote)
        } else {
          setNotFound(true)
        }
      } catch {
        if (!ignore) setNotFound(true)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadLecture()

    return () => {
      ignore = true
    }
  }, [slug])

  // Show skeleton while loading — never show stale/wrong content
  if (isLoading) return <LoadingDetail label="Loading lecture..." />

  // Redirect if not found
  if (notFound || !lecture) return <Navigate to="/student/lectures" replace />

  // Final guard: only render if slug matches
  if (lecture.slug !== slug) return <LoadingDetail label="Loading lecture..." />

  const blocks = Array.isArray(lecture.content_blocks) ? lecture.content_blocks : []
  const previewLecture = { ...lecture, content_blocks: blocks }
  const percent = getItemProgress(records, 'lecture', lecture.id, readIds)
  const isComplete = percent >= 100

  async function markComplete() {
    const titleFromBlocks = blocks.find((b) => b.type === 'heading')?.content?.text?.trim()
    await markLectureRead({
      contentId: lecture.id,
      title: titleFromBlocks || lecture.title,
      isRead: true
    })
  }

  function downloadPDF() {
    window.print()
  }

  return (
    <article className="mx-auto max-w-5xl print:max-w-none">
      {/* Back button */}
      {!isPublic && (
        <div className="mb-4 print:hidden">
          <button
            type="button"
            onClick={() => navigate('/student/lectures')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-emerald-400/50 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lectures
          </button>
        </div>
      )}
      <LecturePreview
        lecture={previewLecture}
        progress={isPublic ? undefined : percent}
        progressMessage={isPublic ? undefined : progressMessage}
        isComplete={isPublic ? false : isComplete}
        onComplete={isPublic ? undefined : markComplete}
        onDownload={isPublic ? undefined : downloadPDF}
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
