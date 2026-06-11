import { CheckCircle2, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
import { fetchPublishedLabBySlug } from '../lib/contentDetailsRepository.js'
import { getLabStepProgress } from '../lib/progressStore.js'
import { ProgressBar } from './StudentOverviewPage.jsx'
import { getItemProgress } from './studentProgress.js'

export default function StudentLabDetailPage() {
  const { slug } = useParams()
  const { labs } = useStudentContent()
  const { progressMessage, records, readIds, saveLabSteps } = useProgress()
  const [lab, setLab] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadLab() {
      const remote = await fetchPublishedLabBySlug(slug)
      if (!isMounted) return
      setLab(remote)
      setIsLoading(false)
    }

    loadLab()
    return () => {
      isMounted = false
    }
  }, [slug])

  const fallback = labs.find((item) => item.slug === slug)
  const current = mapLab(lab || fallback)
  const percent = current ? getItemProgress(records, 'lab', current.id, readIds) : 0
  const checkedSteps = current ? getLabStepProgress(current.id) : []
  const checkedSet = new Set(checkedSteps)

  if (isLoading && !fallback) return <p className="text-slate-400">Loading lab...</p>
  if (!current) return <Navigate to="/student/labs" replace />

  async function markComplete() {
    await saveLabSteps({
      contentId: current.id,
      title: current.title,
      checkedSteps: current.steps.map((_, index) => `${current.id}-step-${index}`),
      totalSteps: current.steps.length
    })
  }

  async function toggleStep(index) {
    const stepId = `${current.id}-step-${index}`
    const next = checkedSet.has(stepId)
      ? checkedSteps.filter((id) => id !== stepId)
      : [...checkedSteps, stepId]
    await saveLabSteps({ contentId: current.id, title: current.title, checkedSteps: next, totalSteps: current.steps.length })
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
            <Link to="/student/labs" className="transition hover:text-white">Labs</Link>
            <span>&gt;</span>
            <span className="text-white">{current.labNumber ? `${current.labNumber}. ` : ''}{current.title}</span>
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
            disabled={percent >= 100} 
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#22c55e] px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-[#16a34a] disabled:cursor-default disabled:opacity-80"
          >
            <CheckCircle2 className="h-4 w-4" />
            {percent >= 100 ? 'Completed' : 'Mark as Complete'}
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

        {/* Objective */}
        <p className="mt-5 text-sm leading-6 text-slate-400">{current.objective}</p>
      </header>

      {/* Main Content Area */}
      <section className="grid gap-8 lg:grid-cols-[1fr_240px]">
        <div className="space-y-6">
          <StudentLabSection title="Required Tools">
            <div className="grid gap-3 sm:grid-cols-2">{current.tools.map((tool) => <div key={tool} className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 text-sm font-semibold text-slate-200">{tool}</div>)}</div>
          </StudentLabSection>
          <StudentLabSection title="Step-by-step Instructions">
            <div className="space-y-3">
              {current.steps.map((step, index) => {
                const stepId = `${current.id}-step-${index}`
                const isChecked = checkedSet.has(stepId)
                return (
                  <label key={stepId} className={['flex gap-3 rounded-lg border p-4 transition', isChecked ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-[#1e293b] bg-[#0f172a]'].join(' ')}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleStep(index)} className="mt-1 h-4 w-4 accent-emerald-400" />
                    <span className="text-sm leading-6 text-slate-300">{step}</span>
                  </label>
                )
              })}
            </div>
          </StudentLabSection>
          <StudentLabSection title="Code Examples"><pre className="overflow-x-auto rounded-lg bg-slate-950 p-5 text-sm text-slate-100 border border-slate-800"><code>{current.code}</code></pre></StudentLabSection>
          <StudentLabSection title="Output Preview"><p className="text-slate-300">{current.output}</p></StudentLabSection>
          <StudentLabSection title="Common Errors"><List items={current.errors} /></StudentLabSection>
          <StudentLabSection title="Helpful Tips"><List items={current.tips} /></StudentLabSection>
        </div>

        {/* Right Sidebar (On This Page) */}
        <div className="hidden lg:block print:hidden">
          <div className="sticky top-24 rounded-xl border border-[#1b2b3c] bg-[#111c2b] p-5 shadow-2xl">
            <h3 className="mb-4 text-sm font-bold text-white">On This Page</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {current.tools?.length > 0 && <li className="cursor-pointer border-l-2 border-[#22c55e] pl-3 text-slate-200 transition">Required Tools</li>}
              {current.steps?.length > 0 && <li className="cursor-pointer border-l-2 border-transparent pl-3 transition hover:text-slate-200">Instructions</li>}
              {current.code && <li className="cursor-pointer border-l-2 border-transparent pl-3 transition hover:text-slate-200">Code Examples</li>}
              {current.output && <li className="cursor-pointer border-l-2 border-transparent pl-3 transition hover:text-slate-200">Output Preview</li>}
              {current.errors?.length > 0 && <li className="cursor-pointer border-l-2 border-transparent pl-3 transition hover:text-slate-200">Common Errors</li>}
              {current.tips?.length > 0 && <li className="cursor-pointer border-l-2 border-transparent pl-3 transition hover:text-slate-200">Helpful Tips</li>}
            </ul>
          </div>
        </div>
      </section>
    </article>
  )
}

function mapLab(lab) {
  if (!lab) return null
  const labNumber = lab.lab_number ?? lab.labNumber ?? lab.order ?? 0
  const steps = Array.isArray(lab.steps) && lab.steps.length ? lab.steps : ['Open the lab.', 'Complete the practical work.', 'Compare output.', 'Mark the lab complete.']
  return {
    id: lab.id,
    title: labNumber === 8 ? 'Mid Term' : labNumber === 15 ? 'Final Term' : lab.title,
    labNumber,
    objective: lab.objective || 'Complete the lab objective and submit your finished practice work.',
    tools: Array.isArray(lab.required_tools) ? lab.required_tools : ['VS Code', 'Browser', 'Node.js'],
    steps,
    code: lab.code_examples || '<!-- Lab code example will appear here -->',
    output: lab.output_preview || 'Expected output preview will appear here.',
    errors: Array.isArray(lab.common_errors) ? lab.common_errors : ['Check file paths and console errors.'],
    tips: Array.isArray(lab.tips) ? lab.tips : ['Complete one step at a time.']
  }
}

function StudentLabSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function List({ items }) {
  return <ul className="space-y-2 text-sm text-slate-300">{items.map((item) => <li key={item} className="rounded-lg bg-slate-950/60 px-3 py-2">{item}</li>)}</ul>
}
