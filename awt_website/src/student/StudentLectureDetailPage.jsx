import { CheckCircle2, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import LectureBlockRenderer from '../components/LectureBlockRenderer.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
import { fetchPublishedLectureBySlug } from '../lib/contentDetailsRepository.js'
import { ProgressBar } from './StudentOverviewPage.jsx'
import { getItemProgress } from './studentProgress.js'

export default function StudentLectureDetailPage() {
  const { slug } = useParams()
  const { lectures } = useStudentContent()
  const { markLectureRead, progressMessage, records, readIds } = useProgress()
  const [lecture, setLecture] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadLecture() {
      const remote = await fetchPublishedLectureBySlug(slug)
      if (!isMounted) return
      setLecture(remote)
      setIsLoading(false)
    }

    loadLecture()
    return () => {
      isMounted = false
    }
  }, [slug])

  const fallback = lectures.find((item) => item.slug === slug)
  const current = lecture || fallback
  const percent = current ? getItemProgress(records, 'lecture', current.id, readIds) : 0
  const isComplete = percent >= 100

  if (isLoading && !fallback) return <p className="text-slate-400">Loading lecture...</p>
  if (!current) return <Navigate to="/student/lectures" replace />

  if (!current) return <Navigate to="/student/lectures" replace />

  const blocks = Array.isArray(lecture?.content_blocks) ? lecture.content_blocks : []

  function extractTOC(blocks) {
    if (!blocks || !blocks.length) return []
    const items = []
    blocks.forEach((b) => {
      const content = b.content || {}
      if (b.type === 'heading') items.push(content.text)
      else if (b.type === 'code-block') items.push(content.language ? `${content.language} Code` : 'Code Example')
      else if (['note-box', 'info-box', 'warning-box', 'success-box', 'callout'].includes(b.type)) items.push(content.title || 'Note')
      else if (b.type === 'quiz') items.push('Quiz')
      else if (b.type === 'video') items.push('Video')
      else if (b.type === 'image') items.push('Image')
      else if (b.type === 'table') items.push('Table')
    })
    return items
  }

  const tocItems = extractTOC(blocks)

  async function markComplete() {
    await markLectureRead({ contentId: current.id, title: current.title, isRead: true })
  }

  function downloadPDF() {
    window.print()
  }

  return (
    <article className="mx-auto max-w-5xl print:max-w-none">
      {/* Header Section */}
      <header className="mb-8 mt-2 print:hidden">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Link to="/student/lectures" className="transition hover:text-white">Lectures</Link>
            <span>&gt;</span>
            <span className="text-white">{current.order_number ? `${current.order_number}. ` : ''}{current.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={downloadPDF} className="p-1.5 text-slate-400 transition hover:text-white" title="Download PDF">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title & Action Button */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl font-black tracking-normal text-white">{current.title}</h1>
          <button 
            type="button" 
            onClick={markComplete} 
            disabled={isComplete} 
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#22c55e] px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-[#16a34a] disabled:cursor-default disabled:opacity-80"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isComplete ? 'Completed' : 'Mark as Complete'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold text-slate-400">{percent}% Complete</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-[#22c55e] transition-all" style={{ width: `${percent}%` }} />
          </div>
          {progressMessage ? <p className="mt-2 text-xs font-semibold text-[#22c55e]">{progressMessage}</p> : null}
        </div>

        {/* Optional Description */}
        {lecture?.short_description || current.shortDescription ? (
           <p className="mt-5 text-sm leading-6 text-slate-400">{lecture?.short_description || current.shortDescription}</p>
        ) : null}
      </header>

      {/* Main Content Area */}
      <section className="grid gap-8 lg:grid-cols-[1fr_240px]">
        {/* Content Block */}
        <div className="rounded-xl border border-[#1b2b3c] bg-[#111c2b] p-6 shadow-2xl print:border-none print:bg-transparent print:p-0 print:shadow-none">
          {blocks.length ? (
            <LectureBlockRenderer blocks={blocks} />
          ) : (
            <div className="prose prose-invert max-w-none">
              <p>{lecture?.english_content || current.shortDescription || 'Lecture content will appear here.'}</p>
              {lecture?.code_examples ? <pre><code>{lecture.code_examples}</code></pre> : null}
              {lecture?.notes ? <p>{lecture.notes}</p> : null}
            </div>
          )}
        </div>

        {/* Right Sidebar (On This Page) */}
        <div className="hidden lg:block print:hidden">
          <div className="sticky top-24 rounded-xl border border-[#1b2b3c] bg-[#111c2b] p-5 shadow-2xl">
            <h3 className="mb-4 text-sm font-bold text-white">On This Page</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {tocItems.length > 0 ? (
                tocItems.map((item, index) => (
                  <li key={`${item}-${index}`} className={['cursor-pointer border-l-2 pl-3 transition', index === 0 ? 'border-[#22c55e] text-slate-200' : 'border-transparent hover:text-slate-200'].join(' ')}>
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500">No sections found.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </article>
  )
}
