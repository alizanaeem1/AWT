import { Check, Clipboard } from 'lucide-react'
import { useState } from 'react'
import { blockIconMap, defaultBlockTypes } from '../data/lectureBlocks.js'

const blockMetaMap = Object.fromEntries(defaultBlockTypes.map((blockType) => [blockType.type, blockType]))

function blockStyle(block) {
  const settings = block.settings || {}
  const content = block.content || {}
  const textColor = settings.color || content.color
  const alignment = settings.alignment || content.alignment

  return {
    '--block-color': textColor,
    '--block-align': alignment,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize ? `${settings.fontSize}px` : undefined,
    fontWeight: settings.fontWeight,
    color: textColor,
    backgroundColor: settings.backgroundColor === 'transparent' ? undefined : settings.backgroundColor,
    textAlign: alignment,
    marginTop: `${settings.margin ?? 16}px`,
    marginBottom: `${settings.margin ?? 16}px`,
    padding: `${settings.padding ?? 0}px`
  }
}

function CalloutBlock({ block }) {
  const Icon = blockIconMap[block.content?.icon] || blockIconMap[block.settings?.icon] || blockIconMap.Info
  const color = block.content?.color || '#38bdf8'

  return (
    <aside className="rounded-lg border bg-slate-900/70 p-4" style={{ borderColor: `${color}66` }}>
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950" style={{ color }}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-white">{block.content?.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{block.content?.description}</p>
        </div>
      </div>
    </aside>
  )
}

function CodeBlock({ block }) {
  const [copied, setCopied] = useState(false)
  const code = block.content?.code || ''

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
        <span className="text-xs font-bold uppercase text-cyan-300">{block.content?.language || 'Code'}</span>
        <button type="button" onClick={copyCode} className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:border-cyan-400">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto p-5 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
      {block.content?.language === 'HTML' && block.content?.liveOutput !== false ? (
        <div className="border-t border-slate-800 p-4">
          <style>{block.content?.css}</style>
          <div className="rounded-md bg-white p-4 text-slate-950" dangerouslySetInnerHTML={{ __html: code }} />
        </div>
      ) : null}
    </div>
  )
}

function ComponentHeader({ type, label, color = 'cyan' }) {
  const Icon = blockMetaMap[type]?.icon || blockIconMap.Info
  const colors = {
    cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
    purple: 'bg-purple-50 text-purple-600 ring-purple-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100'
  }
  const colorClass = colors[color] || colors.cyan

  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className={`text-sm font-black uppercase tracking-normal ${colorClass.split(' ')[1]}`}>
        {label || blockMetaMap[type]?.name || type}
      </p>
    </div>
  )
}

function QuizBlock({ block, style }) {
  const content = block.content || {}
  const options = content.options || []
  const [selectedOption, setSelectedOption] = useState('')

  return (
    <div style={style} className="lecture-block-preview lecture-card-preview rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
      <ComponentHeader type="quiz" label="Quiz" color="cyan" />
      <p className="text-lg font-bold leading-7 text-slate-900">{content.question}</p>
      <div className="mt-4 space-y-2.5">
        {options.map((option, index) => {
          const isSelected = selectedOption === option
          const isCorrectSelection = isSelected && option === content.correctAnswer
          const isWrongSelection = isSelected && option !== content.correctAnswer
          const letter = String.fromCharCode(65 + index)

          return (
            <button
              key={`${block.id}-${letter}`}
              type="button"
              onClick={() => setSelectedOption(option)}
              className={[
                'flex min-h-12 w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition',
                isCorrectSelection
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_0_0_1px_rgba(52,211,153,0.28)]'
                  : isWrongSelection
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/40'
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-black',
                  isCorrectSelection ? 'border-emerald-200 bg-emerald-100 text-emerald-600' : isWrongSelection ? 'border-red-200 bg-red-100 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-600'
                ].join(' ')}
              >
                {letter}
              </span>
              <span className="flex-1">{option}</span>
              {isCorrectSelection ? <Check className="h-5 w-5 text-emerald-600" /> : null}
            </button>
          )
        })}
      </div>
      {selectedOption && content.explanation ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{content.explanation}</p> : null}
    </div>
  )
}

function SimpleCardBlock({ block, style }) {
  const content = block.content || {}
  const meta = blockMetaMap[block.type]
  const colorByType = {
    summary: 'purple',
    assignment: 'amber',
    'resource-list': 'blue',
    diagram: 'cyan',
    video: 'blue'
  }
  const resources = content.resources || []

  return (
    <section style={style} className="lecture-block-preview lecture-card-preview rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
      <ComponentHeader type={block.type} label={meta?.name} color={colorByType[block.type] || 'cyan'} />
      {content.title ? <h3 className="text-lg font-black text-slate-900">{content.title}</h3> : null}
      {content.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{content.description}</p> : null}
      {content.text ? <p className="mt-2 text-sm leading-6 text-slate-700">{content.text}</p> : null}
      {resources.length ? (
        <ul className="mt-3 space-y-2">
          {resources.map((resource) => (
            <li key={resource} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-blue-700">
              {resource}
            </li>
          ))}
        </ul>
      ) : null}
      {block.type === 'video' ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{content.url || 'Video URL'}</p> : null}
    </section>
  )
}

export default function LectureBlockRenderer({ blocks = [] }) {
  return (
    <>
      {blocks.map((block) => {
        const content = block.content || {}
        const style = blockStyle(block)

        if (block.type === 'heading') {
          const Tag = content.level || 'h2'
          return <Tag key={block.id} style={style} className="lecture-block-preview scroll-mt-24 tracking-normal">{content.text}</Tag>
        }

        if (block.type === 'paragraph') {
          return <div key={block.id} style={style} className="lecture-block-preview prose prose-invert max-w-none leading-7" dangerouslySetInnerHTML={{ __html: content.html }} />
        }

        if (['note-box', 'info-box', 'warning-box', 'success-box', 'callout'].includes(block.type)) {
          return <div key={block.id} style={style} className="lecture-block-preview"><CalloutBlock block={block} /></div>
        }

        if (block.type === 'code-block') return <div key={block.id} style={style} className="lecture-block-preview"><CodeBlock block={block} /></div>

        if (block.type === 'image') {
          return (
            <figure key={block.id} style={style} className="lecture-block-preview">
              {content.url ? <img src={content.url} alt={content.caption || ''} className="mx-auto rounded-lg border border-slate-800" style={{ width: `${content.width || 80}%` }} /> : <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-500">Image preview</div>}
              <figcaption className="mt-2 text-sm text-slate-500">{content.caption}</figcaption>
            </figure>
          )
        }

        if (block.type === 'video') {
          return <SimpleCardBlock key={block.id} block={block} style={style} />
        }

        if (block.type === 'quiz') {
          return <QuizBlock key={block.id} block={block} style={style} />
        }

        if (block.type === 'table') {
          return (
            <div key={block.id} style={style} className="lecture-block-preview lecture-card-preview overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
              <ComponentHeader type="table" label="Table" color="blue" />
              <table className="w-full border-collapse text-sm">
                <tbody>{content.rows?.map((row, rowIndex) => <tr key={`${block.id}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${block.id}-${rowIndex}-${cellIndex}`} className="border border-slate-200 px-3 py-2 text-slate-700">{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )
        }

        if (block.type === 'tabs') {
          return <div key={block.id} style={style} className="lecture-block-preview lecture-card-preview rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm"><ComponentHeader type="tabs" label="Tabs" color="purple" /><div className="mb-3 flex gap-2">{content.tabs?.map((tab) => <span key={tab.label} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{tab.label}</span>)}</div><p className="text-sm text-slate-600">{content.tabs?.[0]?.content}</p></div>
        }

        if (block.type === 'accordion') {
          return <div key={block.id} style={style} className="lecture-block-preview lecture-card-preview space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm"><ComponentHeader type="accordion" label="Accordion" color="cyan" />{content.items?.map((item) => <details key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><summary className="cursor-pointer font-semibold text-slate-900">{item.title}</summary><p className="mt-3 text-sm text-slate-600">{item.content}</p></details>)}</div>
        }

        if (block.type === 'divider') return <hr key={block.id} className="my-8 border-slate-800" />

        return <SimpleCardBlock key={block.id} block={block} style={style} />
      })}
    </>
  )
}
