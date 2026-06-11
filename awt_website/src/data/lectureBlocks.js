import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Braces,
  CircleHelp,
  FileQuestion,
  Film,
  Heading,
  Image,
  Info,
  Layers,
  LayoutList,
  Link,
  ListChecks,
  MessageSquare,
  PanelTop,
  Pilcrow,
  Rows3,
  Sparkles,
  SplitSquareHorizontal,
  Table,
  Workflow
} from 'lucide-react'

export const defaultBlockTypes = [
  { type: 'heading', name: 'Heading', icon: Heading },
  { type: 'paragraph', name: 'Paragraph', icon: Pilcrow },
  { type: 'note-box', name: 'Note Box', icon: Sparkles },
  { type: 'info-box', name: 'Info Box', icon: Info },
  { type: 'warning-box', name: 'Warning Box', icon: AlertTriangle },
  { type: 'success-box', name: 'Success Box', icon: BadgeCheck },
  { type: 'code-block', name: 'Code Block', icon: Braces },
  { type: 'image', name: 'Image', icon: Image },
  { type: 'diagram', name: 'Diagram', icon: Workflow },
  { type: 'video', name: 'Video', icon: Film },
  { type: 'quiz', name: 'Quiz', icon: CircleHelp },
  { type: 'assignment', name: 'Assignment', icon: FileQuestion },
  { type: 'resource-list', name: 'Resource List', icon: Link },
  { type: 'summary', name: 'Summary', icon: BookOpen },
  { type: 'divider', name: 'Divider', icon: SplitSquareHorizontal },
  { type: 'callout', name: 'Callout', icon: MessageSquare },
  { type: 'table', name: 'Table', icon: Table },
  { type: 'tabs', name: 'Tabs', icon: PanelTop },
  { type: 'accordion', name: 'Accordion', icon: Rows3 }
]

export const iconOptions = ['Info', 'Sparkles', 'AlertTriangle', 'BadgeCheck', 'BookOpen', 'CircleHelp', 'Braces']

export function createBlock(type, override = {}) {
  const base = {
    id: crypto.randomUUID(),
    type,
    settings: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: 400,
      color: '#e2e8f0',
      backgroundColor: 'transparent',
      alignment: 'left',
      margin: 16,
      padding: 0,
      icon: 'Info',
      animation: 'none'
    }
  }

  const presets = {
    heading: { content: { text: 'New heading', level: 'h2', color: '#ffffff', alignment: 'left' } },
    paragraph: { content: { html: 'Write paragraph text. Use toolbar controls for bold, italic, underline, lists, and links.' } },
    'note-box': { content: { title: 'Note', description: 'Add a useful note for students.', icon: 'Sparkles', color: '#facc15' } },
    'info-box': { content: { title: 'Info', description: 'Add supporting context.', icon: 'Info', color: '#38bdf8' } },
    'warning-box': { content: { title: 'Warning', description: 'Mention common mistakes or risks.', icon: 'AlertTriangle', color: '#fb923c' } },
    'success-box': { content: { title: 'Success', description: 'Show the correct outcome.', icon: 'BadgeCheck', color: '#34d399' } },
    'code-block': { content: { language: 'HTML', code: '<section class="demo">Hello AWT</section>', css: '.demo { color: #38bdf8; font-weight: 700; }' } },
    image: { content: { url: '', caption: 'Image caption', alignment: 'center', width: 80 } },
    diagram: { content: { title: 'Diagram', description: 'Describe the flow or concept visually.' } },
    video: { content: { url: '', caption: 'Video explanation' } },
    quiz: { content: { question: 'Question text?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A', explanation: 'Explain the correct answer.' } },
    assignment: { content: { title: 'Assignment', description: 'Describe the task students should complete.' } },
    'resource-list': { content: { resources: ['https://example.com'] } },
    summary: { content: { text: 'Summarize the key takeaways.' } },
    divider: { content: {} },
    callout: { content: { title: 'Callout', description: 'Highlight an important idea.', icon: 'Info', color: '#a78bfa' } },
    table: { content: { rows: [['Topic', 'Description'], ['HTML', 'Structure'], ['CSS', 'Styling']] } },
    tabs: { content: { tabs: [{ label: 'HTML', content: '<h1>Hello</h1>' }, { label: 'CSS', content: 'h1 { color: cyan; }' }, { label: 'JavaScript', content: 'console.log("AWT")' }] } },
    accordion: { content: { items: [{ title: 'Section 1', content: 'Expandable content' }, { title: 'Section 2', content: 'More details' }] } }
  }

  return { ...base, ...(presets[type] || presets.callout), ...override }
}

export const blockIconMap = {
  Info,
  Sparkles,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CircleHelp,
  Braces,
  Layers,
  ListChecks
}
