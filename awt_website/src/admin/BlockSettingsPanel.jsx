/**
 * BlockSettingsPanel
 * Shared premium right-panel for Lecture Builder & Lab Builder.
 * Framer / Webflow / Builder.io style.
 *
 * Props (Lecture Builder):
 *   block        – current content_block object  { id, type, content, settings }
 *   onPatch      – (path, value) => void   e.g. ('content.text', 'Hello')
 *   onUpdate     – (nextBlock) => void
 *   onDelete     – () => void
 *   onDuplicate  – () => void
 *   onImageUpload– (file) => void
 *   builderType  – 'lecture' | 'lab'
 *
 * Props (Lab Builder):
 *   block        – lab block { id, type, label, content, settings }
 *   onContent    – (field, value) => void
 *   onSettings   – (field, value) => void
 *   onLabel      – (value) => void
 *   onDelete     – () => void
 *   onDuplicate  – () => void
 *   builderType  – 'lab'
 */

import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  BookOpenCheck,
  Braces,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Hammer,
  Image,
  Info,
  Italic,
  Lightbulb,
  ListChecks,
  Lock,
  Monitor,
  Plus,
  RotateCcw,
  Settings2,
  Smartphone,
  Sparkles,
  Tablet,
  TerminalSquare,
  Trash2,
  Type,
  Underline,
  Unlock,
  X,
  Zap
} from 'lucide-react'
import { useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL']
const FONT_FAMILIES = ['Inter', 'Roboto', 'Poppins', 'Fira Code', 'JetBrains Mono', 'Georgia', 'system-ui']
const FONT_SIZES = [10, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72]
const FONT_WEIGHTS = [
  { label: 'Light 300', value: 300 },
  { label: 'Regular 400', value: 400 },
  { label: 'Medium 500', value: 500 },
  { label: 'Semi Bold 600', value: 600 },
  { label: 'Bold 700', value: 700 },
  { label: 'Extra Bold 800', value: 800 },
  { label: 'Black 900', value: 900 }
]
const ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'zoom', label: 'Zoom In' }
]
const ANIMATION_DURATIONS = [
  { value: 'fast', label: 'Fast (200ms)' },
  { value: 'normal', label: 'Normal (400ms)' },
  { value: 'slow', label: 'Slow (700ms)' }
]
const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'X-Large' }
]
const BG_PRESETS = [
  { value: 'transparent', label: 'Default', color: 'transparent', border: '#334155' },
  { value: '#f8fafc', label: 'Light', color: '#f8fafc', border: '#e2e8f0' },
  { value: '#0f172a', label: 'Dark', color: '#0f172a', border: '#1e293b' },
  { value: '#ecfdf5', label: 'Accent', color: '#ecfdf5', border: '#6ee7b7' },
  { value: 'gradient-cyan', label: 'Gradient', color: 'linear-gradient(135deg,#0ea5e9,#6366f1)', border: '#0ea5e9' }
]
const ICON_OPTIONS = [
  'Info', 'Sparkles', 'AlertTriangle', 'BadgeCheck', 'BookOpen',
  'CircleHelp', 'Braces', 'Star', 'Flame', 'Zap', 'Heart', 'Award',
  'Lightbulb', 'Target', 'Shield', 'Rocket', 'Globe', 'Lock', 'Eye', 'Code2'
]
const TABS = ['Content', 'Style', 'Advanced']

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BlockSettingsPanel({
  block,
  // lecture builder
  onPatch,
  onUpdate,
  onImageUpload,
  // lab builder
  onContent,
  onSettings: onSettingsProp,
  onLabel,
  // shared
  onDelete,
  onDuplicate,
  onReset,
  builderType = 'lecture'
}) {
  const [tab, setTab] = useState('Content')
  const [hidden, setHidden] = useState(false)
  const [locked, setLocked] = useState(false)
  const [visibility, setVisibility] = useState({ desktop: true, tablet: true, mobile: true })

  if (!block) return <PanelEmpty />

  const c = block.content || {}
  const s = block.settings || {}

  // Unified patch helpers
  function pc(key, value) {
    if (builderType === 'lecture') onPatch?.(`content.${key}`, value)
    else onContent?.(key, value)
  }
  function ps(key, value) {
    if (builderType === 'lecture') onPatch?.(`settings.${key}`, value)
    else onSettingsProp?.(key, value)
  }
  function patchFull(path, value) {
    onPatch?.(path, value)
  }

  const blockName = block.label || block.type || 'Component'
  const blockColor = getBlockColor(block.type)

  return (
    <div className="flex h-full flex-col bg-[#0b111d]">
      {/* ── Panel Header ── */}
      <div className="border-b border-slate-800/80 bg-[#0d1525] px-4 py-3">
        {/* Block identity */}
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${blockColor}22`, color: blockColor }}
          >
            <BlockIcon type={block.type} size={15} />
          </span>
          <div className="min-w-0 flex-1">
            {builderType === 'lab' && onLabel ? (
              <input
                className="h-6 w-full rounded border border-transparent bg-transparent px-1 text-xs font-black text-white outline-none hover:border-slate-700 focus:border-cyan-400 focus:bg-slate-950"
                value={blockName}
                onChange={(e) => onLabel(e.target.value)}
              />
            ) : (
              <p className="text-xs font-black text-white">{blockName}</p>
            )}
            <p className="text-[9px] font-mono text-slate-500">{block.type}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setHidden((v) => !v)} title={hidden ? 'Show' : 'Hide'} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white">
              {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={() => setLocked((v) => !v)} title={locked ? 'Unlock' : 'Lock'} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white">
              {locked ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-2 text-[11px] font-bold transition',
                tab === t
                  ? 'bg-gradient-to-b from-cyan-400/20 to-cyan-400/5 text-cyan-300 shadow-inner'
                  : 'text-slate-500 hover:text-slate-300'
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="builder-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {tab === 'Content' && (
          <ContentTab
            block={block}
            c={c}
            pc={pc}
            patchFull={patchFull}
            onUpdate={onUpdate}
            onImageUpload={onImageUpload}
            builderType={builderType}
          />
        )}
        {tab === 'Style' && (
          <StyleTab s={s} ps={ps} blockType={block.type} />
        )}
        {tab === 'Advanced' && (
          <AdvancedTab
            block={block}
            hidden={hidden}
            locked={locked}
            visibility={visibility}
            onHide={() => setHidden((v) => !v)}
            onLock={() => setLocked((v) => !v)}
            onVisibility={(key) => setVisibility((prev) => ({ ...prev, [key]: !prev[key] }))}
          />
        )}
      </div>

      {/* ── Bottom Actions ── */}
      <div className="border-t border-slate-800/80 bg-[#0d1525] px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/60 py-2.5 text-[10px] font-bold text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/60 py-2.5 text-[10px] font-bold text-slate-400 transition hover:border-amber-400/50 hover:text-amber-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-col items-center gap-1 rounded-xl border border-red-400/20 bg-red-400/5 py-2.5 text-[10px] font-bold text-red-400/70 transition hover:border-red-400/50 hover:bg-red-400/10 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Content Tab ──────────────────────────────────────────────────────────────

function ContentTab({ block, c, pc, patchFull, onUpdate, onImageUpload, builderType }) {
  const type = block.type

  // Heading
  if (type === 'heading') return (
    <div className="space-y-4">
      <Section title="Text">
        <input className={input()} value={c.text || ''} onChange={(e) => pc('text', e.target.value)} placeholder="Heading text" />
      </Section>
      <Section title="Heading Level">
        <div className="grid grid-cols-4 gap-1.5">
          {['h1','h2','h3','h4','h5'].map((level) => (
            <button key={level} type="button" onClick={() => pc('level', level)}
              className={pill(c.level === level)}>
              {level.toUpperCase()}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Color">
        <ColorRow label="Text" value={c.color || '#ffffff'} onChange={(v) => pc('color', v)} />
      </Section>
      <Section title="Alignment">
        <AlignButtons value={c.alignment || 'left'} onChange={(v) => pc('alignment', v)} />
      </Section>
    </div>
  )

  // Paragraph
  if (type === 'paragraph') return (
    <div className="space-y-4">
      <Section title="Rich Text Editor">
        <div className="mb-2 flex flex-wrap gap-1">
          {[['Bold','bold',Bold],['Italic','italic',Italic],['Underline','underline',Underline]].map(([label, cmd, Icon]) => (
            <button key={cmd} type="button" title={label}
              onClick={() => patchFull?.('content.html', `<${cmd === 'bold' ? 'strong' : cmd === 'italic' ? 'em' : 'u'}>${c.html || ''}</${cmd === 'bold' ? 'strong' : cmd === 'italic' ? 'em' : 'u'}>`)}
              className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-400 hover:text-white">
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <button type="button" onClick={() => patchFull?.('content.html', `<ul><li>${c.html || 'Item'}</li></ul>`)} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-cyan-400">List</button>
          <button type="button" onClick={() => patchFull?.('content.html', `<a href="#">${c.html || 'Link'}</a>`)} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-cyan-400">Link</button>
        </div>
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => pc('html', e.currentTarget.innerHTML)}
          className="min-h-28 rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs leading-6 text-slate-100 outline-none focus:border-cyan-400"
          dangerouslySetInnerHTML={{ __html: c.html || '' }}
        />
      </Section>
    </div>
  )

  // Boxes (note-box, info-box, warning-box, success-box, callout)
  if (['note-box','info-box','warning-box','success-box','callout'].includes(type)) return (
    <div className="space-y-4">
      <Section title="Title">
        <input className={input()} value={c.title || ''} onChange={(e) => pc('title', e.target.value)} placeholder="Box title" />
      </Section>
      <Section title="Description">
        <textarea className={textarea()} value={c.description || ''} onChange={(e) => pc('description', e.target.value)} placeholder="Box description" />
      </Section>
      <IconSection icon={c.icon || 'Info'} color={c.color || '#38bdf8'} onChange={pc} />
    </div>
  )

  // Code block (lecture)
  if (type === 'code-block') return (
    <div className="space-y-4">
      <Section title="Language">
        <select className={input()} value={c.language || 'HTML'} onChange={(e) => pc('language', e.target.value)}>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </Section>
      <Section title="File Name">
        <input className={input()} value={c.fileName || ''} onChange={(e) => pc('fileName', e.target.value)} placeholder="index.html" />
      </Section>
      <Section title="Code">
        <textarea className={`${textarea()} min-h-44 font-mono text-[11px]`} value={c.code || ''} onChange={(e) => pc('code', e.target.value)} spellCheck={false} placeholder="Write code here" />
      </Section>
      <Section title="CSS (for live preview)">
        <textarea className={`${textarea()} min-h-20 font-mono text-[11px]`} value={c.css || ''} onChange={(e) => pc('css', e.target.value)} spellCheck={false} placeholder="Optional styles" />
      </Section>
      <Section title="Options">
        {[
          ['Show Line Numbers', 'lineNumbers'],
          ['Copy Button', 'copyButton'],
          ['Live Preview', 'liveOutput'],
          ['Show File Name', 'showFileName']
        ].map(([label, key]) => (
          <ToggleRow key={key} label={label} value={c[key] !== false} onChange={(v) => pc(key, v)} />
        ))}
      </Section>
      <Section title="Theme">
        <div className="grid grid-cols-2 gap-2">
          {['Dark','Light'].map((t) => (
            <button key={t} type="button" onClick={() => pc('theme', t.toLowerCase())}
              className={pill(c.theme === t.toLowerCase() || (!c.theme && t === 'Dark'))}>
              {t}
            </button>
          ))}
        </div>
      </Section>
      <button type="button" onClick={() => navigator.clipboard.writeText(c.code || '')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400">
        <Copy className="h-3.5 w-3.5" /> Copy Code
      </button>
    </div>
  )

  // Lab code block
  if (type === 'code') return (
    <div className="space-y-4">
      <Section title="Language">
        <select className={input()} value={c.language || 'HTML'} onChange={(e) => pc('language', e.target.value)}>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </Section>
      <Section title="Code">
        <textarea className={`${textarea()} min-h-44 font-mono text-[11px]`} value={c.code || ''} onChange={(e) => pc('code', e.target.value)} spellCheck={false} placeholder="Write code here" />
      </Section>
      <Section title="CSS (live preview)">
        <textarea className={`${textarea()} min-h-20 font-mono text-[11px]`} value={c.css || ''} onChange={(e) => pc('css', e.target.value)} spellCheck={false} />
      </Section>
      <Section title="Options">
        <ToggleRow label="Live Preview" value={c.liveOutput !== false} onChange={(v) => pc('liveOutput', v)} />
      </Section>
      <button type="button" onClick={() => navigator.clipboard.writeText(c.code || '')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400">
        <Copy className="h-3.5 w-3.5" /> Copy Code
      </button>
    </div>
  )

  // Quiz
  if (type === 'quiz') return (
    <div className="space-y-4">
      <Section title="Question">
        <input className={input()} value={c.question || ''} onChange={(e) => pc('question', e.target.value)} placeholder="Quiz question?" />
      </Section>
      <Section title="Options">
        {(c.options || []).map((opt, i) => (
          <div key={i} className="mb-1.5 flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[9px] font-black text-slate-400">{String.fromCharCode(65+i)}</span>
            <input className={input()} value={opt} onChange={(e) => pc('options', c.options.map((o, j) => j === i ? e.target.value : o))} placeholder={`Option ${i+1}`} />
          </div>
        ))}
      </Section>
      <Section title="Correct Answer">
        <select className={input()} value={c.correctAnswer || ''} onChange={(e) => pc('correctAnswer', e.target.value)}>
          {(c.options || []).map((opt, i) => <option key={i} value={opt}>{opt || `Option ${i+1}`}</option>)}
        </select>
      </Section>
      <Section title="Explanation">
        <textarea className={textarea()} value={c.explanation || ''} onChange={(e) => pc('explanation', e.target.value)} placeholder="Explain the correct answer" />
      </Section>
    </div>
  )

  // Image
  if (type === 'image') return (
    <div className="space-y-4">
      {onImageUpload && (
        <Section title="Upload Image">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-950 py-4 text-xs font-semibold text-slate-400 hover:border-cyan-400 hover:text-cyan-300">
            <Image className="h-4 w-4" />
            Click to upload
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload(e.target.files?.[0])} />
          </label>
        </Section>
      )}
      <Section title="Image URL">
        <input className={input()} value={c.url || ''} onChange={(e) => pc('url', e.target.value)} placeholder="https://…" />
      </Section>
      <Section title="Alt Text">
        <input className={input()} value={c.alt || ''} onChange={(e) => pc('alt', e.target.value)} placeholder="Describe the image" />
      </Section>
      <Section title="Caption">
        <input className={input()} value={c.caption || ''} onChange={(e) => pc('caption', e.target.value)} placeholder="Image caption" />
      </Section>
      <Section title="Width">
        <input type="range" min="20" max="100" value={c.width || 80} onChange={(e) => pc('width', Number(e.target.value))} className="w-full accent-cyan-400" />
        <p className="mt-1 text-right text-[10px] text-slate-500">{c.width || 80}%</p>
      </Section>
      <Section title="Alignment">
        <AlignButtons value={c.alignment || 'center'} onChange={(v) => pc('alignment', v)} />
      </Section>
    </div>
  )

  // Summary / output / notes / objective
  if (['summary','output','notes','objective'].includes(type)) return (
    <div className="space-y-4">
      <Section title="Content">
        <textarea className={`${textarea()} min-h-28`} value={c.text || c.html || ''} onChange={(e) => pc(c.text !== undefined ? 'text' : 'html', e.target.value)} placeholder="Write content here" />
      </Section>
    </div>
  )

  // Outcomes / tools / steps / tips / resources
  if (['outcomes','tools','steps','tips','resources'].includes(type)) return (
    <div className="space-y-4">
      <Section title="Items">
        {(c.items || []).map((item, i) => (
          <div key={i} className="mb-1.5 flex items-center gap-2">
            {['steps'].includes(type) && <span className="w-4 shrink-0 text-center text-[10px] font-black text-slate-500">{i+1}</span>}
            <input className={input()} value={item} onChange={(e) => pc('items', c.items.map((v, j) => j === i ? e.target.value : v))} placeholder="Add item…" />
            <button type="button" onClick={() => pc('items', c.items.filter((_, j) => j !== i))} className="shrink-0 text-slate-600 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => pc('items', [...(c.items || []), ''])} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 py-2 text-[10px] font-bold text-slate-500 hover:border-cyan-400/50 hover:text-cyan-300">
          <Plus className="h-3 w-3" /> Add item
        </button>
      </Section>
    </div>
  )

  // Errors
  if (type === 'errors') return (
    <div className="space-y-3">
      {(c.items || []).map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-slate-500">Error {i+1}</span>
            <button type="button" onClick={() => pc('items', c.items.filter((_,j) => j !== i))} className="text-red-400/50 hover:text-red-300"><X className="h-3 w-3" /></button>
          </div>
          {[['error','Error message','text-red-400'],['cause','Why it happens','text-amber-400'],['solution','How to fix it','text-emerald-400']].map(([field, ph, col]) => (
            <div key={field}>
              <p className={`mb-1 text-[9px] font-black uppercase ${col}`}>{field}</p>
              <input className={input()} value={item[field] || ''} onChange={(e) => pc('items', c.items.map((it, j) => j === i ? {...it,[field]:e.target.value} : it))} placeholder={ph} />
            </div>
          ))}
        </div>
      ))}
      <button type="button" onClick={() => pc('items', [...(c.items||[]), {error:'',cause:'',solution:''}])} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 py-2 text-[10px] font-bold text-slate-500 hover:border-red-400/40 hover:text-red-300">
        <Plus className="h-3 w-3" /> Add Error
      </button>
    </div>
  )

  // Video
  if (type === 'video') return (
    <div className="space-y-4">
      <Section title="Video URL"><input className={input()} value={c.url || ''} onChange={(e) => pc('url', e.target.value)} placeholder="YouTube or Vimeo URL" /></Section>
      <Section title="Caption"><input className={input()} value={c.caption || ''} onChange={(e) => pc('caption', e.target.value)} placeholder="Caption" /></Section>
    </div>
  )

  // Resource list
  if (type === 'resource-list') return (
    <div className="space-y-3">
      <Section title="Resources">
        {(c.resources || []).map((r, i) => (
          <div key={i} className="mb-1.5 flex items-center gap-2">
            <input className={input()} value={r} onChange={(e) => pc('resources', c.resources.map((v,j) => j===i ? e.target.value : v))} placeholder="https://…" />
            <button type="button" onClick={() => pc('resources', c.resources.filter((_,j) => j !== i))} className="text-slate-600 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => pc('resources', [...(c.resources||[]),''])} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 py-2 text-[10px] font-bold text-slate-500 hover:border-cyan-400/50 hover:text-cyan-300">
          <Plus className="h-3 w-3" /> Add Resource
        </button>
      </Section>
    </div>
  )

  // Table
  if (type === 'table') return (
    <div className="space-y-3">
      <Section title="Table Data">
        {(c.rows || []).map((row, ri) => (
          <div key={ri} className="mb-1 flex gap-1">
            {row.map((cell, ci) => (
              <input key={ci} className="h-7 flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-2 text-[10px] text-slate-100 outline-none focus:border-cyan-400"
                value={cell} onChange={(e) => pc('rows', c.rows.map((r,ri2) => ri2===ri ? r.map((c2,ci2) => ci2===ci ? e.target.value : c2) : r))} />
            ))}
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" onClick={() => pc('rows', [...(c.rows||[]),Array((c.rows?.[0]?.length)||2).fill('')])} className="flex-1 rounded-lg border border-slate-700 py-1.5 text-[10px] font-bold text-slate-400 hover:border-cyan-400">+ Row</button>
          <button type="button" onClick={() => pc('rows', (c.rows||[]).map(r=>[...r,'']))} className="flex-1 rounded-lg border border-slate-700 py-1.5 text-[10px] font-bold text-slate-400 hover:border-cyan-400">+ Col</button>
        </div>
      </Section>
    </div>
  )

  // Solved activity
  if (type === 'solved-activity') return <SolvedActivityContent c={c} pc={pc} />

  // Graded task
  if (type === 'graded-task') return <GradedTaskContent c={c} pc={pc} />

  // Assignment
  if (type === 'assignment') return (
    <div className="space-y-4">
      <Section title="Title"><input className={input()} value={c.title||''} onChange={(e) => pc('title', e.target.value)} /></Section>
      <Section title="Description"><textarea className={textarea()} value={c.description||''} onChange={(e) => pc('description', e.target.value)} /></Section>
    </div>
  )

  // Divider — no content settings
  if (type === 'divider') return <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-center text-xs text-slate-500">Divider has no content settings. Use Style tab.</div>

  // Fallback JSON editor
  return (
    <div className="space-y-3">
      <Section title="Component JSON">
        <textarea
          className={`${textarea()} min-h-40 font-mono text-[10px]`}
          defaultValue={JSON.stringify(c, null, 2)}
          onBlur={(e) => { try { onUpdate?.({...block, content: JSON.parse(e.target.value)}) } catch {} }}
        />
      </Section>
    </div>
  )
}

// ─── Style Tab ────────────────────────────────────────────────────────────────

function StyleTab({ s, ps, blockType }) {
  return (
    <div className="space-y-5">
      {/* Typography */}
      <CollapsibleSection title="Typography" icon={<Type className="h-3.5 w-3.5" />} defaultOpen>
        <div className="space-y-3">
          <div>
            <FieldLabel>Font Family</FieldLabel>
            <select className={input()} value={s.fontFamily || 'Inter'} onChange={(e) => ps('fontFamily', e.target.value)}>
              {FONT_FAMILIES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Size (px)</FieldLabel>
              <select className={input()} value={s.fontSize || 16} onChange={(e) => ps('fontSize', Number(e.target.value))}>
                {FONT_SIZES.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Weight</FieldLabel>
              <select className={input()} value={s.fontWeight || 400} onChange={(e) => ps('fontWeight', Number(e.target.value))}>
                {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Line Height</FieldLabel>
              <input className={input()} type="number" step="0.1" value={s.lineHeight || 1.5} onChange={(e) => ps('lineHeight', Number(e.target.value))} />
            </div>
            <div>
              <FieldLabel>Letter Spacing</FieldLabel>
              <input className={input()} type="number" step="0.01" value={s.letterSpacing || 0} onChange={(e) => ps('letterSpacing', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <FieldLabel>Alignment</FieldLabel>
            <AlignButtons value={s.alignment || 'left'} onChange={(v) => ps('alignment', v)} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Colors */}
      <CollapsibleSection title="Colors" icon={<Zap className="h-3.5 w-3.5" />} defaultOpen>
        <div className="space-y-3">
          <ColorRow label="Text Color" value={s.color || '#e2e8f0'} onChange={(v) => ps('color', v)} />
          <ColorRow label="Border Color" value={s.borderColor || '#334155'} onChange={(v) => ps('borderColor', v)} />
          <div>
            <FieldLabel>Background</FieldLabel>
            <div className="mb-2 flex gap-1.5">
              {BG_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => ps('backgroundColor', preset.value)}
                  className="h-7 w-7 rounded-lg border-2 transition hover:scale-110"
                  style={{
                    background: preset.color.startsWith('linear') ? preset.color : preset.color,
                    borderColor: s.backgroundColor === preset.value ? '#22d3ee' : preset.border
                  }}
                />
              ))}
            </div>
            <input className={input()} type="color"
              value={s.backgroundColor === 'transparent' || s.backgroundColor?.startsWith('gradient') ? '#0f172a' : s.backgroundColor || '#0f172a'}
              onChange={(e) => ps('backgroundColor', e.target.value)} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Spacing */}
      <CollapsibleSection title="Spacing" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Margin</FieldLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {[['Top','marginTop'],['Right','marginRight'],['Bottom','marginBottom'],['Left','marginLeft']].map(([label, key]) => (
                <div key={key}>
                  <p className="mb-1 text-center text-[9px] text-slate-500">{label}</p>
                  <input className="h-7 w-full rounded-lg border border-slate-700 bg-slate-950 px-1 text-center text-[10px] text-slate-100 outline-none focus:border-cyan-400" type="number" value={s[key] ?? s.margin ?? 0} onChange={(e) => ps(key, Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Padding</FieldLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {[['Top','paddingTop'],['Right','paddingRight'],['Bottom','paddingBottom'],['Left','paddingLeft']].map(([label, key]) => (
                <div key={key}>
                  <p className="mb-1 text-center text-[9px] text-slate-500">{label}</p>
                  <input className="h-7 w-full rounded-lg border border-slate-700 bg-slate-950 px-1 text-center text-[10px] text-slate-100 outline-none focus:border-cyan-400" type="number" value={s[key] ?? s.padding ?? 0} onChange={(e) => ps(key, Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Width & Border */}
      <CollapsibleSection title="Size & Border">
        <div className="space-y-3">
          <div>
            <FieldLabel>Width</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {[['Auto','auto'],['Full','100%'],['Custom','custom']].map(([label, val]) => (
                <button key={val} type="button" onClick={() => ps('width', val)} className={pill(s.width === val)}>{label}</button>
              ))}
            </div>
            {s.width === 'custom' && (
              <input className={`${input()} mt-2`} value={s.customWidth || '50%'} onChange={(e) => ps('customWidth', e.target.value)} placeholder="e.g. 50% or 400px" />
            )}
          </div>
          <div>
            <FieldLabel>Border Radius</FieldLabel>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="50" value={s.borderRadius ?? 8} onChange={(e) => ps('borderRadius', Number(e.target.value))} className="flex-1 accent-cyan-400" />
              <span className="w-10 text-right text-[10px] text-slate-400">{s.borderRadius ?? 8}px</span>
            </div>
          </div>
          <div>
            <FieldLabel>Border Width</FieldLabel>
            <input className={input()} type="number" min="0" max="10" value={s.borderWidth ?? 1} onChange={(e) => ps('borderWidth', Number(e.target.value))} />
          </div>
          <div>
            <FieldLabel>Shadow</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {SHADOW_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => ps('shadow', opt.value)} className={pill(s.shadow === opt.value)}>{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Animation */}
      <CollapsibleSection title="Animation" icon={<Zap className="h-3.5 w-3.5 text-violet-400" />}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Type</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {ANIMATIONS.map((a) => (
                <button key={a.value} type="button" onClick={() => ps('animation', a.value)} className={pill(s.animation === a.value)}>{a.label}</button>
              ))}
            </div>
          </div>
          {s.animation && s.animation !== 'none' && (
            <div>
              <FieldLabel>Duration</FieldLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {ANIMATION_DURATIONS.map((d) => (
                  <button key={d.value} type="button" onClick={() => ps('animationDuration', d.value)} className={pill(s.animationDuration === d.value)}>{d.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  )
}

// ─── Advanced Tab ─────────────────────────────────────────────────────────────

function AdvancedTab({ block, hidden, locked, visibility, onHide, onLock, onVisibility }) {
  return (
    <div className="space-y-5">
      {/* Component ID */}
      <CollapsibleSection title="Component ID" defaultOpen>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
          <p className="font-mono text-[10px] text-cyan-300 break-all">{block.id}</p>
        </div>
        <p className="mt-1 text-[9px] text-slate-500">Auto-generated unique identifier</p>
      </CollapsibleSection>

      {/* Custom CSS Class */}
      <CollapsibleSection title="Custom CSS Class">
        <input className={input()} placeholder="e.g. my-custom-block" />
      </CollapsibleSection>

      {/* Visibility */}
      <CollapsibleSection title="Visibility" icon={<Eye className="h-3.5 w-3.5" />} defaultOpen>
        <div className="space-y-2">
          {[
            ['Desktop', 'desktop', Monitor],
            ['Tablet', 'tablet', Tablet],
            ['Mobile', 'mobile', Smartphone]
          ].map(([label, key, Icon]) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                {label}
              </div>
              <button
                type="button"
                onClick={() => onVisibility(key)}
                className={['h-5 w-9 rounded-full transition-colors', visibility[key] ? 'bg-cyan-500' : 'bg-slate-700'].join(' ')}
              >
                <span className={['block h-4 w-4 translate-y-0 rounded-full bg-white shadow transition-transform', visibility[key] ? 'translate-x-4' : 'translate-x-0.5'].join(' ')} />
              </button>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Controls */}
      <CollapsibleSection title="Controls" defaultOpen>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
            <span className="text-xs text-slate-300">Hide Component</span>
            <button type="button" onClick={onHide} className={['h-5 w-9 rounded-full transition-colors', hidden ? 'bg-amber-500' : 'bg-slate-700'].join(' ')}>
              <span className={['block h-4 w-4 rounded-full bg-white shadow transition-transform', hidden ? 'translate-x-4' : 'translate-x-0.5'].join(' ')} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
            <span className="text-xs text-slate-300">Lock Component</span>
            <button type="button" onClick={onLock} className={['h-5 w-9 rounded-full transition-colors', locked ? 'bg-violet-500' : 'bg-slate-700'].join(' ')}>
              <span className={['block h-4 w-4 rounded-full bg-white shadow transition-transform', locked ? 'translate-x-4' : 'translate-x-0.5'].join(' ')} />
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Block type info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-3">
        <p className="text-[9px] font-black uppercase text-slate-500">Block Type</p>
        <p className="mt-1 font-mono text-xs text-emerald-300">{block.type}</p>
      </div>
    </div>
  )
}

// ─── Solved Activity Content ──────────────────────────────────────────────────

function SolvedActivityContent({ c, pc }) {
  const DIFFICULTIES = ['Beginner','Intermediate','Advanced']
  const LANGUAGES = ['HTML','CSS','JavaScript','React','Node.js','TypeScript','SQL']
  return (
    <div className="space-y-4">
      <Section title="Activity Info">
        <div className="grid grid-cols-2 gap-2">
          <div><FieldLabel>Title</FieldLabel><input className={input()} value={c.title||''} onChange={(e)=>pc('title',e.target.value)} /></div>
          <div><FieldLabel>CLO</FieldLabel><input className={input()} value={c.clo||''} onChange={(e)=>pc('clo',e.target.value)} placeholder="CLO-1" /></div>
          <div><FieldLabel>Time (min)</FieldLabel><input className={input()} type="number" value={c.time||''} onChange={(e)=>pc('time',e.target.value)} /></div>
          <div><FieldLabel>Difficulty</FieldLabel>
            <select className={input()} value={c.difficulty||'Beginner'} onChange={(e)=>pc('difficulty',e.target.value)}>
              {DIFFICULTIES.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <FieldLabel>Objective</FieldLabel>
        <textarea className={textarea()} value={c.objective||''} onChange={(e)=>pc('objective',e.target.value)} />
      </Section>
      <Section title="Instructions">
        {(c.instructions||[]).map((step,i)=>(
          <div key={i} className="mb-1.5 flex items-center gap-2">
            <span className="w-4 text-center text-[10px] font-black text-slate-500">{i+1}</span>
            <input className={input()} value={step} onChange={(e)=>pc('instructions',c.instructions.map((v,j)=>j===i?e.target.value:v))} />
            <button type="button" onClick={()=>pc('instructions',c.instructions.filter((_,j)=>j!==i))} className="text-slate-600 hover:text-red-300"><X className="h-3 w-3"/></button>
          </div>
        ))}
        <button type="button" onClick={()=>pc('instructions',[...(c.instructions||[]),''])} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 py-2 text-[10px] font-bold text-slate-500 hover:border-cyan-400/50 hover:text-cyan-300">
          <Plus className="h-3 w-3"/> Add Step
        </button>
      </Section>
      <Section title="Code Example">
        <select className={`${input()} mb-2`} value={c.language||'HTML'} onChange={(e)=>pc('language',e.target.value)}>
          {LANGUAGES.map(l=><option key={l}>{l}</option>)}
        </select>
        <textarea className={`${textarea()} min-h-32 font-mono text-[11px]`} value={c.code||''} onChange={(e)=>pc('code',e.target.value)} spellCheck={false}/>
      </Section>
      <Section title="Output & Result">
        <FieldLabel>Output</FieldLabel>
        <textarea className={textarea()} value={c.output||''} onChange={(e)=>pc('output',e.target.value)} />
        <FieldLabel>Expected Result</FieldLabel>
        <textarea className={textarea()} value={c.expectedResult||''} onChange={(e)=>pc('expectedResult',e.target.value)} />
      </Section>
    </div>
  )
}

// ─── Graded Task Content ──────────────────────────────────────────────────────

function GradedTaskContent({ c, pc }) {
  return (
    <div className="space-y-4">
      <Section title="Task Info">
        <div className="grid grid-cols-2 gap-2">
          <div><FieldLabel>Title</FieldLabel><input className={input()} value={c.title||''} onChange={(e)=>pc('title',e.target.value)} /></div>
          <div><FieldLabel>Marks</FieldLabel><input className={input()} type="number" value={c.marks||''} onChange={(e)=>pc('marks',e.target.value)} /></div>
        </div>
      </Section>
      <Section title="Problem Statement">
        <textarea className={textarea()} value={c.problem||''} onChange={(e)=>pc('problem',e.target.value)} />
      </Section>
      <Section title="Requirements">
        {(c.requirements||[]).map((req,i)=>(
          <div key={i} className="mb-1.5 flex items-center gap-2">
            <input className={input()} value={req} onChange={(e)=>pc('requirements',c.requirements.map((v,j)=>j===i?e.target.value:v))} />
            <button type="button" onClick={()=>pc('requirements',c.requirements.filter((_,j)=>j!==i))} className="text-slate-600 hover:text-red-300"><X className="h-3 w-3"/></button>
          </div>
        ))}
        <button type="button" onClick={()=>pc('requirements',[...(c.requirements||[]),''])} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 py-2 text-[10px] font-bold text-slate-500 hover:border-cyan-400/50 hover:text-cyan-300">
          <Plus className="h-3 w-3"/> Add Requirement
        </button>
      </Section>
      <Section title="Submission Instructions">
        <textarea className={textarea()} value={c.submission||''} onChange={(e)=>pc('submission',e.target.value)} />
      </Section>
    </div>
  )
}

// ─── Icon Section ─────────────────────────────────────────────────────────────

function IconSection({ icon, color, onChange }) {
  return (
    <Section title="Icon Settings">
      <FieldLabel>Icon</FieldLabel>
      <div className="mb-3 grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto pr-1">
        {ICON_OPTIONS.map((name) => (
          <button key={name} type="button" onClick={() => onChange('icon', name)}
            className={['flex h-9 w-full items-center justify-center rounded-lg border text-[9px] font-semibold transition', icon === name ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500'].join(' ')}
          >{name.slice(0,5)}</button>
        ))}
      </div>
      <ColorRow label="Icon Color" value={color || '#38bdf8'} onChange={(v) => onChange('color', v)} />
    </Section>
  )
}

// ─── Reusable UI primitives ───────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      {title && <FieldLabel>{title}</FieldLabel>}
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CollapsibleSection({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-slate-800/30"
      >
        <div className="flex items-center gap-2 text-[11px] font-black text-slate-300">
          {icon && <span className="text-slate-500">{icon}</span>}
          {title}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>
      {open && <div className="border-t border-slate-800/60 p-3 space-y-3">{children}</div>}
    </div>
  )
}

function FieldLabel({ children }) {
  return <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">{children}</p>
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500">{value}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0 outline-none" />
      </div>
    </div>
  )
}

function AlignButtons({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([val, Icon]) => (
        <button key={val} type="button" onClick={() => onChange(val)}
          className={['flex h-8 w-8 items-center justify-center rounded-lg border transition', value === val ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-white'].join(' ')}>
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
      <span className="text-xs text-slate-300">{label}</span>
      <button type="button" onClick={() => onChange(!value)} className={['h-5 w-9 rounded-full transition-colors', value ? 'bg-cyan-500' : 'bg-slate-700'].join(' ')}>
        <span className={['block h-4 w-4 rounded-full bg-white shadow transition-transform', value ? 'translate-x-4' : 'translate-x-0.5'].join(' ')} />
      </button>
    </div>
  )
}

function PanelEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#0b111d] p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
        <Settings2 className="h-5 w-5 text-slate-600" />
      </div>
      <p className="mt-4 text-xs font-black text-slate-500">No Component Selected</p>
      <p className="mt-2 text-[10px] leading-5 text-slate-600">Click any block on the canvas to edit its content, style, and advanced settings here.</p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function input() {
  return 'h-9 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/10'
}

function textarea() {
  return 'min-h-24 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/10'
}

function pill(active) {
  return [
    'rounded-lg border py-1.5 text-[10px] font-bold transition',
    active
      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
      : 'border-slate-700 bg-slate-900/40 text-slate-500 hover:border-slate-500 hover:text-white'
  ].join(' ')
}

function getBlockColor(type) {
  const map = {
    heading: '#3b82f6', paragraph: '#22c55e', 'info-box': '#06b6d4',
    'note-box': '#a855f7', 'warning-box': '#f59e0b', 'success-box': '#22c55e',
    'code-block': '#0ea5e9', code: '#0ea5e9', quiz: '#eab308',
    summary: '#a855f7', image: '#ec4899', video: '#f43f5e',
    objective: '#22d3ee', outcomes: '#34d399', tools: '#a78bfa',
    'solved-activity': '#f59e0b', 'graded-task': '#fb923c',
    steps: '#38bdf8', output: '#6366f1', errors: '#f59e0b',
    tips: '#facc15', resources: '#a78bfa', notes: '#64748b'
  }
  return map[type] || '#38bdf8'
}

function BlockIcon({ type, size = 14 }) {
  const icons = {
    heading: Type, paragraph: Type, 'info-box': Info,
    'note-box': Sparkles, 'warning-box': AlertTriangle,
    'success-box': BookOpenCheck, 'code-block': Braces,
    code: Code2, quiz: BookOpen, image: Image,
    objective: FlaskConical, outcomes: BookOpenCheck,
    tools: Hammer, 'solved-activity': BookOpen,
    'graded-task': FileText, steps: ListChecks,
    output: TerminalSquare, errors: AlertTriangle,
    tips: Lightbulb, resources: BookOpen, notes: FileText
  }
  const Icon = icons[type] || Settings2
  return <Icon style={{ width: size, height: size }} />
}
