import { Check, ChevronLeft, ChevronRight, Clipboard } from 'lucide-react'
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useContentProgress } from '../hooks/useContentProgress.js'
import { useProgress } from '../hooks/useProgress.js'

const htmlCode = `<section class="hero">
  <p class="eyebrow">AWT Lecture 01</p>
  <h1>Build your first web page</h1>
  <p>
    HTML gives structure to headings, paragraphs,
    links, images, and the content users read.
  </p>
  <a href="#start">Start learning</a>
</section>`

const cssCode = `.hero {
  max-width: 720px;
  padding: 48px 24px;
  border-left: 4px solid #22d3ee;
  background: #0f172a;
  color: white;
}

.eyebrow {
  color: #67e8f9;
  font-weight: 700;
}`

const quizOptions = [
  'HTML controls database permissions',
  'HTML describes the structure and meaning of page content',
  'HTML replaces CSS and JavaScript'
]
const lectureId = 'lecture-html-introduction'

function Callout({ tone, icon, title, children }) {
  const styles = {
    info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100',
    note: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
    warning: 'border-red-300/30 bg-red-400/10 text-red-100',
    success: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
    code: 'border-violet-300/30 bg-violet-400/10 text-violet-100'
  }

  return (
    <aside className={`rounded-md border p-4 ${styles[tone]}`}>
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950/60 text-base">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <div className="mt-2 text-sm leading-6 text-slate-200">{children}</div>
        </div>
      </div>
    </aside>
  )
}

export default function LectureDetailPage() {
  const { language = 'EN' } = useOutletContext() || {}
  const [activeTab, setActiveTab] = useState('HTML')
  const [copied, setCopied] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const readContent = useContentProgress()
  const { markLectureRead, progressMessage } = useProgress()
  const isRead = readContent.has(lectureId)
  const isRomanUrdu = language === 'Roman Urdu'
  const activeCode = activeTab === 'HTML' ? htmlCode : cssCode

  async function copyCode() {
    await navigator.clipboard.writeText(activeCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <section id="lecture-overview" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-200">
            HTML
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300">
            Lecture 01
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-normal text-slate-950 dark:text-white sm:text-5xl">
          Introduction to HTML Structure
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700 dark:text-slate-300">
          {isRomanUrdu
            ? 'Is lecture mein hum HTML ka role, page structure, semantic tags, aur pehli professional web section banana seekhenge.'
            : 'Learn how HTML gives web pages structure, meaning, and a clean foundation for styling and interactivity.'}
        </p>
        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-200">Lecture progress</p>
            <p className="text-sm font-bold text-cyan-200">{isRead ? 100 : 0}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: isRead ? '100%' : '0%' }} />
          </div>
        </div>
      </section>

      <section id="theory" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Theory</h2>
        <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">
          HTML is the markup language browsers read to understand a page. It does not decide visual
          design by itself; instead, it labels content as headings, paragraphs, links, lists, images,
          forms, and sections.
        </p>
        <div className="mt-6 grid gap-4">
          <Callout tone="info" icon="ℹ️" title="Info">
            Think of HTML as the content map of a page. Good structure makes CSS, JavaScript, and
            accessibility easier later.
          </Callout>
          <Callout tone="note" icon="💡" title="Note">
            Use semantic elements such as <code>header</code>, <code>main</code>, <code>section</code>,
            and <code>footer</code> when they describe the purpose of the content.
          </Callout>
        </div>
      </section>

      <section id="example" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Example</h2>
        <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">
          A simple lecture hero can contain a label, a main heading, supporting text, and one action
          link. Each element has a clear job, which keeps the page easy to scan.
        </p>
        <Callout tone="success" icon="🎉" title="Success Pattern">
          If a reader can understand the page outline by reading only headings, your HTML structure is
          probably moving in the right direction.
        </Callout>
      </section>

      <section id="code-example" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Code Example</h2>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Clipboard className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-slate-800 bg-slate-950">
          <div className="flex border-b border-slate-800 bg-slate-900/80">
            {['HTML', 'CSS', 'Output'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  'px-4 py-3 text-sm font-semibold transition',
                  activeTab === tab ? 'bg-slate-950 text-cyan-200' : 'text-slate-400 hover:text-white'
                ].join(' ')}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === 'Output' ? (
            <div className="p-5">
              <OutputPreview compact />
            </div>
          ) : (
            <pre className="overflow-x-auto p-5 text-sm leading-6 text-slate-100">
              <code>{activeCode}</code>
            </pre>
          )}
        </div>

        <div className="mt-5">
          <Callout tone="code" icon="💻" title="Code Tip">
            Copy the HTML first, then add the CSS. Test one change at a time so mistakes are easier
            to find.
          </Callout>
        </div>
      </section>

      <section id="output-preview" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Output Preview</h2>
        <div className="mt-5">
          <OutputPreview />
        </div>
      </section>

      <section id="notes" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Notes</h2>
        <ul className="mt-5 space-y-3 leading-7 text-slate-700 dark:text-slate-300">
          <li>Use one <code>h1</code> for the main page title.</li>
          <li>Keep headings in logical order so the document outline stays clear.</li>
          <li>Use links for navigation and buttons for actions.</li>
        </ul>
        <div className="mt-6">
          <Callout tone="warning" icon="⚠️" title="Warning">
            Avoid using headings only to make text bigger. Heading tags should describe document
            structure, not just visual size.
          </Callout>
        </div>
      </section>

      <section id="quick-quiz" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Quick Quiz</h2>
        <p className="mt-4 text-slate-700 dark:text-slate-300">What is the main purpose of HTML?</p>
        <div className="mt-5 space-y-3">
          {quizOptions.map((option) => {
            const isCorrect = option === quizOptions[1]
            const isSelected = selectedAnswer === option

            return (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedAnswer(option)}
                className={[
                  'block w-full rounded-md border p-4 text-left text-sm transition',
                  isSelected && isCorrect
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                    : isSelected
                      ? 'border-red-300 bg-red-400/10 text-red-100'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-cyan-400'
                ].join(' ')}
              >
                {option}
              </button>
            )
          })}
        </div>
      </section>

      <section id="summary" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Summary</h2>
        <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">
          HTML creates the structure of a web page. Clean structure makes the page easier to style,
          script, navigate, and understand.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/docs/semantic-elements"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
          <button
            type="button"
            onClick={() => markLectureRead({
              contentId: lectureId,
              title: 'Introduction to HTML Structure',
              isRead: !isRead
            })}
            className={[
              'inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition',
              isRead ? 'bg-emerald-400 text-slate-950' : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
            ].join(' ')}
          >
            <Check className="h-4 w-4" />
            {isRead ? 'Marked as Read' : 'Mark as Read'}
          </button>
          <Link
            to="/docs/html-document-structure"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {progressMessage ? <p className="mt-4 text-sm font-semibold text-emerald-300">{progressMessage}</p> : null}
      </section>
    </article>
  )
}

function OutputPreview({ compact = false }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
      <div className={`border-l-4 border-cyan-400 bg-slate-950 text-white ${compact ? 'p-5' : 'p-8'}`}>
        <p className="text-xs font-bold uppercase text-cyan-300">AWT Lecture 01</p>
        <h3 className="mt-3 text-2xl font-bold">Build your first web page</h3>
        <p className="mt-3 max-w-xl leading-7 text-slate-300">
          HTML gives structure to headings, paragraphs, links, images, and the content users read.
        </p>
        <span className="mt-5 inline-flex rounded-md bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950">
          Start learning
        </span>
      </div>
    </div>
  )
}
