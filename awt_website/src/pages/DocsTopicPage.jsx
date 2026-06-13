import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import LectureBlockRenderer from '../components/LectureBlockRenderer.jsx'
import { docsHeadings, findDocItem } from '../data/docsNavigation.js'
import { useContentProgress } from '../hooks/useContentProgress.js'
import { useProgress } from '../hooks/useProgress.js'
import { fetchPublishedLectureBySlug } from '../lib/contentDetailsRepository.js'

export default function DocsTopicPage() {
  const { slug } = useParams()
  const topic = findDocItem(slug)
  const [lecture, setLecture] = useState(null)
  const [isLoading, setIsLoading] = useState(!topic)

  useEffect(() => {
    let isMounted = true

    async function loadLecture() {
      if (topic) {
        setIsLoading(false)
        return
      }

      const nextLecture = await fetchPublishedLectureBySlug(slug)
      if (isMounted) {
        setLecture(nextLecture)
        setIsLoading(false)
      }
    }

    loadLecture()

    return () => {
      isMounted = false
    }
  }, [slug, topic])

  if (isLoading) {
    return <article className="mx-auto w-full max-w-3xl px-5 py-10 text-slate-300 sm:px-8 lg:py-14">Loading topic...</article>
  }

  if (!topic && !lecture) return <Navigate to="/" replace />

  if (lecture) return <SupabaseLecturePage lecture={lecture} />

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <p className="mb-3 text-sm font-semibold text-cyan-300">AWT Docs</p>
      <h1 className="text-4xl font-bold tracking-normal text-white">{topic.title}</h1>
      <p className="mt-5 text-lg leading-8 text-slate-300">
        This topic introduces {topic.title.toLowerCase()} through concise notes, examples, and practice prompts designed for the AWT learning path.
      </p>

      {docsHeadings.map((heading) => (
        <section key={heading.id} id={heading.id} className="scroll-mt-24 border-t border-slate-800 py-8">
          <h2 className="text-2xl font-semibold text-white">{heading.title}</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Use this section to build a clear mental model before moving into lab work. Keep the
            notes practical, connect each concept to a browser or server example, and close with a
            short activity that students can complete independently.
          </p>
        </section>
      ))}
    </article>
  )
}

function SupabaseLecturePage({ lecture }) {
  const content = lecture.english_content
  const resources = Array.isArray(lecture.resources) ? lecture.resources : []
  const blocks = Array.isArray(lecture.content_blocks) ? lecture.content_blocks : []
  const readContent = useContentProgress()
  const { markLectureRead, progressMessage } = useProgress()
  const isRead = readContent.has(lecture.id)

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <p className="mb-3 text-sm font-semibold text-cyan-300">{lecture.category || 'AWT Lecture'}</p>
      <h1 className="text-4xl font-bold tracking-normal text-white">{lecture.title}</h1>
      <p className="mt-5 text-lg leading-8 text-slate-300">{lecture.short_description}</p>
      <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-200">Lecture progress</p>
          <p className="text-sm font-bold text-cyan-200">{isRead ? 100 : 0}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: isRead ? '100%' : '0%' }} />
        </div>
      </div>

      {blocks.length ? (
        <section id="lesson-content" className="scroll-mt-24 border-t border-slate-800 py-8">
          <LectureBlockRenderer blocks={blocks} />
        </section>
      ) : (
        <>
          <section id="theory" className="scroll-mt-24 border-t border-slate-800 py-8">
            <h2 className="text-2xl font-semibold text-white">Theory</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-slate-300">{content || 'Lecture content will appear here.'}</p>
          </section>

          <section id="code-example" className="scroll-mt-24 border-t border-slate-800 py-8">
            <h2 className="text-2xl font-semibold text-white">Code Example</h2>
            <pre className="mt-5 overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-slate-100">
              <code>{lecture.code_examples || 'No code example added yet.'}</code>
            </pre>
          </section>

          <section id="notes" className="scroll-mt-24 border-t border-slate-800 py-8">
            <h2 className="text-2xl font-semibold text-white">Notes</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-slate-300">{lecture.notes || 'No notes added yet.'}</p>
          </section>

          <section id="resources" className="scroll-mt-24 border-t border-slate-800 py-8">
            <h2 className="text-2xl font-semibold text-white">Resources</h2>
            {resources.length ? (
              <ul className="mt-4 space-y-2 text-slate-300">
                {resources.map((resource) => <li key={resource}>{resource}</li>)}
              </ul>
            ) : (
              <p className="mt-4 text-slate-400">No resources added yet.</p>
            )}
          </section>
        </>
      )}
      <section id="summary" className="scroll-mt-24 border-t border-slate-800 py-8">
        <button
          type="button"
          onClick={() => markLectureRead({ contentId: lecture.id, title: lecture.title, isRead: !isRead })}
          className={[
            'inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition',
            isRead ? 'bg-emerald-400 text-slate-950' : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
          ].join(' ')}
        >
          <Check className="h-4 w-4" />
          {isRead ? 'Marked as Read' : 'Mark as Read'}
        </button>
        {progressMessage ? <p className="mt-4 text-sm font-semibold text-emerald-300">{progressMessage}</p> : null}
      </section>
    </article>
  )
}
