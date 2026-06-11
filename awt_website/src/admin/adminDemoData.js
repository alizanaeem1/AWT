export const adminLectures = [
  {
    id: 'lec-1',
    title: 'Introduction to HTML Structure',
    slug: 'html-introduction',
    category: 'HTML',
    order: 1,
    status: 'Published',
    updatedAt: '2026-05-29'
  },
  {
    id: 'lec-2',
    title: 'CSS Layout Foundations',
    slug: 'css-layout-foundations',
    category: 'CSS',
    order: 2,
    status: 'Draft',
    updatedAt: '2026-05-28'
  },
  {
    id: 'lec-3',
    title: 'React Components',
    slug: 'react-components',
    category: 'React',
    order: 3,
    status: 'Published',
    updatedAt: '2026-05-27'
  }
]

export const adminLabs = [
  {
    id: 'lab-1',
    title: 'HTML Document Structure',
    number: 1,
    status: 'Published',
    steps: 5
  },
  {
    id: 'lab-8',
    title: 'Mid Term',
    number: 8,
    status: 'Published',
    steps: 0
  },
  {
    id: 'lab-15',
    title: 'Final Term',
    number: 15,
    status: 'Draft',
    steps: 0
  }
]

export const adminActivities = [
  { id: 'act-1', title: 'HTML Practice Assignment', type: 'Assignment', deadline: '2026-06-05', status: 'Published' },
  { id: 'act-2', title: 'CSS Quiz', type: 'Quiz', deadline: '2026-06-09', status: 'Draft' }
]

export const adminStats = {
  totalLectures: 12,
  totalLabs: 15,
  totalActivities: 8,
  publishedContent: 29,
  draftContent: 6
}
