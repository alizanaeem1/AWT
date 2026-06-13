import {
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  FlaskConical,
  Hammer,
  Lightbulb,
  ListChecks,
  TerminalSquare,
  X
} from 'lucide-react'
import { useState } from 'react'

function toArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value).split('\n').map((item) => item.trim()).filter(Boolean)
}

function getLabBlocks(lab) {
  if (Array.isArray(lab?.blocks) && lab.blocks.length) return lab.blocks
  if (Array.isArray(lab?.content_blocks) && lab.content_blocks.length) return lab.content_blocks

  const blocks = []
  const objective = lab?.objective
  const tools = toArray(lab?.required_tools ?? lab?.tools)
  const steps = toArray(lab?.steps)
  const examples = lab?.examples ?? lab?.code_examples ?? lab?.code
  const output = lab?.outputPreview ?? lab?.output_preview ?? lab?.output
  const errors = toArray(lab?.commonErrors ?? lab?.common_errors ?? lab?.errors)
  const tips = toArray(lab?.tips)

  if (objective) blocks.push({ id: 'objective', type: 'objective', label: 'Objective', content: { text: objective }, settings: {} })
  if (tools.length) blocks.push({ id: 'tools', type: 'tools', label: 'Required Tools', content: { items: tools }, settings: {} })
  if (steps.length) blocks.push({ id: 'steps', type: 'steps', label: 'Step-by-step Instructions', content: { items: steps }, settings: {} })
  if (examples) blocks.push({ id: 'code', type: 'code', label: 'Code Example', content: { language: lab?.language || 'HTML', code: examples }, settings: {} })
  if (output) blocks.push({ id: 'output', type: 'output', label: 'Output Preview', content: { text: output }, settings: {} })
  if (errors.length) {
    blocks.push({
      id: 'errors',
      type: 'errors',
      label: 'Common Errors',
      content: {
        items: errors.map((item) => (typeof item === 'string' ? { error: item, cause: '', solution: '' } : item))
      },
      settings: {}
    })
  }
  if (tips.length) blocks.push({ id: 'tips', type: 'tips', label: 'Helpful Tips', content: { items: tips }, settings: {} })
  return blocks
}

function buildPreviewLab(lab) {
  const source = lab?.meta ? { ...lab.meta, id: lab.id } : lab || {}
  const labNumber = source.labNumber ?? source.lab_number ?? source.number ?? ''
  return {
    id: source.id,
    title: source.title || 'Untitled Lab',
    labNumber,
    category: source.category || 'General',
    level: source.level || source.difficulty || 'Beginner',
    duration: source.duration || source.estimated_time || '',
    objective: source.objective || '',
    status: source.status || (source.is_published ? 'Published' : 'Draft'),
    shortDescription: source.shortDescription || source.short_description || '',
    settings: source.settings || {},
    blocks: getLabBlocks(lab)
  }
}

function buildBlockStyle(settings = {}) {
  const style = {}
  if (settings.backgroundColor && settings.backgroundColor !== 'transparent') {
    const gradients = { 'gradient-cyan': 'linear-gradient(135deg,#0ea5e9,#6366f1)' }
    style.background = settings.backgroundColor.startsWith('gradient-')
      ? gradients[settings.backgroundColor]
      : settings.backgroundColor
  }
  if (settings.borderColor) style.outlineColor = settings.borderColor
  if (settings.borderRadius !== undefined) style.borderRadius = `${settings.borderRadius}px`
  if (settings.borderWidth !== undefined) style.border = `${settings.borderWidth}px solid ${settings.borderColor || '#e2e8f0'}`
  const shadows = {
    sm: '0 1px 4px rgba(0,0,0,.15)',
    md: '0 4px 12px rgba(0,0,0,.2)',
    lg: '0 8px 24px rgba(0,0,0,.25)',
    xl: '0 16px 40px rgba(0,0,0,.3)'
  }
  if (settings.shadow && settings.shadow !== 'none') style.boxShadow = shadows[settings.shadow]
  if (settings.marginTop !== undefined) style.marginTop = `${settings.marginTop}px`
  if (settings.marginBottom !== undefined) style.marginBottom = `${settings.marginBottom}px`
  if (settings.marginLeft !== undefined) style.marginLeft = `${settings.marginLeft}px`
  if (settings.marginRight !== undefined) style.marginRight = `${settings.marginRight}px`
  if (settings.paddingTop !== undefined) style.paddingTop = `${settings.paddingTop}px`
  if (settings.paddingBottom !== undefined) style.paddingBottom = `${settings.paddingBottom}px`
  if (settings.paddingLeft !== undefined) style.paddingLeft = `${settings.paddingLeft}px`
  if (settings.paddingRight !== undefined) style.paddingRight = `${settings.paddingRight}px`
  if (settings.width === '100%') style.width = '100%'
  if (settings.width === 'custom' && settings.customWidth) style.width = settings.customWidth
  return style
}

function buildTextStyle(settings = {}) {
  const style = {}
  if (settings.color) style.color = settings.color
  if (settings.fontFamily) style.fontFamily = settings.fontFamily
  if (settings.fontSize) style.fontSize = `${settings.fontSize}px`
  if (settings.fontWeight) style.fontWeight = settings.fontWeight
  if (settings.lineHeight) style.lineHeight = settings.lineHeight
  if (settings.letterSpacing) style.letterSpacing = `${settings.letterSpacing}em`
  if (settings.alignment) style.textAlign = settings.alignment
  return style
}

export default function LabPreview({ lab, onClose, footer, headerAside, className = '' }) {
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const preview = buildPreviewLab(lab)
  const settings = preview.settings
  const metaCardStyle = buildBlockStyle(settings)
  const metaTextStyle = buildTextStyle(settings)

  const article = (
    <article className={`rounded-2xl border border-[#223346] bg-[#111c2b] p-4 text-slate-100 shadow-2xl shadow-black/30 sm:p-8 ${className}`}>
      <div
        className="mb-8 border-b pb-6"
        style={{
          borderColor: settings.borderColor || '#223346',
          borderRadius: settings.borderRadius ? `${settings.borderRadius}px` : undefined,
          background: (settings.backgroundColor && settings.backgroundColor !== 'transparent') ? metaCardStyle.background : undefined,
          color: metaTextStyle.color || undefined,
          fontFamily: metaTextStyle.fontFamily || undefined,
          paddingTop: settings.paddingTop !== undefined ? `${settings.paddingTop}px` : undefined,
          paddingBottom: settings.paddingBottom !== undefined ? `${settings.paddingBottom}px` : undefined,
          paddingLeft: settings.paddingLeft !== undefined ? `${settings.paddingLeft}px` : undefined,
          paddingRight: settings.paddingRight !== undefined ? `${settings.paddingRight}px` : undefined,
          boxShadow: metaCardStyle.boxShadow || undefined
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              {preview.labNumber ? `Lab ${preview.labNumber}` : 'Lab'}
              {preview.category ? ` · ${preview.category}` : ''}
              {preview.level ? ` · ${preview.level}` : ''}
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl" style={{ color: metaTextStyle.color || '#ffffff', fontFamily: metaTextStyle.fontFamily, fontWeight: metaTextStyle.fontWeight || 900 }}>
              {preview.title}
            </h1>
            {preview.shortDescription && (
              <p className="mt-2 text-sm leading-6" style={{ color: metaTextStyle.color || '#94a3b8', fontFamily: metaTextStyle.fontFamily, fontSize: metaTextStyle.fontSize }}>
                {preview.shortDescription}
              </p>
            )}
            {preview.duration && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                <Clock className="h-3.5 w-3.5" />
                {preview.duration} min estimated
              </div>
            )}
          </div>
          {headerAside ? <div className="w-full shrink-0 lg:w-[420px]">{headerAside}</div> : null}
        </div>
      </div>

      <div className="space-y-5">
        {preview.blocks.length ? preview.blocks.map((block) => <PreviewBlock key={block.id} block={block} />) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center text-sm text-slate-500">
            Add lab components to see the student preview here.
          </div>
        )}
      </div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </article>
  )

  if (!onClose) return article
  const previewWidthClass = {
    desktop: 'max-w-4xl',
    tablet: 'max-w-3xl',
    mobile: 'max-w-[390px]'
  }[previewDevice]

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/80 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={`mx-auto w-full px-4 py-10 ${previewWidthClass}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-300">
              STUDENT PREVIEW
            </span>
            <h2 className="mt-2 text-2xl font-black text-white">{preview.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['desktop', 'tablet', 'mobile'].map((device) => (
              <button
                key={device}
                type="button"
                onClick={() => setPreviewDevice(device)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${previewDevice === device ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-slate-700 text-slate-300 hover:border-cyan-400'}`}
              >
                {device}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-xs font-bold text-slate-300 hover:border-cyan-400"
            >
              <X className="h-3.5 w-3.5" />
              Close Preview
            </button>
          </div>
        </div>
        {article}
      </div>
    </div>
  )
}

function PreviewBlock({ block }) {
  const content = block.content || {}
  const settings = block.settings || {}
  const wrapStyle = buildBlockStyle(settings)
  const textStyle = buildTextStyle(settings)

  if (block.type === 'objective') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-white">
          <FlaskConical className="h-5 w-5 text-cyan-400" /> Objective
        </h2>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100" style={textStyle}>{content.text}</div>
      </PreviewSection>
    )
  }

  if (block.type === 'outcomes') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-3 text-lg font-black text-white">Activity Outcomes</h2>
        <ul className="space-y-2">
          {(content.items || []).map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100" style={textStyle}>
              <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {item}
            </li>
          ))}
        </ul>
      </PreviewSection>
    )
  }

  if (block.type === 'tools') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><Hammer className="h-5 w-5 text-violet-400" /> Required Tools</h2>
        <div className="flex flex-wrap gap-2">
          {(content.items || []).map((tool) => (
            <span key={tool} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200" style={textStyle}>{tool}</span>
          ))}
        </div>
      </PreviewSection>
    )
  }

  if (block.type === 'steps') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><ListChecks className="h-5 w-5 text-cyan-400" /> {block.label}</h2>
        <div className="space-y-2">
          {(content.items || []).map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200" style={textStyle}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/30 text-[10px] font-black text-cyan-300">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </PreviewSection>
    )
  }

  if (block.type === 'solved-activity') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle} className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">{content.title || 'Solved Activity'}</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {content.time && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-bold text-amber-300">{content.time} min</span>}
            {content.difficulty && <span className="rounded-full bg-slate-700 px-2 py-0.5 font-bold text-slate-300">{content.difficulty}</span>}
            {content.clo && <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 font-bold text-cyan-300">{content.clo}</span>}
          </div>
        </div>
        {content.objective && <p className="mb-4 text-sm leading-6 text-slate-400">{content.objective}</p>}
        {content.instructions?.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-black uppercase text-slate-500">Instructions</p>
            <div className="space-y-1.5">
              {content.instructions.map((step, index) => (
                <div key={`${step}-${index}`} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/30 text-[9px] font-black text-amber-300">{index + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
        {content.code && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-black uppercase text-slate-500">Code ({content.language || 'HTML'})</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100"><code>{content.code}</code></pre>
          </div>
        )}
        {content.output && <p className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">{content.output}</p>}
        {content.expectedResult && <p className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{content.expectedResult}</p>}
      </PreviewSection>
    )
  }

  if (block.type === 'graded-task') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle} className="rounded-xl border border-orange-400/30 bg-orange-400/5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{content.title || 'Graded Task'}</h2>
          {content.marks && <span className="rounded-full bg-orange-500/30 px-3 py-0.5 text-xs font-black text-orange-300">{content.marks} marks</span>}
        </div>
        {content.problem && <p className="mb-4 text-sm leading-6 text-slate-300" style={textStyle}>{content.problem}</p>}
        {content.requirements?.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm">
            {content.requirements.map((requirement, index) => <li key={`${requirement}-${index}`} className="flex items-start gap-2 text-slate-300" style={textStyle}><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />{requirement}</li>)}
          </ul>
        )}
        {content.submission && <p className="rounded-lg border border-orange-400/20 bg-slate-900 p-3 text-sm italic text-slate-400">{content.submission}</p>}
      </PreviewSection>
    )
  }

  if (block.type === 'code') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <div className="mb-2 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-black text-white">{block.label}</h2>
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{content.language}</span>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100"><code>{content.code}</code></pre>
        {content.liveOutput !== false && ['HTML', 'CSS'].includes(content.language || 'HTML') ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-700 bg-white">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
              Live Output
            </div>
            <iframe
              title={`${block.id}-output`}
              className="h-48 w-full bg-white"
              sandbox="allow-scripts"
              srcDoc={`<!doctype html><html><head><style>${content.css || ''}</style></head><body>${content.language === 'CSS' ? `<style>${content.code || ''}</style><div class="demo">CSS preview</div>` : content.code || ''}</body></html>`}
            />
          </div>
        ) : null}
      </PreviewSection>
    )
  }

  if (block.type === 'output') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-white"><TerminalSquare className="h-5 w-5 text-indigo-400" /> Output Preview</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-sm text-slate-300" style={textStyle}>{content.text}</div>
      </PreviewSection>
    )
  }

  if (block.type === 'errors') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-3 text-lg font-black text-white">Common Errors</h2>
        <div className="space-y-3">
          {(content.items || []).map((item, index) => (
            <div key={`${item.error}-${index}`} className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="font-black text-red-300">{item.error}</p>
              {item.cause && <p className="mt-1 text-sm text-slate-400"><strong className="text-slate-300">Cause:</strong> {item.cause}</p>}
              {item.solution && <p className="mt-0.5 text-sm text-slate-400"><strong className="text-slate-300">Fix:</strong> {item.solution}</p>}
            </div>
          ))}
        </div>
      </PreviewSection>
    )
  }

  if (block.type === 'tips') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-3 text-lg font-black text-white">Helpful Tips</h2>
        <div className="space-y-2">
          {(content.items || []).map((tip, index) => (
            <div key={`${tip}-${index}`} className="flex items-start gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-4 py-2.5 text-sm text-yellow-100" style={textStyle}>
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" /> {tip}
            </div>
          ))}
        </div>
      </PreviewSection>
    )
  }

  if (block.type === 'resources') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-3 text-lg font-black text-white">Resources</h2>
        <ul className="space-y-1.5">
          {(content.items || []).map((url, index) => (
            <li key={`${url}-${index}`}>
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
                <BookOpen className="h-3.5 w-3.5 shrink-0" /> {url}
              </a>
            </li>
          ))}
        </ul>
      </PreviewSection>
    )
  }

  if (block.type === 'notes') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        <h2 className="mb-2 text-lg font-black text-white">Notes</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm leading-6 text-slate-300" style={textStyle}>{content.text}</div>
      </PreviewSection>
    )
  }

  if (block.type === 'image') {
    return (
      <PreviewSection wrapStyle={wrapStyle} textStyle={textStyle}>
        {content.url ? (
          <figure>
            <img src={content.url} alt={content.caption} className="mx-auto rounded-xl" style={{ width: `${content.width || 80}%` }} />
            {content.caption && <figcaption className="mt-2 text-center text-xs text-slate-500">{content.caption}</figcaption>}
          </figure>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-12 text-sm text-slate-500">No image URL set</div>
        )}
      </PreviewSection>
    )
  }

  return null
}

function PreviewSection({ children, className = '', style: extraStyle = {}, wrapStyle = {}, textStyle = {} }) {
  return (
    <section className={className} style={{ ...wrapStyle, ...textStyle, ...extraStyle }}>
      {children}
    </section>
  )
}

export function LabPreviewCompleteButton({ isComplete = false, onClick }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={isComplete}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-5 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-default disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isComplete ? 'Completed' : 'Mark as Complete'}
      </button>
    </div>
  )
}
