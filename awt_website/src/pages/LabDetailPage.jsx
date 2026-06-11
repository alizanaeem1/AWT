import { Check, ChevronLeft, ChevronRight, FlaskConical, Monitor } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { findLab, getAdjacentLabs } from '../data/labs.js'
import { useProgress } from '../hooks/useProgress.js'
import { fetchPublishedLabBySlug } from '../lib/contentDetailsRepository.js'
import { getLabStepProgress } from '../lib/progressStore.js'

function StickerCallout({ tone, icon, title, children }) {
  const styles = {
    objective: 'border-cyan-400/30 bg-cyan-400/10',
    code: 'border-violet-300/30 bg-violet-400/10',
    warning: 'border-red-300/30 bg-red-400/10',
    tip: 'border-amber-300/30 bg-amber-300/10',
    complete: 'border-emerald-300/30 bg-emerald-400/10'
  }

  return (
    <aside className={`rounded-md border p-4 ${styles[tone]}`}>
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-lg">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <div className="mt-2 text-sm leading-6 text-slate-300">{children}</div>
        </div>
      </div>
    </aside>
  )
}

export default function LabDetailPage() {
  const { slug } = useParams()
  const lab = findLab(slug)
  const [remoteLab, setRemoteLab] = useState(null)
  const [isLoading, setIsLoading] = useState(!lab)

  useEffect(() => {
    let isMounted = true

    async function loadLab() {
      if (lab) {
        setIsLoading(false)
        return
      }

      const nextLab = await fetchPublishedLabBySlug(slug)
      if (isMounted) {
        setRemoteLab(nextLab)
        setIsLoading(false)
      }
    }

    loadLab()

    return () => {
      isMounted = false
    }
  }, [lab, slug])

  if (isLoading) return <article className="mx-auto w-full max-w-3xl px-5 py-10 text-slate-300 sm:px-8 lg:py-14">Loading lab...</article>

  if (!lab && !remoteLab) return <Navigate to="/" replace />

  if (remoteLab) {
    const mappedLab = mapRemoteLab(remoteLab)
    if (mappedLab.exam) return <ExamLabPage lab={mappedLab} />
    return <InteractiveLabPage lab={mappedLab} />
  }

  if (lab.exam) return <ExamLabPage lab={lab} />

  return <InteractiveLabPage lab={lab} />
}

function mapRemoteLab(lab) {
  const steps = Array.isArray(lab.steps) ? lab.steps : []
  const isExam = lab.lab_number === 8 || lab.lab_number === 15

  return {
    id: lab.id,
    slug: lab.slug,
    number: lab.lab_number,
    title: lab.lab_number === 8 ? 'Mid Term' : lab.lab_number === 15 ? 'Final Term' : lab.title,
    exam: isExam
      ? {
          label: lab.lab_number === 8 ? 'Mid Term' : 'Final Term',
          message: lab.objective || 'This lab slot is reserved for an evaluation.'
        }
      : null,
    objective: lab.objective || 'Complete the lab objective.',
    tools: Array.isArray(lab.required_tools) ? lab.required_tools : [],
    steps,
    code: lab.code_examples || '',
    output: lab.output_preview || '',
    errors: Array.isArray(lab.common_errors) ? lab.common_errors : [],
    tips: Array.isArray(lab.tips) ? lab.tips : [],
    checklist: steps
  }
}

function InteractiveLabPage({ lab }) {
  const [checkedSteps, setCheckedSteps] = useState(() => getLabStepProgress(lab.id))
  const { progressMessage, records, saveLabSteps } = useProgress()
  const checkedSet = useMemo(() => new Set(checkedSteps), [checkedSteps])
  const progress = lab.steps.length ? Math.round((checkedSteps.length / lab.steps.length) * 100) : 0
  const isComplete = progress === 100
  const { previous, next } = getAdjacentLabs(lab.number)

  useEffect(() => {
    window.setTimeout(() => setCheckedSteps(getLabStepProgress(lab.id)), 0)
  }, [lab.id, records])

  async function updateSteps(nextCheckedSteps) {
    setCheckedSteps(nextCheckedSteps)
    await saveLabSteps({
      contentId: lab.id,
      title: lab.title,
      checkedSteps: nextCheckedSteps,
      totalSteps: lab.steps.length
    })
  }

  function toggleStep(stepIndex) {
    const stepId = `${lab.id}-step-${stepIndex}`
    const nextChecked = checkedSet.has(stepId)
      ? checkedSteps.filter((id) => id !== stepId)
      : [...checkedSteps, stepId]

    updateSteps(nextChecked)
  }

  function markComplete() {
    updateSteps(lab.steps.map((_, index) => `${lab.id}-step-${index}`))
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <section id="lab-overview" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-200">
            Lab {lab.number}
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300">
            Interactive Practice
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-normal text-slate-950 dark:text-white sm:text-5xl">{lab.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-700 dark:text-slate-300">
          Complete each step, compare the output, and mark the lab complete when your work is ready.
        </p>
        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-200">Lab progress</p>
            <p className="text-sm font-bold text-cyan-200">{progress}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section id="objective" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Lab Objective</h2>
        <div className="mt-5">
          <StickerCallout tone="objective" icon="🧪" title="Objective">
            {lab.objective}
          </StickerCallout>
        </div>
      </section>

      <section id="tools" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Required Tools</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {lab.tools.map((tool) => (
            <div key={tool} className="rounded-md border border-slate-800 bg-slate-900/60 p-4 text-sm font-semibold text-slate-200">
              {tool}
            </div>
          ))}
        </div>
      </section>

      <section id="instructions" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Step-by-step Instructions</h2>
        <div className="mt-5 space-y-3">
          {lab.steps.map((step, index) => {
            const stepId = `${lab.id}-step-${index}`
            const isChecked = checkedSet.has(stepId)

            return (
              <label
                key={stepId}
                className={[
                  'flex gap-3 rounded-md border p-4 transition',
                  isChecked
                    ? 'border-emerald-400/40 bg-emerald-400/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-cyan-400/60'
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStep(index)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 accent-cyan-400"
                />
                <span className="text-sm leading-6 text-slate-300">{step}</span>
              </label>
            )
          })}
        </div>
      </section>

      <section id="code-examples" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Code Examples</h2>
        <div className="mt-5">
          <StickerCallout tone="code" icon="💻" title="Code">
            Start from this snippet, then adapt names and content for your lab submission.
          </StickerCallout>
        </div>
        <pre className="mt-5 overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-slate-100">
          <code>{lab.code}</code>
        </pre>
      </section>

      <section id="output-preview" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Output Preview</h2>
        <div className="mt-5 rounded-md border border-slate-800 bg-slate-900 p-5">
          <div className="rounded-md border-l-4 border-cyan-400 bg-slate-950 p-6">
            <div className="flex items-center gap-3 text-cyan-200">
              <Monitor className="h-5 w-5" />
              <p className="text-sm font-bold">Expected Output</p>
            </div>
            <p className="mt-4 leading-7 text-slate-300">{lab.output}</p>
          </div>
        </div>
      </section>

      <section id="common-errors" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Common Errors</h2>
        <div className="mt-5">
          <StickerCallout tone="warning" icon="⚠️" title="Watch for these">
            <ul className="space-y-2">
              {lab.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </StickerCallout>
        </div>
      </section>

      <section id="helpful-tips" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Helpful Tips</h2>
        <div className="mt-5">
          <StickerCallout tone="tip" icon="💡" title="Tips">
            <ul className="space-y-2">
              {lab.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </StickerCallout>
        </div>
      </section>

      <section id="completion" className="scroll-mt-24 border-t border-slate-200 py-10 dark:border-slate-800">
        <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Completion Checklist</h2>
        <div className="mt-5">
          <StickerCallout tone="complete" icon="🎉" title="Completion">
            <ul className="space-y-2">
              {lab.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </StickerCallout>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {previous ? <LabNavLink lab={previous} direction="previous" /> : <span />}
          <button
            type="button"
            onClick={markComplete}
            className={[
              'inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition',
              isComplete ? 'bg-emerald-400 text-slate-950' : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
            ].join(' ')}
          >
            <Check className="h-4 w-4" />
            {isComplete ? 'Lab Complete' : 'Mark Lab as Complete'}
          </button>
          {next ? <LabNavLink lab={next} direction="next" /> : <span />}
        </div>
        {progressMessage ? <p className="mt-4 text-sm font-semibold text-emerald-300">{progressMessage}</p> : null}
      </section>
    </article>
  )
}

function ExamLabPage({ lab }) {
  const { previous, next } = getAdjacentLabs(lab.number)

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <section id="lab-overview" className="scroll-mt-24">
        <p className="mb-4 text-sm font-bold text-cyan-300">Lab {lab.number}</p>
        <h1 className="text-4xl font-bold tracking-normal text-slate-950 dark:text-white sm:text-5xl">
          {lab.exam.label}
        </h1>
      </section>
      <section id="objective" className="scroll-mt-24 py-10">
        <div className="rounded-lg border border-cyan-400/30 bg-slate-900 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
            <FlaskConical className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-white">{lab.exam.label} Evaluation</h2>
          <p className="mt-4 leading-7 text-slate-300">{lab.exam.message}</p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {previous ? <LabNavLink lab={previous} direction="previous" /> : <span />}
          {next ? <LabNavLink lab={next} direction="next" /> : <span />}
        </div>
      </section>
    </article>
  )
}

function LabNavLink({ lab, direction }) {
  const isPrevious = direction === 'previous'

  return (
    <Link
      to={`/labs/${lab.slug}`}
      className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white"
    >
      {isPrevious ? <ChevronLeft className="h-4 w-4" /> : null}
      {isPrevious ? 'Previous Lab' : 'Next Lab'}
      {!isPrevious ? <ChevronRight className="h-4 w-4" /> : null}
    </Link>
  )
}
