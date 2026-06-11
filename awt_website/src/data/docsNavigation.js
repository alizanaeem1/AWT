import { contentDatabase } from './contentDatabase.js'

export const docsSections = [
  {
    title: 'The Basics',
    items: [
      { title: 'Introduction', slug: 'introduction' },
      { title: 'How to Learn', slug: 'how-to-learn' },
      { title: 'Course Roadmap', slug: 'course-roadmap' }
    ]
  },
  {
    title: 'Environment Setup',
    items: [
      { title: 'Install Tools', slug: 'install-tools' },
      { title: 'VS Code Setup', slug: 'vs-code-setup' }
    ]
  },
  {
    title: 'HTML',
    items: [
      { title: 'Lecture: HTML Introduction', slug: 'html-introduction-lecture', path: '/lectures/html-introduction' },
      { title: 'Document Structure', slug: 'html-document-structure' },
      { title: 'Semantic Elements', slug: 'semantic-elements' }
    ]
  },
  {
    title: 'CSS',
    items: [
      { title: 'Selectors', slug: 'css-selectors' },
      { title: 'Layouts', slug: 'css-layouts' }
    ]
  },
  {
    title: 'JavaScript',
    items: [
      { title: 'Core Syntax', slug: 'core-syntax' },
      { title: 'DOM Basics', slug: 'dom-basics' }
    ]
  },
  {
    title: 'React',
    items: [
      { title: 'Components', slug: 'react-components' },
      { title: 'State and Props', slug: 'state-and-props' }
    ]
  },
  {
    title: 'Node.js',
    items: [
      { title: 'Server Basics', slug: 'server-basics' },
      { title: 'APIs', slug: 'node-apis' }
    ]
  },
  {
    title: 'Labs',
    items: [
      { title: 'Lab Guidelines', slug: 'lab-guidelines' },
      { title: 'Submissions', slug: 'lab-submissions' }
    ]
  },
  {
    title: 'Activities',
    items: [
      { title: 'Practice Tasks', slug: 'practice-tasks' },
      { title: 'Assessments', slug: 'assessments' }
    ]
  }
]

export const docsHeadings = [
  { id: 'overview', title: 'Overview' },
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'learning-path', title: 'Learning Path' },
  { id: 'what-you-will-build', title: 'What You Will Build' },
  { id: 'next-steps', title: 'Next Steps' }
]

export const lectureHeadings = [
  { id: 'lecture-overview', title: 'Overview' },
  { id: 'theory', title: 'Theory' },
  { id: 'example', title: 'Example' },
  { id: 'code-example', title: 'Code Example' },
  { id: 'output-preview', title: 'Output Preview' },
  { id: 'notes', title: 'Notes' },
  { id: 'quick-quiz', title: 'Quick Quiz' },
  { id: 'summary', title: 'Summary' }
]

export function findDocItem(slug) {
  return (
    contentDatabase.find((item) => item.slug === slug) ??
    docsSections.flatMap((section) => section.items).find((item) => item.slug === slug)
  )
}
