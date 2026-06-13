import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  BookOpenCheck,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  GripVertical,
  Hammer,
  Image,
  Layers,
  Lightbulb,
  ListChecks,
  MoreVertical,
  Plus,
  Search,
  Send,
  Settings2,
  TerminalSquare,
  Trash2,
  X,
  Zap
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LabPreview from '../components/LabPreview.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useToast } from '../hooks/useToast.js'
import { fetchLabForEdit, labToFormValues, saveLab } from '../lib/adminRepository.js'
import { slugify } from '../lib/slugify.js'
import { TextInput } from './AdminShell.jsx'
import BlockSettingsPanel from './BlockSettingsPanel.jsx'

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
const CATEGORIES = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'General']
const LANGUAGES = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL']

const COMPONENT_LIBRARY = [
  {
    group: 'Lab Structure',
    color: '#22d3ee',
    items: [
      { type: 'objective', name: 'Objective', icon: FlaskConical, desc: 'Lab goal and purpose', color: '#22d3ee' },
      { type: 'outcomes', name: 'Activity Outcomes', icon: BookOpenCheck, desc: 'Learning outcomes list', color: '#34d399' },
      { type: 'tools', name: 'Required Tools', icon: Hammer, desc: 'Tools students need', color: '#a78bfa' },
    ]
  },
  {
    group: 'Activities',
    color: '#f59e0b',
    items: [
      { type: 'solved-activity', name: 'Solved Activity', icon: BookOpen, desc: 'Step-by-step solved task', color: '#f59e0b' },
      { type: 'graded-task', name: 'Graded Task', icon: FileText, desc: 'Task with marks', color: '#fb923c' },
      { type: 'steps', name: 'Step List', icon: ListChecks, desc: 'Numbered instructions', color: '#38bdf8' },
    ]
  },
  {
    group: 'Developer',
    color: '#38bdf8',
    items: [
      { type: 'code', name: 'Code Block', icon: Code2, desc: 'Syntax highlighted code', color: '#0ea5e9' },
      { type: 'output', name: 'Output Preview', icon: TerminalSquare, desc: 'Expected output', color: '#6366f1' },
    ]
  },
  {
    group: 'Support',
    color: '#f59e0b',
    items: [
      { type: 'errors', name: 'Common Errors', icon: AlertTriangle, desc: 'Error + cause + fix', color: '#f59e0b' },
      { type: 'tips', name: 'Helpful Tips', icon: Lightbulb, desc: 'Pro tips and hints', color: '#facc15' },
      { type: 'resources', name: 'Resources', icon: BookOpen, desc: 'Links and references', color: '#a78bfa' },
      { type: 'notes', name: 'Notes', icon: FileText, desc: 'Instructor notes', color: '#64748b' },
    ]
  },
  {
    group: 'Media',
    color: '#ec4899',
    items: [
      { type: 'image', name: 'Image', icon: Image, desc: 'Screenshot or diagram', color: '#ec4899' },
    ]
  }
]

const ALL_COMPONENTS = COMPONENT_LIBRARY.flatMap((g) => g.items)

const SETTINGS_TABS = ['Content', 'Style', 'Advanced']

// ─── Block Factory ────────────────────────────────────────────────────────────

function createLabBlock(type, overrideContent = null) {
  const def = ALL_COMPONENTS.find((c) => c.type === type) || ALL_COMPONENTS[0]
  const defaults = {
    objective: { text: 'Write the lab objective here.' },
    outcomes: { items: ['Understand the concept', 'Apply the skill', 'Build the feature'] },
    tools: { items: ['VS Code', 'Browser', 'Node.js'] },
    'solved-activity': {
      title: 'Solved Activity 1',
      objective: 'Describe what this activity demonstrates.',
      time: '15',
      difficulty: 'Beginner',
      clo: 'CLO-1',
      instructions: ['Open your editor', 'Create the required files', 'Write the code'],
      code: '<!-- Add code example here -->',
      language: 'HTML',
      output: 'Describe the expected output.',
      expectedResult: 'The page renders correctly with no errors.',
      css: ''
    },
    'graded-task': {
      title: 'Graded Task',
      problem: 'Describe the problem statement.',
      requirements: ['Requirement 1', 'Requirement 2'],
      marks: '10',
      submission: 'Submit via LMS before the deadline.'
    },
    steps: { items: ['Step 1: Open your editor', 'Step 2: Create required files', 'Step 3: Write the code'] },
    code: { language: 'HTML', code: '<!-- Add code here -->', css: '', liveOutput: true },
    output: { text: 'Describe what students should see.' },
    errors: { items: [{ error: 'Error message', cause: 'Why it happens', solution: 'How to fix it' }] },
    tips: { items: ['Complete one step at a time', 'Use DevTools to debug'] },
    resources: { items: ['https://developer.mozilla.org'] },
    notes: { text: 'Add instructor notes here.' },
    image: { url: '', caption: 'Image caption', width: 80 }
  }
  return {
    id: crypto.randomUUID(),
    type,
    label: def.name,
    collapsed: false,
    settings: { fontSize: 16, color: '#e2e8f0', backgroundColor: 'transparent', padding: 16, margin: 16, animation: 'none' },
    content: overrideContent ?? (defaults[type] || { text: '' })
  }
}

function createStarterBlocks() {
  return [
    createLabBlock('objective', { text: 'Practice the core concept in a guided hands-on lab.' }),
    createLabBlock('tools', { items: ['VS Code', 'Web Browser', 'Node.js'] }),
    createLabBlock('steps', { items: ['Create the required project files', 'Write the starter code', 'Run the output in browser', 'Compare your result with the preview'] }),
    createLabBlock('code', { language: 'HTML', code: '<h1>AWT Lab</h1>\n<p>Build and test your solution.</p>', css: 'body { font-family: Arial, sans-serif; padding: 24px; }\\nh1 { color: #0ea5e9; }', liveOutput: true }),
    createLabBlock('output', { text: 'The page should render the lab heading and paragraph clearly in the browser.' }),
    createLabBlock('tips', { items: ['Complete one step at a time', 'Use browser DevTools if the output is not correct'] })
  ]
}

// ─── Compile to saveLab shape ─────────────────────────────────────────────────

function compileBlocks(blocks) {
  const get = (type, field) => {
    const b = blocks.find((x) => x.type === type)
    if (!b) return ''
    if (field === 'items') return (b.content.items || []).join('\n')
    return b.content[field] || ''
  }

  const codeBlocks = blocks.filter((b) => b.type === 'code')
  const code = codeBlocks.map((b) => `/* ${b.content.language || 'Code'} */\n${b.content.code || ''}`).join('\n\n')

  const stepBlocks = blocks.filter((b) => b.type === 'steps')
  const steps = stepBlocks.map((b) => (b.content.items || []).join('\n')).join('\n')

  const errorItems = blocks.filter((b) => b.type === 'errors').flatMap((b) => (b.content.items || []).map((e) => `${e.error} — ${e.cause} — ${e.solution}`))

  const tipItems = blocks.filter((b) => b.type === 'tips').flatMap((b) => b.content.items || [])
  const resourceItems = blocks.filter((b) => b.type === 'resources').flatMap((b) => b.content.items || [])

  const solvedActivities = blocks.filter((b) => b.type === 'solved-activity')
  const gradedTasks = blocks.filter((b) => b.type === 'graded-task')

  const solvedText = solvedActivities.map((b) => {
    const c = b.content
    return `=== ${c.title || 'Solved Activity'} ===\nObjective: ${c.objective || ''}\nTime: ${c.time || ''} min | Difficulty: ${c.difficulty || ''} | CLO: ${c.clo || ''}\nInstructions:\n${(c.instructions || []).join('\n')}\nCode (${c.language || 'HTML'}):\n${c.code || ''}\nOutput: ${c.output || ''}\nExpected Result: ${c.expectedResult || ''}`
  }).join('\n\n')

  const gradedText = gradedTasks.map((b) => {
    const c = b.content
    return `=== ${c.title || 'Graded Task'} ===\nProblem: ${c.problem || ''}\nRequirements:\n${(c.requirements || []).join('\n')}\nMarks: ${c.marks || ''}\nSubmission: ${c.submission || ''}`
  }).join('\n\n')

  const outcomeBlock = blocks.find((b) => b.type === 'outcomes')
  const toolBlock = blocks.find((b) => b.type === 'tools')
  const outputBlock = blocks.find((b) => b.type === 'output')
  const notesBlock = blocks.find((b) => b.type === 'notes')

  return {
    objective: get('objective', 'text') + (solvedText ? `\n\n${solvedText}` : '') + (gradedText ? `\n\n${gradedText}` : ''),
    required_tools: (toolBlock?.content?.items || []).join('\n'),
    steps: steps || (outcomeBlock?.content?.items || []).join('\n'),
    code_examples: code,
    output_preview: outputBlock?.content?.text || '',
    common_errors: errorItems.join('\n'),
    tips: [...tipItems, ...resourceItems, ...(notesBlock ? [notesBlock.content.text] : [])].join('\n')
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

function createDefaultMeta() {
  return {
    title: 'New Practical Lab',
    lab_number: '1',
    slug: '',
    category: 'HTML',
    difficulty: 'Beginner',
    estimated_time: '60',
    status: 'Draft',
    short_description: 'A guided lab with objective, tools, steps, code example, output preview, and helpful tips.',
    is_published: false,
    settings: {
      backgroundColor: 'transparent',
      color: '',
      fontFamily: '',
      fontSize: null,
      fontWeight: null,
      borderRadius: null,
      borderWidth: null,
      borderColor: '',
      shadow: 'none',
      animation: 'none'
    }
  }
}

export default function LabFormPage({ mode = 'add' }) {
  const { id } = useParams()
  const isEdit = mode === 'edit'
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [meta, setMeta] = useState(createDefaultMeta)
  const [blocks, setBlocks] = useState(() => [])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [clearDialog, setClearDialog] = useState(false)
  const [dragOverId, setDragOverId] = useState(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null

  // ── Load for edit ──
  useEffect(() => {
    let ignore = false
    setIsLoading(isEdit)
    setMeta(createDefaultMeta())
    setBlocks([])
    setSelectedId(null)
    if (!isEdit) return () => { ignore = true }
    async function load() {
      try {
        const lab = await fetchLabForEdit(id)
        if (ignore || !lab || lab.id !== id) return
        const v = labToFormValues(lab)
        setMeta({
          title: v.title,
          lab_number: v.lab_number,
          slug: v.slug,
          category: lab.category || 'HTML',
          difficulty: lab.difficulty || 'Beginner',
          estimated_time: lab.estimated_time || '60',
          status: v.is_published ? 'Published' : 'Draft',
          short_description: lab.short_description || '',
          is_published: v.is_published
        })
        const savedBlocks = Array.isArray(lab.content_blocks) ? lab.content_blocks : []
        const rebuilt = savedBlocks.length ? savedBlocks : [
          v.objective ? createLabBlock('objective', { text: v.objective }) : null,
          v.required_tools ? createLabBlock('tools', { items: v.required_tools.split('\n').filter(Boolean) }) : null,
          v.steps ? createLabBlock('steps', { items: v.steps.split('\n').filter(Boolean) }) : null,
          v.code_examples ? createLabBlock('code', { language: 'HTML', code: v.code_examples, css: '', liveOutput: false }) : null,
          v.output_preview ? createLabBlock('output', { text: v.output_preview }) : null,
          v.common_errors ? createLabBlock('errors', { items: v.common_errors.split('\n').filter(Boolean).map((e) => { const parts = e.split(' — '); return { error: parts[0] || e, cause: parts[1] || '', solution: parts[2] || '' } }) }) : null,
          v.tips ? createLabBlock('tips', { items: v.tips.split('\n').filter(Boolean) }) : null
        ].filter(Boolean)
        setBlocks(rebuilt.length ? rebuilt : [])
      } catch (err) {
        if (!ignore) showToast(err.message, 'error')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [id, isEdit, showToast])

  // ── Meta helpers ──
  function updateMeta(field, value) {
    setMeta((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !isEdit) next.slug = slugify(value)
      if (field === 'status') next.is_published = value === 'Published'
      return next
    })
  }

  // ── Block helpers ──
  function addBlock(type) {
    const block = createLabBlock(type)
    setBlocks((prev) => [...prev, block])
    setSelectedId(block.id)
  }

  function updateBlock(blockId, patch) {
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, ...patch } : b))
  }

  function patchContent(blockId, field, value) {
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, content: { ...b.content, [field]: value } } : b))
  }

  function patchSettings(blockId, field, value) {
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, settings: { ...b.settings, [field]: value } } : b))
  }

  function deleteBlock(blockId) {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    setSelectedId((cur) => cur === blockId ? null : cur)
  }

  function duplicateBlock(block) {
    const clone = { ...block, id: crypto.randomUUID(), label: `${block.label} Copy` }
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === block.id)
      const next = [...prev]
      next.splice(idx + 1, 0, clone)
      return next
    })
    setSelectedId(clone.id)
  }

  function moveBlock(blockId, dir) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId)
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function moveBlockTo(sourceId, targetId) {
    if (!sourceId || sourceId === targetId) return
    setBlocks((prev) => {
      const si = prev.findIndex((b) => b.id === sourceId)
      const ti = prev.findIndex((b) => b.id === targetId)
      if (si === -1 || ti === -1) return prev
      const next = [...prev]
      const [item] = next.splice(si, 1)
      next.splice(ti, 0, item)
      return next
    })
  }

  function toggleCollapse(blockId) {
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, collapsed: !b.collapsed } : b))
  }

  // ── Drop on canvas ──
  function handleCanvasDrop(event) {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/awt-lab-type')
    if (type) addBlock(type)
    setDragOverId(null)
  }

  // ── Save ──
  async function handleSave(publishOverride) {
    const pub = publishOverride !== undefined ? publishOverride : meta.is_published
    setIsSaving(true)
    try {
      const title = (meta.title || 'Untitled Lab').trim()
      const compiled = compileBlocks(blocks)
      const payload = {
        ...compiled,
        id: isEdit ? id : undefined,
        title,
        slug: meta.slug || slugify(title),
        lab_number: Number(meta.lab_number) || 0,
        content_blocks: blocks,
        is_published: pub
      }
      await saveLab(payload)
      showToast(isEdit ? 'Lab saved.' : 'Lab created.')
      navigate('/admin/labs')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Filtered library ──
  const filteredLibrary = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COMPONENT_LIBRARY
    return COMPONENT_LIBRARY.map((g) => ({
      ...g,
      items: g.items.filter((item) => item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q))
    })).filter((g) => g.items.length > 0)
  }, [search])

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#050716]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-400">Loading Lab Builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#050714] text-slate-100">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-[#070b1a]/95 px-3 py-2 shadow-2xl shadow-black/30 backdrop-blur sm:gap-4 sm:px-4 lg:h-14 lg:flex-nowrap lg:py-0 xl:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/admin/labs"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-cyan-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FlaskConical className="hidden h-4 w-4 shrink-0 text-cyan-400 sm:block" />
              <span className="truncate text-sm font-black text-white">
                {meta.lab_number ? `Lab ${meta.lab_number} — ` : ''}{meta.title || 'Untitled Lab'}
              </span>
              <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black text-cyan-300 lg:inline">
                VISUAL BUILDER
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {isEdit ? `Editing Lab ${meta.lab_number}` : 'New Lab'} · {blocks.length} blocks
            </p>
          </div>
        </div>

        {/* Center */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 px-4 md:flex">
          <span className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-emerald-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Auto saved
          </span>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 transition hover:border-cyan-400 lg:hidden"
            aria-label="Open component library"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Components</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 transition hover:border-cyan-400 lg:hidden"
            aria-label="Open component settings"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Settings</span>
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 transition hover:border-cyan-400"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Preview</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="hidden h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-50 md:inline-flex"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="hidden h-9 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50 md:inline-flex"
          >
            <Send className="h-3.5 w-3.5" />
            {isSaving ? 'Saving…' : <span className="hidden sm:inline">Publish Lab</span>}
          </button>
          <details className="relative md:hidden">
            <summary className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg bg-emerald-400 text-slate-950">
              <MoreVertical className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl">
              <button type="button" disabled={isSaving} onClick={() => handleSave(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-200 hover:bg-slate-900">
                <Bookmark className="h-4 w-4" /> Save Draft
              </button>
              <button type="button" disabled={isSaving} onClick={() => handleSave(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-emerald-300 hover:bg-slate-900">
                <Send className="h-4 w-4" /> Publish
              </button>
            </div>
          </details>
        </div>
      </header>

      {/* ── 3-COLUMN WORKSPACE ── */}
      {(isLibraryOpen || isSettingsOpen) && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
          aria-label="Close builder panels"
          onClick={() => { setIsLibraryOpen(false); setIsSettingsOpen(false) }}
        />
      )}
      <div className="grid h-[calc(100vh-7.25rem)] min-h-0 sm:h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* ════ LEFT PANEL — Component Library ════ */}
        <aside className={['builder-scrollbar fixed bottom-0 left-0 top-0 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] min-h-0 flex-col overflow-y-auto border-r border-slate-800 bg-[#0b1020] transition-transform lg:static lg:z-auto lg:w-auto lg:translate-x-0', isLibraryOpen ? 'translate-x-0' : '-translate-x-full'].join(' ')}>
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-slate-800 bg-[#0b1020] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-white">Component Library</h2>
                <p className="text-[10px] text-slate-500">{ALL_COMPONENTS.length} blocks available</p>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-600" />
                <button type="button" onClick={() => setIsLibraryOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden" aria-label="Close component library">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search components…"
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 text-xs text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Basic Info card shortcut */}
          <div className="p-4 pb-0">
            <button
              type="button"
              onClick={() => setSelectedId('__meta__')}
              className={[
                'w-full rounded-xl border px-3 py-2.5 text-left transition',
                selectedId === '__meta__'
                  ? 'border-cyan-400/50 bg-cyan-400/10 ring-1 ring-cyan-400/20'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20">
                  <Settings2 className="h-3.5 w-3.5 text-emerald-300" />
                </span>
                <div>
                  <p className="text-xs font-black text-white">Basic Information</p>
                  <p className="text-[10px] text-slate-500">Lab meta · category · status</p>
                </div>
              </div>
            </button>
          </div>

          {/* Groups */}
          <div className="space-y-1 p-4">
            {filteredLibrary.map((group) => (
              <div key={group.group} className="mb-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{group.group}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/awt-lab-type', item.type)}
                      onClick={() => addBlock(item.type)}
                      title={item.desc}
                      className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-2 py-3 text-center text-[10px] font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:bg-slate-800"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition group-hover:scale-110"
                        style={{ backgroundColor: `${item.color}22`, color: item.color }}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="leading-tight">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="m-4 mt-0 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="text-[10px] font-black text-cyan-300">💡 Pro Tip</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">Drag blocks onto the canvas or click to add. Select a block to edit in the settings panel.</p>
          </div>
        </aside>

        {/* ════ CENTER — Lab Builder Canvas ════ */}
        <main className="builder-scrollbar min-h-0 overflow-y-auto bg-[#080d18]">
          {/* Canvas header */}
          <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-800/60 bg-[#080d18]/95 px-3 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-black text-white">Lab Builder Canvas</h2>
              <p className="text-[10px] text-slate-500">Drag · Reorder · Edit · Preview</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setClearDialog(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-400/10 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-400/20"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
              <button
                type="button"
                onClick={() => addBlock('steps')}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                <Plus className="h-3 w-3" />
                Add Block
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="min-h-[calc(100vh-11rem)] p-3 sm:min-h-[calc(100vh-8rem)] sm:p-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            {/* Basic Info Card — always shown at top */}
            <MetaCard meta={meta} onUpdate={updateMeta} isSelected={selectedId === '__meta__'} onSelect={() => setSelectedId('__meta__')} />

            {/* Block list */}
            <div className="mt-4 space-y-3">
              {blocks.length === 0 ? (
                <EmptyCanvas />
              ) : (
                blocks.map((block, index) => (
                  <CanvasBlock
                    key={block.id}
                    block={block}
                    index={index}
                    total={blocks.length}
                    isSelected={selectedId === block.id}
                    isDragOver={dragOverId === block.id}
                    onSelect={() => setSelectedId(block.id)}
                    onToggleCollapse={() => toggleCollapse(block.id)}
                    onMove={(dir) => moveBlock(block.id, dir)}
                    onDuplicate={() => duplicateBlock(block)}
                    onDelete={() => deleteBlock(block.id)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId(block.id) }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      const sourceId = e.dataTransfer.getData('application/awt-lab-move')
                      if (sourceId) moveBlockTo(sourceId, block.id)
                      setDragOverId(null)
                    }}
                    onDragStart={(e) => e.dataTransfer.setData('application/awt-lab-move', block.id)}
                    onContentChange={(field, value) => patchContent(block.id, field, value)}
                  />
                ))
              )}
            </div>

            {/* Add more */}
            <button
              type="button"
              onClick={() => addBlock('steps')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-4 text-xs font-bold text-slate-500 transition hover:border-cyan-400/50 hover:text-cyan-300"
            >
              <Plus className="h-4 w-4" />
              Drop a component here or click to add
            </button>
          </div>
        </main>

        {/* ════ RIGHT PANEL — Settings ════ */}
        <aside className={['builder-scrollbar fixed bottom-0 right-0 top-0 z-50 w-[min(24rem,calc(100vw-1.5rem))] min-h-0 overflow-y-auto border-l border-slate-800 bg-[#0b111d] transition-transform lg:static lg:z-auto lg:w-auto lg:translate-x-0', isSettingsOpen ? 'translate-x-0' : 'translate-x-full'].join(' ')}>
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-[#0b111d] px-4 py-3 lg:hidden">
            <h2 className="text-sm font-black text-white">Component Settings</h2>
            <button type="button" onClick={() => setIsSettingsOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white" aria-label="Close component settings">
              <X className="h-4 w-4" />
            </button>
          </div>
          {selectedId === '__meta__' ? (
            <BlockSettingsPanel
              block={{ id: '__meta__', type: 'meta', label: 'Basic Information', content: meta, settings: meta.settings || {} }}
              builderType="lab"
              onContent={(field, value) => updateMeta(field, value)}
              onSettings={(field, value) => updateMeta('settings', { ...(meta.settings || {}), [field]: value })}
              onLabel={() => {}}
              onDelete={() => {}}
              onDuplicate={() => {}}
              onReset={() => updateMeta('settings', {})}
              metaSlot={<MetaSettings meta={meta} onUpdate={updateMeta} />}
            />
          ) : (
            <BlockSettingsPanel
              block={selectedBlock}
              builderType="lab"
              onContent={(field, value) => selectedBlock && patchContent(selectedBlock.id, field, value)}
              onSettings={(field, value) => selectedBlock && patchSettings(selectedBlock.id, field, value)}
              onLabel={(v) => selectedBlock && updateBlock(selectedBlock.id, { label: v })}
              onDelete={() => selectedBlock && deleteBlock(selectedBlock.id)}
              onDuplicate={() => selectedBlock && duplicateBlock(selectedBlock)}
              onReset={() => selectedBlock && setBlocks((prev) => prev.map((b) => b.id === selectedBlock.id ? createLabBlock(selectedBlock.type) : b))}
            />
          )}
        </aside>
      </div>

      {/* ── Preview Overlay ── */}
      <button type="button" onClick={() => setIsLibraryOpen(true)} className="fixed bottom-5 right-5 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-2xl shadow-cyan-400/20 lg:hidden" aria-label="Add component">
        <Plus className="h-5 w-5" />
      </button>

      {isPreviewOpen && (
        <LabPreview lab={{ meta, blocks }} onClose={() => setIsPreviewOpen(false)} />
      )}

      <ConfirmDialog
        isOpen={clearDialog}
        title="Clear all blocks?"
        message="This removes every block from the canvas. You cannot undo this."
        confirmLabel="Clear All"
        tone="warning"
        onCancel={() => setClearDialog(false)}
        onConfirm={() => { setBlocks([]); setSelectedId(null); setClearDialog(false) }}
      />
    </div>
  )
}

// ─── Meta Card (top of canvas) ────────────────────────────────────────────────

function MetaCard({ meta, onUpdate, isSelected, onSelect }) {
  const s = meta.settings || {}
  const cardStyle = buildBlockStyle(s, isSelected)
  const textStyle = buildTextStyle(s)

  return (
    <div
      onClick={onSelect}
      className={[
        'cursor-pointer rounded-2xl border p-5 transition',
        isSelected ? 'ring-2 ring-cyan-400/10' : 'hover:border-slate-600'
      ].join(' ')}
      style={{ ...cardStyle, borderColor: isSelected ? '#22d3ee80' : (s.borderColor || '#1e293b') }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20">
            <Settings2 className="h-4 w-4 text-emerald-300" />
          </span>
          <div>
            <p className="text-xs font-black text-white">Basic Information</p>
            <p className="text-[10px] text-slate-500">Click the settings panel to edit</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={[
            'rounded-full px-2 py-0.5 text-[10px] font-black',
            meta.status === 'Published'
              ? 'bg-emerald-400/20 text-emerald-300'
              : 'bg-slate-700 text-slate-400'
          ].join(' ')}>
            {meta.status}
          </span>
        </div>
      </div>

      {/* Inline editable fields — always visible */}
      <div className="mt-4 grid grid-cols-[80px_1fr] gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          value={meta.lab_number}
          onChange={(e) => onUpdate('lab_number', e.target.value)}
          type="number"
          placeholder="Lab #"
          className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-center text-sm font-black text-white outline-none focus:border-cyan-400"
        />
        <input
          value={meta.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Lab Title — e.g. HTML Document Structure"
          className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Category', value: meta.category },
          { label: 'Difficulty', value: meta.difficulty },
          { label: 'Est. Time', value: meta.estimated_time ? `${meta.estimated_time} min` : '—' },
          { label: 'Status', value: meta.status }
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-700/50 bg-slate-950/50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
            <p className="mt-0.5 text-xs font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>
      {meta.short_description && (
        <p className="mt-3 text-xs leading-5" style={{ color: textStyle.color || '#94a3b8' }}>{meta.short_description}</p>
      )}
    </div>
  )
}

// ─── Build inline style from block.settings ───────────────────────────────────

function buildBlockStyle(s = {}, isSelected = false) {
  const style = {}

  // Background
  if (s.backgroundColor && s.backgroundColor !== 'transparent') {
    if (s.backgroundColor.startsWith('gradient-')) {
      const gradients = {
        'gradient-cyan': 'linear-gradient(135deg, #0ea5e9, #6366f1)'
      }
      style.background = gradients[s.backgroundColor] || '#0f172a'
    } else {
      style.background = s.backgroundColor
    }
  } else if (isSelected) {
    style.background = 'linear-gradient(135deg, #0e1a2e 0%, #09121f 100%)'
  } else {
    style.background = 'rgba(15,23,42,0.5)'
  }

  // Border
  if (s.borderColor) style.borderColor = s.borderColor
  if (s.borderWidth !== undefined) style.borderWidth = `${s.borderWidth}px`
  if (s.borderRadius !== undefined) style.borderRadius = `${s.borderRadius}px`

  // Spacing
  if (s.marginTop !== undefined) style.marginTop = `${s.marginTop}px`
  if (s.marginBottom !== undefined) style.marginBottom = `${s.marginBottom}px`
  if (s.marginLeft !== undefined) style.marginLeft = `${s.marginLeft}px`
  if (s.marginRight !== undefined) style.marginRight = `${s.marginRight}px`
  if (s.paddingTop !== undefined) style.paddingTop = `${s.paddingTop}px`
  if (s.paddingBottom !== undefined) style.paddingBottom = `${s.paddingBottom}px`
  if (s.paddingLeft !== undefined) style.paddingLeft = `${s.paddingLeft}px`
  if (s.paddingRight !== undefined) style.paddingRight = `${s.paddingRight}px`

  // Shadow
  const shadows = {
    sm: '0 1px 4px rgba(0,0,0,0.3)',
    md: '0 4px 12px rgba(0,0,0,0.4)',
    lg: '0 8px 24px rgba(0,0,0,0.5)',
    xl: '0 16px 40px rgba(0,0,0,0.6)'
  }
  if (s.shadow && s.shadow !== 'none') style.boxShadow = shadows[s.shadow] || 'none'

  // Width
  if (s.width && s.width !== 'auto') {
    style.width = s.width === '100%' ? '100%' : s.customWidth || 'auto'
  }

  // Animation
  if (s.animation && s.animation !== 'none') {
    const durations = { fast: '200ms', normal: '400ms', slow: '700ms' }
    const dur = durations[s.animationDuration] || '400ms'
    const keyframes = {
      fade: `fadeIn ${dur} ease`,
      'slide-up': `slideUp ${dur} ease`,
      'slide-left': `slideLeft ${dur} ease`,
      zoom: `zoomIn ${dur} ease`
    }
    style.animation = keyframes[s.animation] || 'none'
  }

  return style
}

// ─── Build text style from block.settings ────────────────────────────────────

function buildTextStyle(s = {}) {
  const style = {}
  if (s.color) style.color = s.color
  if (s.fontFamily) style.fontFamily = s.fontFamily
  if (s.fontSize) style.fontSize = `${s.fontSize}px`
  if (s.fontWeight) style.fontWeight = s.fontWeight
  if (s.lineHeight) style.lineHeight = s.lineHeight
  if (s.letterSpacing) style.letterSpacing = `${s.letterSpacing}em`
  if (s.alignment) style.textAlign = s.alignment
  return style
}

// ─── Canvas Block ─────────────────────────────────────────────────────────────

function CanvasBlock({
  block, index, total, isSelected, isDragOver,
  onSelect, onToggleCollapse, onMove, onDuplicate, onDelete,
  onDragOver, onDragLeave, onDrop, onDragStart, onContentChange
}) {
  const def = ALL_COMPONENTS.find((c) => c.type === block.type) || ALL_COMPONENTS[0]
  const s = block.settings || {}

  // Build inline style from settings
  const blockStyle = buildBlockStyle(s, isSelected)

  return (
    <article
      onClick={onSelect}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        'group rounded-2xl border transition',
        isSelected
          ? 'border-cyan-400/60 shadow-lg shadow-cyan-400/5'
          : isDragOver
          ? 'border-violet-400/60'
          : 'border-slate-800 hover:border-slate-700',
      ].join(' ')}
      style={blockStyle}
    >
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Drag handle */}
        <span
          draggable
          onDragStart={onDragStart}
          className="cursor-grab rounded-lg p-1 text-slate-700 transition hover:bg-slate-800 hover:text-slate-400 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </span>

        {/* Icon + label */}
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${def.color}22`, color: def.color }}
        >
          <def.icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-black text-white">{block.label}</span>

        {/* Block index badge */}
        <span className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
          {index + 1}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-20">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-20">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDuplicate} className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} className="rounded-md p-1 text-red-400/60 hover:bg-red-400/10 hover:text-red-300">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onToggleCollapse} className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white">
            {block.collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Block content editor */}
      {!block.collapsed && (
        <div
          className="border-t border-slate-800/60 px-4 pb-4 pt-3"
          style={buildTextStyle(s)}
          onClick={(e) => e.stopPropagation()}
        >
          <InlineBlockEditor block={block} onChange={onContentChange} />
        </div>
      )}
    </article>
  )
}

// ─── Inline Block Editor (in canvas) ─────────────────────────────────────────

function InlineBlockEditor({ block, onChange }) {
  const c = block.content || {}
  const inputCls = 'h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400'
  const textareaCls = 'w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100 outline-none focus:border-cyan-400 resize-none'

  if (block.type === 'objective') {
    return <textarea className={`${textareaCls} min-h-20`} value={c.text || ''} onChange={(e) => onChange('text', e.target.value)} placeholder="Write the lab objective…" />
  }

  if (block.type === 'outcomes' || block.type === 'tools') {
    return <ListEditor items={c.items || []} onChange={(items) => onChange('items', items)} placeholder={block.type === 'outcomes' ? 'Add an outcome…' : 'Add a tool…'} />
  }

  if (block.type === 'steps') {
    return <ListEditor items={c.items || []} onChange={(items) => onChange('items', items)} placeholder="Add a step…" numbered />
  }

  if (block.type === 'solved-activity') {
    return <SolvedActivityEditor content={c} onChange={onChange} />
  }

  if (block.type === 'graded-task') {
    return <GradedTaskEditor content={c} onChange={onChange} />
  }

  if (block.type === 'code') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <select className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100 outline-none focus:border-cyan-400" value={c.language || 'HTML'} onChange={(e) => onChange('language', e.target.value)}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <span className="text-[10px] font-semibold text-slate-500">{(c.code || '').split('\n').length} lines</span>
        </div>
        <textarea
          className={`${textareaCls} min-h-40 font-mono text-[11px]`}
          value={c.code || ''}
          onChange={(e) => onChange('code', e.target.value)}
          placeholder="Write code here…"
          spellCheck={false}
        />
      </div>
    )
  }

  if (block.type === 'output') {
    return <textarea className={`${textareaCls} min-h-16`} value={c.text || ''} onChange={(e) => onChange('text', e.target.value)} placeholder="Describe the expected output…" />
  }

  if (block.type === 'errors') {
    return <ErrorsEditor items={c.items || []} onChange={(items) => onChange('items', items)} />
  }

  if (block.type === 'tips' || block.type === 'resources') {
    return <ListEditor items={c.items || []} onChange={(items) => onChange('items', items)} placeholder={block.type === 'tips' ? 'Add a tip…' : 'Add a resource URL…'} />
  }

  if (block.type === 'notes') {
    return <textarea className={`${textareaCls} min-h-20`} value={c.text || ''} onChange={(e) => onChange('text', e.target.value)} placeholder="Add instructor notes…" />
  }

  if (block.type === 'image') {
    return (
      <div className="space-y-2">
        <input className={inputCls} value={c.url || ''} onChange={(e) => onChange('url', e.target.value)} placeholder="Image URL or upload path" />
        <input className={inputCls} value={c.caption || ''} onChange={(e) => onChange('caption', e.target.value)} placeholder="Caption" />
      </div>
    )
  }

  return <textarea className={`${textareaCls} min-h-16`} value={JSON.stringify(c)} onChange={() => {}} readOnly />
}

// ─── Solved Activity Editor ───────────────────────────────────────────────────

function SolvedActivityEditor({ content: c, onChange }) {
  const inputCls = 'h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400'
  const textareaCls = 'w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100 outline-none focus:border-cyan-400 resize-none'

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Activity Title</Label>
          <input className={inputCls} value={c.title || ''} onChange={(e) => onChange('title', e.target.value)} placeholder="Solved Activity 1" />
        </div>
        <div>
          <Label>CLO Mapping</Label>
          <input className={inputCls} value={c.clo || ''} onChange={(e) => onChange('clo', e.target.value)} placeholder="CLO-1" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>Time (min)</Label>
          <input className={inputCls} type="number" value={c.time || ''} onChange={(e) => onChange('time', e.target.value)} placeholder="15" />
        </div>
        <div>
          <Label>Difficulty</Label>
          <select className={inputCls} value={c.difficulty || 'Beginner'} onChange={(e) => onChange('difficulty', e.target.value)}>
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <Label>Language</Label>
          <select className={inputCls} value={c.language || 'HTML'} onChange={(e) => onChange('language', e.target.value)}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label>Objective</Label>
        <textarea className={`${textareaCls} min-h-14`} value={c.objective || ''} onChange={(e) => onChange('objective', e.target.value)} placeholder="What does this activity demonstrate?" />
      </div>

      {/* Sub sections */}
      <SubSection title="Instructions" color="#22d3ee">
        <ListEditor items={c.instructions || []} onChange={(items) => onChange('instructions', items)} placeholder="Add an instruction step…" numbered />
      </SubSection>

      <SubSection title="Code Example" color="#38bdf8">
        <textarea className={`${textareaCls} min-h-32 font-mono text-[11px]`} value={c.code || ''} onChange={(e) => onChange('code', e.target.value)} placeholder="Write code here…" spellCheck={false} />
      </SubSection>

      <SubSection title="Output" color="#34d399">
        <textarea className={`${textareaCls} min-h-12`} value={c.output || ''} onChange={(e) => onChange('output', e.target.value)} placeholder="Describe the output…" />
      </SubSection>

      <SubSection title="Expected Result" color="#a78bfa">
        <textarea className={`${textareaCls} min-h-12`} value={c.expectedResult || ''} onChange={(e) => onChange('expectedResult', e.target.value)} placeholder="What students should achieve…" />
      </SubSection>
    </div>
  )
}

// ─── Graded Task Editor ───────────────────────────────────────────────────────

function GradedTaskEditor({ content: c, onChange }) {
  const inputCls = 'h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400'
  const textareaCls = 'w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100 outline-none focus:border-cyan-400 resize-none'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Task Title</Label>
          <input className={inputCls} value={c.title || ''} onChange={(e) => onChange('title', e.target.value)} placeholder="Graded Task" />
        </div>
        <div>
          <Label>Marks</Label>
          <input className={inputCls} type="number" value={c.marks || ''} onChange={(e) => onChange('marks', e.target.value)} placeholder="10" />
        </div>
      </div>
      <div>
        <Label>Problem Statement</Label>
        <textarea className={`${textareaCls} min-h-16`} value={c.problem || ''} onChange={(e) => onChange('problem', e.target.value)} placeholder="Describe the problem…" />
      </div>
      <SubSection title="Requirements" color="#fb923c">
        <ListEditor items={c.requirements || []} onChange={(items) => onChange('requirements', items)} placeholder="Add a requirement…" />
      </SubSection>
      <div>
        <Label>Submission Instructions</Label>
        <textarea className={`${textareaCls} min-h-12`} value={c.submission || ''} onChange={(e) => onChange('submission', e.target.value)} placeholder="Submit via LMS…" />
      </div>
    </div>
  )
}

// ─── Errors Editor ────────────────────────────────────────────────────────────

function ErrorsEditor({ items, onChange }) {
  const inputCls = 'h-8 flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-2 text-[11px] text-slate-100 outline-none focus:border-cyan-400'

  function update(index, field, value) {
    const next = items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    onChange(next)
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  function add() {
    onChange([...items, { error: '', cause: '', solution: '' }])
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[9px] font-black uppercase text-red-400">Error</span>
            <input className={inputCls} value={item.error} onChange={(e) => update(i, 'error', e.target.value)} placeholder="Error message" />
            <button type="button" onClick={() => remove(i)} className="shrink-0 rounded p-1 text-red-400/50 hover:text-red-300"><X className="h-3 w-3" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[9px] font-black uppercase text-amber-400">Cause</span>
            <input className={inputCls} value={item.cause} onChange={(e) => update(i, 'cause', e.target.value)} placeholder="Why it happens" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[9px] font-black uppercase text-emerald-400">Fix</span>
            <input className={inputCls} value={item.solution} onChange={(e) => update(i, 'solution', e.target.value)} placeholder="How to fix" />
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 py-2 text-[11px] font-bold text-slate-500 hover:border-red-400/40 hover:text-red-300">
        <Plus className="h-3 w-3" />
        Add Error
      </button>
    </div>
  )
}

// ─── List Editor ─────────────────────────────────────────────────────────────

function ListEditor({ items, onChange, placeholder = 'Add item…', numbered = false }) {
  function update(index, value) {
    onChange(items.map((item, i) => i === index ? value : item))
  }
  function remove(index) {
    onChange(items.filter((_, i) => i !== index))
  }
  function add() {
    onChange([...items, ''])
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {numbered && <span className="w-5 shrink-0 text-center text-[10px] font-black text-slate-500">{i + 1}.</span>}
          <input
            className="h-8 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
          />
          <button type="button" onClick={() => remove(i)} className="shrink-0 rounded p-1 text-slate-600 hover:text-red-300">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 py-2 text-[11px] font-bold text-slate-500 hover:border-cyan-400/40 hover:text-cyan-300"
      >
        <Plus className="h-3 w-3" />
        Add item
      </button>
    </div>
  )
}

// ─── SubSection ───────────────────────────────────────────────────────────────

function SubSection({ title, color, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        style={{ background: `${color}11` }}
      >
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{title}</span>
        {open ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
      </button>
      {open && <div className="bg-slate-950/30 p-3">{children}</div>}
    </div>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────

function Label({ children }) {
  return <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">{children}</p>
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyCanvas() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900">
        <Zap className="h-6 w-6 text-cyan-400" />
      </div>
      <h3 className="mt-4 text-sm font-black text-white">Start building your lab</h3>
      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
        Drag a component from the library on the left, or click any component to add it to the canvas.
      </p>
    </div>
  )
}

function EmptySettings() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 text-center">
      <Settings2 className="mx-auto h-8 w-8 text-slate-700" />
      <p className="mt-3 text-xs font-semibold text-slate-500">Select a block from the canvas to edit its settings here.</p>
    </div>
  )
}

// ─── Meta Settings (right panel) ─────────────────────────────────────────────

function MetaSettings({ meta, onUpdate }) {
  const inputCls = 'h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400'
  const textareaCls = 'w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100 outline-none focus:border-cyan-400 resize-none min-h-20'

  return (
    <div className="space-y-4">
      <div>
        <Label>Lab Number</Label>
        <input className={inputCls} type="number" value={meta.lab_number} onChange={(e) => onUpdate('lab_number', e.target.value)} placeholder="1" />
      </div>
      <div>
        <Label>Lab Title</Label>
        <input className={inputCls} value={meta.title} onChange={(e) => onUpdate('title', e.target.value)} placeholder="HTML Document Structure" />
      </div>
      <div>
        <Label>Category</Label>
        <select className={inputCls} value={meta.category} onChange={(e) => onUpdate('category', e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <Label>Difficulty</Label>
        <select className={inputCls} value={meta.difficulty} onChange={(e) => onUpdate('difficulty', e.target.value)}>
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <Label>Estimated Time (minutes)</Label>
        <input className={inputCls} type="number" value={meta.estimated_time} onChange={(e) => onUpdate('estimated_time', e.target.value)} placeholder="60" />
      </div>
      <div>
        <Label>Status</Label>
        <select className={inputCls} value={meta.status} onChange={(e) => onUpdate('status', e.target.value)}>
          <option>Draft</option>
          <option>Published</option>
        </select>
      </div>
      <div>
        <Label>Short Description</Label>
        <textarea className={textareaCls} value={meta.short_description} onChange={(e) => onUpdate('short_description', e.target.value)} placeholder="Brief description of this lab…" />
      </div>
    </div>
  )
}

// ─── Block Settings (right panel) ────────────────────────────────────────────

function BlockSettings({ block, tab, onContent, onSettings, onLabel, onDelete }) {
  const c = block.content || {}
  const s = block.settings || {}
  const inputCls = 'h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400'
  const def = ALL_COMPONENTS.find((item) => item.type === block.type) || ALL_COMPONENTS[0]

  return (
    <div className="space-y-4">
      {/* Block identity */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${def.color}22`, color: def.color }}>
          <def.icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <input
            className="h-7 w-full rounded-lg border border-transparent bg-transparent px-1 text-xs font-black text-white outline-none hover:border-slate-700 focus:border-cyan-400 focus:bg-slate-950"
            value={block.label}
            onChange={(e) => onLabel(e.target.value)}
          />
          <p className="mt-0.5 px-1 text-[9px] text-slate-500">{def.desc}</p>
        </div>
      </div>

      {tab === 'Content' && (
        <div className="space-y-3">
          {/* Objective */}
          {block.type === 'objective' && (
            <>
              <Label>Objective Text</Label>
              <textarea className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100 outline-none focus:border-cyan-400 min-h-24" value={c.text || ''} onChange={(e) => onContent('text', e.target.value)} />
            </>
          )}

          {/* Outcomes / Tools / Steps / Tips / Resources */}
          {['outcomes', 'tools', 'steps', 'tips', 'resources'].includes(block.type) && (
            <>
              <Label>Items</Label>
              <ListEditor items={c.items || []} onChange={(items) => onContent('items', items)} placeholder="Add item…" numbered={block.type === 'steps'} />
            </>
          )}

          {/* Code */}
          {block.type === 'code' && (
            <>
              <Label>Language</Label>
              <select className={inputCls} value={c.language || 'HTML'} onChange={(e) => onContent('language', e.target.value)}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
              <Label>Code</Label>
              <textarea className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[11px] text-slate-100 outline-none focus:border-cyan-400 min-h-48" value={c.code || ''} onChange={(e) => onContent('code', e.target.value)} spellCheck={false} />
              <Label>CSS (for HTML preview)</Label>
              <textarea className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[11px] text-slate-100 outline-none focus:border-cyan-400 min-h-24" value={c.css || ''} onChange={(e) => onContent('css', e.target.value)} spellCheck={false} />
              <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                Live Output Preview
                <input type="checkbox" checked={c.liveOutput !== false} onChange={(e) => onContent('liveOutput', e.target.checked)} className="h-4 w-4 accent-emerald-400" />
              </label>
              <button type="button" onClick={() => navigator.clipboard.writeText(c.code || '')} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400">
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </button>
            </>
          )}

          {/* Output / Notes */}
          {(block.type === 'output' || block.type === 'notes') && (
            <>
              <Label>Text</Label>
              <textarea className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-100 outline-none focus:border-cyan-400 min-h-24" value={c.text || ''} onChange={(e) => onContent('text', e.target.value)} />
            </>
          )}

          {/* Errors */}
          {block.type === 'errors' && (
            <ErrorsEditor items={c.items || []} onChange={(items) => onContent('items', items)} />
          )}

          {/* Solved Activity */}
          {block.type === 'solved-activity' && (
            <SolvedActivityEditor content={c} onChange={onContent} />
          )}

          {/* Graded Task */}
          {block.type === 'graded-task' && (
            <GradedTaskEditor content={c} onChange={onContent} />
          )}

          {/* Image */}
          {block.type === 'image' && (
            <>
              <Label>Image URL</Label>
              <input className={inputCls} value={c.url || ''} onChange={(e) => onContent('url', e.target.value)} placeholder="https://…" />
              <Label>Caption</Label>
              <input className={inputCls} value={c.caption || ''} onChange={(e) => onContent('caption', e.target.value)} placeholder="Image caption" />
              <Label>Width (%)</Label>
              <input className={inputCls} type="range" min="20" max="100" value={c.width || 80} onChange={(e) => onContent('width', Number(e.target.value))} />
              <p className="text-right text-[10px] text-slate-500">{c.width || 80}%</p>
            </>
          )}
        </div>
      )}

      {tab === 'Style' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Font Size (px)</Label>
              <input className={inputCls} type="number" value={s.fontSize || 16} onChange={(e) => onSettings('fontSize', Number(e.target.value))} />
            </div>
            <div>
              <Label>Text Color</Label>
              <input className={inputCls} type="color" value={s.color || '#e2e8f0'} onChange={(e) => onSettings('color', e.target.value)} />
            </div>
            <div>
              <Label>Background</Label>
              <input className={inputCls} type="color" value={s.backgroundColor === 'transparent' ? '#0f172a' : s.backgroundColor || '#0f172a'} onChange={(e) => onSettings('backgroundColor', e.target.value)} />
            </div>
            <div>
              <Label>Padding (px)</Label>
              <input className={inputCls} type="number" value={s.padding || 16} onChange={(e) => onSettings('padding', Number(e.target.value))} />
            </div>
            <div>
              <Label>Margin (px)</Label>
              <input className={inputCls} type="number" value={s.margin || 16} onChange={(e) => onSettings('margin', Number(e.target.value))} />
            </div>
            <div>
              <Label>Animation</Label>
              <select className={inputCls} value={s.animation || 'none'} onChange={(e) => onSettings('animation', e.target.value)}>
                {['none', 'fade', 'slide'].map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === 'Advanced' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[10px] text-slate-400 leading-5">
            <p className="font-black text-slate-300 mb-1">Block ID</p>
            <code className="font-mono text-cyan-300 break-all">{block.id}</code>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[10px] text-slate-400 leading-5">
            <p className="font-black text-slate-300 mb-1">Block Type</p>
            <code className="font-mono text-emerald-300">{block.type}</code>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 py-2.5 text-xs font-black text-red-300 hover:bg-red-400/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Block
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Preview Overlay ──────────────────────────────────────────────────────────
