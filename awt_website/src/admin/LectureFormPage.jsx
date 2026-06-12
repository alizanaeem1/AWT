import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Bookmark,
  ChevronLeft,
  Copy,
  Eye,
  GripVertical,
  HelpCircle,
  Italic,
  MoreVertical,
  Plus,
  RotateCcw,
  RotateCw,
  Send,
  Trash2,
  Underline
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LecturePreview from '../components/LecturePreview.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { createBlock, defaultBlockTypes, iconOptions } from '../data/lectureBlocks.js'
import { useToast } from '../hooks/useToast.js'
import {
  createCustomComponent,
  fetchCustomComponents,
  fetchLectureForEdit,
  lectureToFormValues,
  saveLecture,
  uploadMediaFile
} from '../lib/adminRepository.js'
import { slugify } from '../lib/slugify.js'
import { TextInput, Toggle } from './AdminShell.jsx'
import BlockSettingsPanel from './BlockSettingsPanel.jsx'

const emptyLecture = lectureToFormValues()
const languages = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL']
const animations = ['none', 'fade', 'slide']
const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64]
const fontWeights = [
  { label: '300 Light', value: 300 },
  { label: '400 Regular', value: 400 },
  { label: '500 Medium', value: 500 },
  { label: '600 Semi Bold', value: 600 },
  { label: '700 Bold', value: 700 },
  { label: '800 Extra Bold', value: 800 },
  { label: '900 Black', value: 900 }
]

function createInitialLecture() {
  return {
    ...emptyLecture,
    content_blocks: [
      createBlock('heading', { content: { text: 'New Lecture Title', level: 'h1', color: '#ffffff', alignment: 'left' } }),
      createBlock('paragraph')
    ]
  }
}

export default function LectureFormPage({ mode = 'add' }) {
  const { id } = useParams()
  const isEdit = mode === 'edit'
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [formValues, setFormValues] = useState(createInitialLecture)
  const [customComponents, setCustomComponents] = useState([])
  const [selectedBlockId, setSelectedBlockId] = useState(formValues.content_blocks[0]?.id)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [componentSearch, setComponentSearch] = useState('')
  const selectedBlock = formValues.content_blocks.find((block) => block.id === selectedBlockId)

  useEffect(() => {
    let ignore = false
    const initialLecture = createInitialLecture()
    setIsLoading(isEdit)
    setFormValues(initialLecture)
    setSelectedBlockId(initialLecture.content_blocks[0]?.id)

    async function loadBuilder() {
      try {
        const [lecture, components] = await Promise.all([
          isEdit ? fetchLectureForEdit(id) : Promise.resolve(null),
          fetchCustomComponents()
        ])
        if (ignore) return
        setCustomComponents(components)
        if (lecture) {
          if (lecture.id !== id) return
          const nextValues = lectureToFormValues(lecture)
          const nextBlocks = nextValues.content_blocks?.length ? nextValues.content_blocks : createInitialLecture().content_blocks
          setFormValues({ ...nextValues, content_blocks: nextBlocks })
          setSelectedBlockId(nextBlocks[0]?.id)
        }
      } catch (error) {
        if (!ignore) showToast(error.message, 'error')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadBuilder()

    return () => {
      ignore = true
    }
  }, [id, isEdit, showToast])

  function updateField(field, value) {
    setFormValues((current) => {
      const nextValues = { ...current, [field]: value }
      if (field === 'title' && !isEdit) nextValues.slug = slugify(value)
      return nextValues
    })
  }

  function updateBlocks(updater) {
    setFormValues((current) => ({ ...current, content_blocks: updater(current.content_blocks || []) }))
  }

  function addBlock(type, template) {
    const block = template ? { ...template, id: crypto.randomUUID() } : createBlock(type)
    updateBlocks((blocks) => [...blocks, block])
    setSelectedBlockId(block.id)
  }

  function updateBlock(nextBlock) {
    updateBlocks((blocks) => blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block)))
  }

  function patchBlock(blockId, path, value) {
    const block = formValues.content_blocks.find((item) => item.id === blockId)
    if (!block) return
    const isTitleBlock = formValues.content_blocks[0]?.id === blockId && block.type === 'heading' && path === 'content.text'
    if (isTitleBlock) {
      setFormValues((current) => ({
        ...current,
        title: value,
        slug: !isEdit ? slugify(value) : current.slug,
        content_blocks: (current.content_blocks || []).map((item) => (
          item.id === blockId
            ? { ...item, content: { ...item.content, text: value } }
            : item
        ))
      }))
      return
    }
    const [section, key] = path.split('.')
    if (!key) {
      updateBlock({ ...block, [section]: value })
      return
    }
    updateBlock({
      ...block,
      [section]: {
        ...block[section],
        [key]: value
      }
    })
  }

  function deleteBlock(blockId) {
    updateBlocks((blocks) => blocks.filter((block) => block.id !== blockId))
    setSelectedBlockId(formValues.content_blocks.find((block) => block.id !== blockId)?.id)
  }

  function duplicateBlock(block) {
    const clone = { ...block, id: crypto.randomUUID(), content: { ...block.content }, settings: { ...block.settings } }
    updateBlocks((blocks) => {
      const index = blocks.findIndex((item) => item.id === block.id)
      const next = [...blocks]
      next.splice(index + 1, 0, clone)
      return next
    })
    setSelectedBlockId(clone.id)
  }

  function moveBlock(blockId, direction) {
    updateBlocks((blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      const target = index + direction
      if (target < 0 || target >= blocks.length) return blocks
      const next = [...blocks]
      const [block] = next.splice(index, 1)
      next.splice(target, 0, block)
      return next
    })
  }

  function moveBlockTo(sourceId, targetId) {
    if (!sourceId || sourceId === targetId) return
    updateBlocks((blocks) => {
      const sourceIndex = blocks.findIndex((block) => block.id === sourceId)
      const targetIndex = blocks.findIndex((block) => block.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return blocks
      const next = [...blocks]
      const [source] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, source)
      return next
    })
  }

  function handleDrop(event) {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/awt-block')
    const customId = event.dataTransfer.getData('application/awt-custom-block')
    if (customId) {
      const custom = customComponents.find((item) => item.id === customId)
      if (custom) addBlock(custom.block_type, custom.block_template)
      return
    }
    if (type) addBlock(type)
  }

  function clearBlocks() {
    updateBlocks(() => [])
    setSelectedBlockId('')
    setIsClearDialogOpen(false)
  }

  async function uploadBlockImage(blockId, file) {
    if (!blockId || !file) return
    try {
      const url = await uploadMediaFile(file, 'lecture-images')
      patchBlock(blockId, 'content.url', url)
      showToast('Image uploaded.')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function createReusableComponent() {
    const name = window.prompt('Reusable component name, e.g. Exam Tip')
    if (!name) return

    try {
      const template = createBlock('callout', {
        content: { title: name, description: 'Reusable component description.', icon: 'Sparkles', color: '#a78bfa' }
      })
      const saved = await createCustomComponent({ name, blockType: template.type, blockTemplate: template })
      setCustomComponents((current) => [...current, saved])
      showToast('Custom component created.')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function handleSave(publishedOverride = formValues.is_published) {
    setIsSaving(true)
    try {
      const titleFromBlock = formValues.content_blocks?.[0]?.type === 'heading' ? formValues.content_blocks[0]?.content?.text : ''
      const nextTitle = (formValues.title || titleFromBlock || 'Untitled Lecture').trim()
      await saveLecture({ ...formValues, title: nextTitle, slug: formValues.slug || slugify(nextTitle), is_published: publishedOverride })
      showToast(isEdit ? 'Lecture builder saved.' : 'Lecture created from builder.')
      navigate('/admin/lectures')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const libraryItems = useMemo(() => {
    const normalized = componentSearch.trim().toLowerCase()
    if (!normalized) return defaultBlockTypes
    return defaultBlockTypes.filter((item) => item.name.toLowerCase().includes(normalized))
  }, [componentSearch])
  const componentGroups = [
    { title: 'Basic Components', types: ['heading', 'paragraph', 'divider'] },
    { title: 'Content', types: ['note-box', 'info-box', 'warning-box', 'success-box'] },
    { title: 'Media', types: ['image', 'video', 'diagram'] },
    { title: 'Interactive', types: ['quiz', 'accordion', 'tabs'] },
    { title: 'Developer', types: ['code-block', 'table'] },
    { title: 'Resources', types: ['assignment', 'resource-list', 'summary'] }
  ]

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#050716] text-slate-100">
      <div className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#070b1a]/95 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur xl:px-6">
        <div className="grid grid-cols-[280px_minmax(360px,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin/lectures" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-400 hover:text-white" aria-label="Back to lectures">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-white">Add Lecture</h1>
              <p className="text-xs text-cyan-300">Visual Builder</p>
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-[118px_minmax(220px,1fr)_auto] items-center gap-3">
            <label className="relative block min-w-0">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                No
              </span>
              <input
                type="number"
                min="0"
                value={formValues.order_number ?? ''}
                onChange={(event) => updateField('order_number', event.target.value)}
                placeholder="1"
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 pl-11 text-sm font-black text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                aria-label="Lecture number"
              />
            </label>
            <TextInput value={formValues.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Introduction to CSS Flexbox" required />
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Auto saved
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle />
            <button type="button" onClick={() => setIsPreviewOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 text-sm font-bold text-slate-200 hover:border-cyan-400">
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button type="button" disabled={isSaving} onClick={() => handleSave(false)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60">
              <Bookmark className="h-4 w-4" />
              Save as Draft
            </button>
            <button type="button" disabled={isSaving} onClick={() => handleSave(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
              <Send className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Publish Lecture'}
            </button>
          </div>
        </div>
      </header>
      {isLoading ? (
        <p className="p-6 text-sm font-medium text-slate-400">Loading builder...</p>
      ) : (
        <>
        <div
          className="grid h-[calc(100vh-4.5rem)] min-h-0 border-b border-slate-800"
          style={{ gridTemplateColumns: '21% 49% 30%' }}
        >
          <aside className="builder-scrollbar min-h-0 overflow-y-auto border-r border-slate-800 bg-[#0b1020]/95 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Component Library</h2>
              <HelpCircle className="h-4 w-4 text-slate-500" />
            </div>
            <input
              value={componentSearch}
              onChange={(event) => setComponentSearch(event.target.value)}
              placeholder="Search components..."
              className="mt-4 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
            />
            <div className="mt-5 space-y-5">
              {componentGroups.map((group) => {
                const items = libraryItems.filter((item) => group.types.includes(item.type))
                if (!items.length) return null
                return (
                  <section key={group.title}>
                    <h3 className="mb-2 text-xs font-black uppercase text-slate-400">{group.title}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          draggable
                          onDragStart={(event) => event.dataTransfer.setData('application/awt-block', item.type)}
                          onClick={() => addBlock(item.type)}
                          className="flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-800/60 px-2 text-center text-[11px] font-semibold text-slate-100 shadow-sm transition hover:border-cyan-400 hover:bg-slate-800"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-cyan-300">
                            <item.icon className="h-4 w-4" />
                          </span>
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-fuchsia-300">Custom Components</h3>
                <button type="button" className="text-xs font-semibold text-cyan-300">Manage</button>
              </div>
              <div className="mt-3 space-y-2">
                {customComponents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('application/awt-custom-block', item.id)}
                    onClick={() => addBlock(item.block_type, item.block_template)}
                    className="w-full rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-left text-sm font-semibold text-violet-100"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <button type="button" onClick={createReusableComponent} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-violet-400/70 px-3 py-2 text-sm font-bold text-violet-200 hover:bg-violet-400/10">
                <Plus className="h-4 w-4" />
                Create New Component
              </button>
            </div>
          </aside>

          <section className="builder-scrollbar min-h-0 overflow-y-auto border-r border-slate-800 bg-[#0a1020] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">Lecture Builder</h2>
                <p className="mt-1 text-sm text-slate-400">Drag components, reorder, edit and build your lecture</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-slate-300"><RotateCcw className="h-4 w-4" />Undo</button>
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-slate-300"><RotateCw className="h-4 w-4" />Redo</button>
                <button type="button" onClick={() => setIsClearDialogOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 text-sm font-semibold text-red-300"><Trash2 className="h-4 w-4" />Clear All</button>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>
            <div
              className="mt-5 min-h-[620px] border-l border-r border-cyan-400/50 bg-[#080d17] p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="space-y-3">
                {formValues.content_blocks.length ? formValues.content_blocks.map((block, index) => {
                  const definition = defaultBlockTypes.find((item) => item.type === block.type)
                  const Icon = definition?.icon || GripVertical
                  const isSelected = selectedBlockId === block.id
                  const accent = getBlockAccent(block.type)
                  const blockLabel = index === 0 && block.type === 'heading' ? 'Title' : definition?.name || block.type

                  return (
                    <article
                      key={block.id}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        const sourceId = event.dataTransfer.getData('application/awt-move-block')
                        moveBlockTo(sourceId, block.id)
                      }}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={['rounded-lg border transition shadow-lg shadow-black/10', isSelected ? 'ring-2 ring-cyan-400/30' : 'hover:border-slate-500'].join(' ')}
                      style={buildLectureBlockStyle(block.settings || {}, isSelected, accent)}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 px-4 pt-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                          <span
                            draggable
                            onDragStart={(event) => event.dataTransfer.setData('application/awt-move-block', block.id)}
                            className="cursor-grab rounded p-1 active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4 text-slate-600" />
                          </span>
                          <span className="flex h-9 w-9 items-center justify-center rounded-md text-white" style={{ backgroundColor: `${accent}66` }}>
                            <Icon className="h-5 w-5" />
                          </span>
                          {blockLabel}
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={(event) => { event.stopPropagation(); moveBlock(block.id, -1) }} disabled={index === 0} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">Up</button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); moveBlock(block.id, 1) }} disabled={index === formValues.content_blocks.length - 1} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30">Down</button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); duplicateBlock(block) }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><Copy className="h-4 w-4" /></button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); deleteBlock(block.id) }} className="rounded-md p-1.5 text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div
                        className="rounded-lg bg-slate-950/70 mx-4 mb-4 p-3"
                        style={buildLectureTextStyle(block.settings || {})}
                      >
                        <CanvasBlockEditor
                          block={block}
                          onPatch={(path, value) => patchBlock(block.id, path, value)}
                          onImageUpload={(file) => uploadBlockImage(block.id, file)}
                        />
                      </div>
                    </article>
                  )
                }) : (
                  <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-cyan-400/40 bg-cyan-400/5 p-8 text-center">
                    <Plus className="h-10 w-10 text-cyan-300" />
                    <h3 className="mt-3 text-lg font-bold text-white">Start building your lecture</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Drag a component from the library, or click below to add your first block.</p>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => addBlock('paragraph')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-violet-400/60 px-4 py-3 text-sm font-bold text-violet-300 hover:bg-violet-400/10">
                <Plus className="h-4 w-4" />
                Add New Component Here
              </button>
              <div className="mx-auto mt-5 max-w-xl rounded-lg border border-yellow-400/70 bg-yellow-400/10 px-4 py-3 text-sm leading-6 text-yellow-200">
                As you add components, your lecture is built step by step. You can reorder, edit, or delete any component.
              </div>
            </div>
          </section>

          <aside className="builder-scrollbar min-h-0 overflow-y-auto bg-[#0b111d]">
            <BlockSettingsPanel
              block={selectedBlock}
              builderType="lecture"
              onPatch={(path, value) => patchBlock(selectedBlock?.id, path, value)}
              onUpdate={updateBlock}
              onDelete={() => selectedBlock && deleteBlock(selectedBlock.id)}
              onDuplicate={() => selectedBlock && duplicateBlock(selectedBlock)}
              onReset={() => selectedBlock && updateBlock(createBlock(selectedBlock.type, { id: selectedBlock.id }))}
              onImageUpload={(file) => selectedBlock && uploadBlockImage(selectedBlock.id, file)}
            />
          </aside>
        </div>
        </>
      )}
      {isPreviewOpen ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/90 p-6 backdrop-blur" onMouseDown={() => setIsPreviewOpen(false)}>
          <div className="mx-auto max-w-5xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-300">Lecture Preview</p>
                <h2 className="text-2xl font-bold text-white">{formValues.title || 'Untitled Lecture'}</h2>
              </div>
              <button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:border-cyan-400">
                Close Preview
              </button>
            </div>
            <LecturePreview lecture={formValues} />
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        isOpen={isClearDialogOpen}
        title="Clear lecture builder?"
        message="This will remove all blocks from the current lecture canvas. You can keep editing after clearing."
        confirmLabel="Clear All"
        tone="warning"
        onCancel={() => setIsClearDialogOpen(false)}
        onConfirm={clearBlocks}
      />
      </div>
    </div>
  )
}

function buildLectureBlockStyle(s, isSelected, accent) {
  const shadows = { sm: '0 1px 4px rgba(0,0,0,0.3)', md: '0 4px 12px rgba(0,0,0,0.4)', lg: '0 8px 24px rgba(0,0,0,0.5)', xl: '0 16px 40px rgba(0,0,0,0.6)' }
  const gradients = { 'gradient-cyan': 'linear-gradient(135deg,#0ea5e9,#6366f1)' }
  return {
    background: s.backgroundColor && s.backgroundColor !== 'transparent'
      ? (s.backgroundColor.startsWith('gradient-') ? gradients[s.backgroundColor] : s.backgroundColor)
      : 'rgba(15,23,42,0.8)',
    borderColor: s.borderColor || (isSelected ? accent : `${accent}99`),
    borderWidth: s.borderWidth !== undefined ? `${s.borderWidth}px` : undefined,
    borderRadius: s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined,
    boxShadow: s.shadow && s.shadow !== 'none' ? shadows[s.shadow] : undefined,
    marginTop: s.marginTop !== undefined ? `${s.marginTop}px` : undefined,
    marginBottom: s.marginBottom !== undefined ? `${s.marginBottom}px` : undefined,
    marginLeft: s.marginLeft !== undefined ? `${s.marginLeft}px` : undefined,
    marginRight: s.marginRight !== undefined ? `${s.marginRight}px` : undefined,
    width: s.width === '100%' ? '100%' : s.width === 'custom' ? s.customWidth : undefined,
  }
}

function buildLectureTextStyle(s) {
  return {
    color: s.color || undefined,
    fontFamily: s.fontFamily || undefined,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    fontWeight: s.fontWeight || undefined,
    lineHeight: s.lineHeight || undefined,
    letterSpacing: s.letterSpacing ? `${s.letterSpacing}em` : undefined,
    textAlign: s.alignment || undefined,
    paddingTop: s.paddingTop !== undefined ? `${s.paddingTop}px` : undefined,
    paddingBottom: s.paddingBottom !== undefined ? `${s.paddingBottom}px` : undefined,
    paddingLeft: s.paddingLeft !== undefined ? `${s.paddingLeft}px` : undefined,
    paddingRight: s.paddingRight !== undefined ? `${s.paddingRight}px` : undefined,
  }
}

function getBlockAccent(type) {
  const colors = {
    heading: '#3b82f6',
    paragraph: '#22c55e',
    'info-box': '#06b6d4',
    'note-box': '#a855f7',
    'warning-box': '#f59e0b',
    'success-box': '#22c55e',
    'code-block': '#0ea5e9',
    quiz: '#eab308',
    summary: '#a855f7'
  }
  return colors[type] || '#38bdf8'
}

function CanvasBlockEditor({ block, onPatch, onImageUpload }) {
  const content = block.content || {}

  if (block.type === 'heading') {
    return (
      <div className="grid gap-2">
        <input className={inputClass()} value={content.text || ''} onChange={(event) => onPatch('content.text', event.target.value)} placeholder="Write heading here" />
      </div>
    )
  }

  if (block.type === 'paragraph') {
    return (
      <textarea
        className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none focus:border-cyan-400"
        value={(content.html || '').replace(/<[^>]*>/g, '')}
        onChange={(event) => onPatch('content.html', event.target.value)}
        placeholder="Write paragraph text here"
      />
    )
  }

  if (['note-box', 'info-box', 'warning-box', 'success-box', 'callout'].includes(block.type)) {
    return (
      <div className="grid gap-2">
        <input className={inputClass()} value={content.title || ''} onChange={(event) => onPatch('content.title', event.target.value)} placeholder="Box title" />
        <textarea className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400" value={content.description || ''} onChange={(event) => onPatch('content.description', event.target.value)} placeholder="Box description" />
      </div>
    )
  }

  if (block.type === 'code-block') {
    return (
      <div className="grid gap-2">
        <select className={inputClass()} value={content.language || 'HTML'} onChange={(event) => onPatch('content.language', event.target.value)}>
          {languages.map((item) => <option key={item}>{item}</option>)}
        </select>
        <textarea className="min-h-36 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-100 outline-none focus:border-cyan-400" value={content.code || ''} onChange={(event) => onPatch('content.code', event.target.value)} placeholder="Write code here" />
      </div>
    )
  }

  if (block.type === 'quiz') {
    return (
      <div className="grid gap-2">
        <input
          className={inputClass()}
          value={content.question || ''}
          onFocus={() => {
            if (content.question === 'Question text?') onPatch('content.question', '')
          }}
          onChange={(event) => onPatch('content.question', event.target.value)}
          placeholder="Quiz question"
        />
        {(content.options || []).map((option, index) => (
          <input
            key={index}
            className={inputClass()}
            value={option}
            onFocus={() => {
              if (option === `Option ${String.fromCharCode(65 + index)}`) {
                onPatch('content.options', content.options.map((item, itemIndex) => itemIndex === index ? '' : item))
              }
            }}
            onChange={(event) => onPatch('content.options', content.options.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
            placeholder={`Option ${index + 1}`}
          />
        ))}
        <input
          className={inputClass()}
          value={content.correctAnswer || ''}
          onFocus={() => {
            if (content.correctAnswer === 'Option A') onPatch('content.correctAnswer', '')
          }}
          onChange={(event) => onPatch('content.correctAnswer', event.target.value)}
          placeholder="Correct answer"
        />
      </div>
    )
  }

  if (block.type === 'summary') {
    return <textarea className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400" value={content.text || ''} onChange={(event) => onPatch('content.text', event.target.value)} placeholder="Write summary" />
  }

  if (block.type === 'image') {
    return (
      <div className="grid gap-2">
        <input type="file" accept="image/*" onChange={(event) => onImageUpload(event.target.files?.[0])} className="text-sm text-slate-300" />
        <input className={inputClass()} value={content.url || ''} onChange={(event) => onPatch('content.url', event.target.value)} placeholder="Image URL" />
        <input className={inputClass()} value={content.caption || ''} onChange={(event) => onPatch('content.caption', event.target.value)} placeholder="Caption" />
      </div>
    )
  }

  if (block.type === 'video') {
    return (
      <div className="grid gap-2">
        <input className={inputClass()} value={content.url || ''} onChange={(event) => onPatch('content.url', event.target.value)} placeholder="YouTube, Vimeo, or local video URL" />
        <input className={inputClass()} value={content.caption || ''} onChange={(event) => onPatch('content.caption', event.target.value)} placeholder="Caption" />
      </div>
    )
  }

  if (block.type === 'resource-list') {
    return <textarea className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400" value={(content.resources || []).join('\n')} onChange={(event) => onPatch('content.resources', event.target.value.split('\n'))} placeholder="One resource per line" />
  }

  return (
    <textarea
      className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
      value={JSON.stringify(content, null, 2)}
      onChange={(event) => {
        try {
          onPatch('content', JSON.parse(event.target.value))
        } catch {
          onPatch('content.raw', event.target.value)
        }
      }}
    />
  )
}

function MiniInput({ label, children }) {
  return <label className="block"><span className="text-xs font-bold uppercase text-slate-500">{label}</span><div className="mt-1">{children}</div></label>
}

function inputClass() {
  return 'h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-400'
}

function BlockSettings({ block, onPatch, onUpdate, onDelete, onImageUpload }) {
  const content = block.content || {}
  const settings = block.settings || {}
  const [activeTab, setActiveTab] = useState('content')

  function patchContent(key, value) {
    onPatch(`content.${key}`, value)
  }

  function patchSettings(key, value) {
    onPatch(`settings.${key}`, value)
  }

  function richCommand(command) {
    if (command === 'bold') patchContent('html', `<strong>${content.html || ''}</strong>`)
    if (command === 'italic') patchContent('html', `<em>${content.html || ''}</em>`)
    if (command === 'underline') patchContent('html', `<u>${content.html || ''}</u>`)
    if (command === 'insertUnorderedList') patchContent('html', `<ul><li>${content.html || 'List item'}</li></ul>`)
    if (command === 'createLink') patchContent('html', `<a href="#">${content.html || 'Link text'}</a>`)
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        {['content', 'style', 'advanced'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'h-10 flex-1 text-sm font-bold capitalize transition',
              activeTab === tab ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400' : 'text-slate-400 hover:text-white'
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'style' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <MiniInput label="Font Family"><input className={inputClass()} value={settings.fontFamily || 'Inter'} onChange={(event) => patchSettings('fontFamily', event.target.value)} /></MiniInput>
            <MiniInput label="Font Size">
              <select className={inputClass()} value={settings.fontSize || 16} onChange={(event) => patchSettings('fontSize', Number(event.target.value))}>
                {fontSizes.map((size) => <option key={size} value={size}>{size}px</option>)}
              </select>
            </MiniInput>
            <MiniInput label="Font Weight">
              <select className={inputClass()} value={settings.fontWeight || 400} onChange={(event) => patchSettings('fontWeight', Number(event.target.value))}>
                {fontWeights.map((weight) => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
              </select>
            </MiniInput>
            <MiniInput label="Text Color"><input className={inputClass()} type="color" value={settings.color || '#e2e8f0'} onChange={(event) => patchSettings('color', event.target.value)} /></MiniInput>
            <MiniInput label="Background"><input className={inputClass()} type="color" value={settings.backgroundColor === 'transparent' ? '#0f172a' : settings.backgroundColor || '#0f172a'} onChange={(event) => patchSettings('backgroundColor', event.target.value)} /></MiniInput>
            <MiniInput label="Padding"><input className={inputClass()} type="number" value={settings.padding || 0} onChange={(event) => patchSettings('padding', Number(event.target.value))} /></MiniInput>
            <MiniInput label="Margin"><input className={inputClass()} type="number" value={settings.margin || 16} onChange={(event) => patchSettings('margin', Number(event.target.value))} /></MiniInput>
          </div>
          <div className="flex gap-2">
            {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([value, Icon]) => (
              <button key={value} type="button" onClick={() => patchSettings('alignment', value)} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-cyan-400"><Icon className="h-4 w-4" /></button>
            ))}
          </div>
        </>
      ) : null}

      {activeTab === 'advanced' ? (
        <div className="grid grid-cols-2 gap-3">
          <MiniInput label="Icon"><select className={inputClass()} value={content.icon || settings.icon || 'Info'} onChange={(event) => patchContent('icon', event.target.value)}>{iconOptions.map((item) => <option key={item}>{item}</option>)}</select></MiniInput>
          <MiniInput label="Animation"><select className={inputClass()} value={settings.animation || 'none'} onChange={(event) => patchSettings('animation', event.target.value)}>{animations.map((item) => <option key={item}>{item}</option>)}</select></MiniInput>
          <button type="button" onClick={onDelete} className="col-span-2 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm font-bold text-red-300">
            Delete Component
          </button>
        </div>
      ) : null}

      {activeTab === 'content' && block.type === 'heading' ? (
        <div className="space-y-3">
          <MiniInput label="Heading text"><input className={inputClass()} value={content.text || ''} onChange={(event) => patchContent('text', event.target.value)} /></MiniInput>
          <MiniInput label="Level"><select className={inputClass()} value={content.level || 'h2'} onChange={(event) => patchContent('level', event.target.value)}>{['h1', 'h2', 'h3', 'h4'].map((item) => <option key={item}>{item.toUpperCase()}</option>)}</select></MiniInput>
          <MiniInput label="Heading color"><input className={inputClass()} type="color" value={content.color || '#ffffff'} onChange={(event) => patchContent('color', event.target.value)} /></MiniInput>
        </div>
      ) : null}

      {activeTab === 'content' && block.type === 'paragraph' ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[['bold', Bold], ['italic', Italic], ['underline', Underline]].map(([command, Icon]) => <button key={command} type="button" onClick={() => richCommand(command)} className="rounded-md border border-slate-700 p-2 text-slate-300"><Icon className="h-4 w-4" /></button>)}
            <button type="button" onClick={() => richCommand('insertUnorderedList')} className="rounded-md border border-slate-700 px-2 text-xs font-bold text-slate-300">List</button>
            <button type="button" onClick={() => richCommand('createLink')} className="rounded-md border border-slate-700 px-2 text-xs font-bold text-slate-300">Link</button>
          </div>
          <div contentEditable suppressContentEditableWarning onBlur={(event) => patchContent('html', event.currentTarget.innerHTML)} className="min-h-28 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none" dangerouslySetInnerHTML={{ __html: content.html || '' }} />
        </div>
      ) : null}

      {activeTab === 'content' && ['note-box', 'info-box', 'warning-box', 'success-box', 'callout'].includes(block.type) ? (
        <div className="space-y-3">
          <MiniInput label="Title"><input className={inputClass()} value={content.title || ''} onChange={(event) => patchContent('title', event.target.value)} /></MiniInput>
          <MiniInput label="Description"><input className={inputClass()} value={content.description || ''} onChange={(event) => patchContent('description', event.target.value)} /></MiniInput>
          <MiniInput label="Icon"><select className={inputClass()} value={content.icon || 'Info'} onChange={(event) => patchContent('icon', event.target.value)}>{iconOptions.map((item) => <option key={item}>{item}</option>)}</select></MiniInput>
          <MiniInput label="Preset color"><input className={inputClass()} type="color" value={content.color || '#38bdf8'} onChange={(event) => patchContent('color', event.target.value)} /></MiniInput>
        </div>
      ) : null}

      {activeTab === 'content' && block.type === 'code-block' ? (
        <div className="space-y-3">
          <MiniInput label="Language"><select className={inputClass()} value={content.language || 'HTML'} onChange={(event) => patchContent('language', event.target.value)}>{languages.map((item) => <option key={item}>{item}</option>)}</select></MiniInput>
          <MiniInput label="Code"><textarea className="min-h-40 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-100 outline-none focus:border-cyan-400" value={content.code || ''} onChange={(event) => patchContent('code', event.target.value)} /></MiniInput>
          <MiniInput label="CSS for HTML preview"><textarea className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-100 outline-none focus:border-cyan-400" value={content.css || ''} onChange={(event) => patchContent('css', event.target.value)} /></MiniInput>
          <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            Live Output
            <input type="checkbox" checked={content.liveOutput !== false} onChange={(event) => patchContent('liveOutput', event.target.checked)} className="h-4 w-4 accent-emerald-400" />
          </label>
          <button type="button" onClick={() => navigator.clipboard.writeText(content.code || '')} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 hover:border-cyan-400">
            <Copy className="h-4 w-4" />
            Copy Code
          </button>
        </div>
      ) : null}

      {activeTab === 'content' && block.type === 'image' ? (
        <div className="space-y-3">
          <MiniInput label="Upload image"><input type="file" accept="image/*" onChange={(event) => onImageUpload(event.target.files?.[0])} className="w-full text-sm text-slate-300" /></MiniInput>
          <MiniInput label="Image URL"><input className={inputClass()} value={content.url || ''} onChange={(event) => patchContent('url', event.target.value)} /></MiniInput>
          <MiniInput label="Caption"><input className={inputClass()} value={content.caption || ''} onChange={(event) => patchContent('caption', event.target.value)} /></MiniInput>
          <MiniInput label="Width"><input className={inputClass()} type="range" min="20" max="100" value={content.width || 80} onChange={(event) => patchContent('width', Number(event.target.value))} /></MiniInput>
        </div>
      ) : null}

      {activeTab === 'content' && block.type === 'quiz' ? (
        <QuizSettings content={content} patchContent={patchContent} />
      ) : null}

      {activeTab === 'content' && block.type === 'table' ? <MatrixSettings content={content} patchContent={patchContent} kind="rows" /> : null}
      {activeTab === 'content' && block.type === 'tabs' ? <JsonListSettings content={content} patchContent={patchContent} field="tabs" /> : null}
      {activeTab === 'content' && block.type === 'accordion' ? <JsonListSettings content={content} patchContent={patchContent} field="items" /> : null}
      {activeTab === 'content' && ['video', 'diagram', 'assignment', 'summary', 'resource-list'].includes(block.type) ? <SimpleContentSettings block={block} onUpdate={onUpdate} /> : null}
    </div>
  )
}

function QuizSettings({ content, patchContent }) {
  return (
    <div className="space-y-3">
      <MiniInput label="Question">
        <input
          className={inputClass()}
          value={content.question || ''}
          onFocus={() => {
            if (content.question === 'Question text?') patchContent('question', '')
          }}
          onChange={(event) => patchContent('question', event.target.value)}
          placeholder="Quiz question"
        />
      </MiniInput>
      {(content.options || []).map((option, index) => (
        <MiniInput key={index} label={`Option ${index + 1}`}>
          <input
            className={inputClass()}
            value={option}
            onFocus={() => {
              if (option === `Option ${String.fromCharCode(65 + index)}`) {
                patchContent('options', content.options.map((item, itemIndex) => itemIndex === index ? '' : item))
              }
            }}
            onChange={(event) => patchContent('options', content.options.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
            placeholder={`Option ${index + 1}`}
          />
        </MiniInput>
      ))}
      <MiniInput label="Correct answer">
        <input
          className={inputClass()}
          value={content.correctAnswer || ''}
          onFocus={() => {
            if (content.correctAnswer === 'Option A') patchContent('correctAnswer', '')
          }}
          onChange={(event) => patchContent('correctAnswer', event.target.value)}
          placeholder="Correct answer"
        />
      </MiniInput>
      <MiniInput label="Explanation"><input className={inputClass()} value={content.explanation || ''} onChange={(event) => patchContent('explanation', event.target.value)} /></MiniInput>
    </div>
  )
}

function MatrixSettings({ content, patchContent }) {
  const rows = content.rows || []
  return (
    <div className="space-y-2">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 gap-2">
          {row.map((cell, cellIndex) => <input key={cellIndex} className={inputClass()} value={cell} onChange={(event) => patchContent('rows', rows.map((item, itemIndex) => itemIndex === rowIndex ? item.map((value, valueIndex) => valueIndex === cellIndex ? event.target.value : value) : item))} />)}
        </div>
      ))}
      <button type="button" onClick={() => patchContent('rows', [...rows, Array(rows[0]?.length || 2).fill('')])} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200">Add row</button>
      <button type="button" onClick={() => patchContent('rows', rows.map((row) => [...row, '']))} className="ml-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200">Add column</button>
    </div>
  )
}

function JsonListSettings({ content, patchContent, field }) {
  const items = content[field] || []
  return <div className="space-y-2">{items.map((item, index) => <input key={index} className={inputClass()} value={item.label || item.title} onChange={(event) => patchContent(field, items.map((current, currentIndex) => currentIndex === index ? { ...current, label: event.target.value, title: event.target.value } : current))} />)}<button type="button" onClick={() => patchContent(field, [...items, field === 'tabs' ? { label: 'New Tab', content: '' } : { title: 'New Section', content: '' }])} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200">Add item</button></div>
}

function SimpleContentSettings({ block, onUpdate }) {
  const json = JSON.stringify(block.content || {}, null, 2)
  return (
    <MiniInput label="Component JSON">
      <textarea className="min-h-36 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:border-cyan-400" defaultValue={json} onBlur={(event) => {
        try {
          onUpdate({ ...block, content: JSON.parse(event.target.value) })
        } catch {
          window.alert('Invalid JSON')
        }
      }} />
    </MiniInput>
  )
}
