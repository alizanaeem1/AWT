import { CheckCircle2, Download } from 'lucide-react'
import LectureBlockRenderer from './LectureBlockRenderer.jsx'

function getBlocks(lecture) {
  if (Array.isArray(lecture?.content_blocks)) return lecture.content_blocks
  if (Array.isArray(lecture?.blocks)) return lecture.blocks
  return []
}

function getPreviewLecture(lecture) {
  const blocks = getBlocks(lecture)
  const titleFromBlocks = blocks.find((block) => block.type === 'heading')?.content?.text?.trim()
  const contentBlocks = titleFromBlocks
    ? blocks.filter((block, index) => !(index === 0 && block.type === 'heading'))
    : blocks

  return {
    id: lecture?.id,
    lectureNumber: lecture?.lectureNumber ?? lecture?.lecture_number ?? lecture?.order_number ?? lecture?.order ?? '',
    title: titleFromBlocks || lecture?.title || 'Untitled Lecture',
    description: lecture?.description || lecture?.short_description || lecture?.shortDescription || '',
    category: lecture?.category || lecture?.group || 'General',
    level: lecture?.level || lecture?.difficulty || '',
    duration: lecture?.duration || lecture?.estimated_time || '',
    tags: lecture?.tags || [],
    status: lecture?.status || (lecture?.is_published ? 'Published' : 'Draft'),
    blocks,
    contentBlocks
  }
}

export default function LecturePreview({
  lecture,
  progress,
  progressMessage,
  isComplete = false,
  onComplete,
  onDownload,
  className = ''
}) {
  const preview = getPreviewLecture(lecture)
  const hasTools = progress !== undefined || onComplete || onDownload

  return (
    <article className={`rounded-2xl border border-[#223346] bg-[#111c2b] p-8 text-slate-100 shadow-2xl shadow-black/30 print:border-none print:bg-transparent print:p-0 print:shadow-none ${className}`}>
      <header className="mb-8 border-b border-[#223346] pb-6 print:hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Lecture {preview.lectureNumber}
              {preview.category ? ` · ${preview.category}` : ''}
              {preview.level ? ` · ${preview.level}` : ''}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">{preview.title}</h1>
            {preview.description ? <p className="mt-2 text-sm leading-6 text-slate-400">{preview.description}</p> : null}
            {preview.duration ? (
              <p className="mt-3 inline-flex rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs font-bold text-slate-300">
                {preview.duration} min read
              </p>
            ) : null}
            {preview.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300">{tag}</span>
                ))}
              </div>
            ) : null}
          </div>

          {hasTools ? (
            <div className="w-full shrink-0 rounded-2xl border border-slate-700/60 bg-slate-950/35 p-4 lg:w-[420px]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Student Tools</span>
                {onDownload ? (
                  <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300" title="Download PDF">
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                {progress !== undefined ? (
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>Lecture Progress</span>
                      <span>{progress}% Complete</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-[#22c55e] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    {progressMessage ? <p className="mt-2 text-xs font-semibold text-[#22c55e]">{progressMessage}</p> : null}
                  </div>
                ) : null}
                {onComplete ? (
                  <button
                    type="button"
                    onClick={onComplete}
                    disabled={isComplete}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-5 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-default disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isComplete ? 'Completed' : 'Mark as Complete'}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {preview.contentBlocks.length ? (
        <LectureBlockRenderer blocks={preview.contentBlocks} />
      ) : (
        <div className="prose prose-invert max-w-none">
          <p>{lecture?.english_content || preview.description || 'Lecture content will appear here.'}</p>
          {lecture?.code_examples ? <pre><code>{lecture.code_examples}</code></pre> : null}
          {lecture?.notes ? <p>{lecture.notes}</p> : null}
        </div>
      )}
    </article>
  )
}
