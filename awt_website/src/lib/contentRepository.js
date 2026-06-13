import { contentDatabase } from '../data/contentDatabase.js'
import { labs } from '../data/labs.js'
import { supabase } from './supabase.js'

function fallbackLectures() {
  return contentDatabase
    .filter((item) => item.type === 'lecture')
    .map((item) => ({
      ...item,
      category: item.group || 'General',
      shortDescription: 'Demo lecture from the local fallback content database.'
    }))
}

function fallbackLabs() {
  return labs.map((lab) => ({
    id: lab.id,
    type: 'lab',
    group: 'Labs',
    title: lab.title,
    slug: lab.slug,
    path: `/student/labs/${lab.slug}`,
    order: lab.number,
    status: 'published',
    labNumber: lab.number,
    objective: lab.objective || '',
    category: 'Labs',
    content_blocks: [],
    blocks: [],
    steps: lab.steps?.length || 0,
    estimatedTime: lab.estimatedTime || lab.duration || '45 min'
  }))
}

function getLecturePath(slug) {
  return `/student/lectures/${slug}`
}

function mapLecture(lecture) {
  const slug = lecture.slug || `lecture-${lecture.id || lecture.order_number || Date.now()}`
  return {
    id: lecture.id,
    type: 'lecture',
    group: lecture.category || 'General',
    category: lecture.category || 'General',
    title: lecture.title,
    english_content: lecture.english_content || '',
    slug,
    path: getLecturePath(slug),
    order: lecture.order_number ?? 0,
    status: 'published',
    shortDescription: lecture.short_description || '',
    short_description: lecture.short_description || ''
  }
}

function mapLab(lab) {
  const slug = lab.slug || `lab-${lab.lab_number}`
  const title = lab.lab_number === 8 ? 'Mid Term' : lab.lab_number === 15 ? 'Final Term' : lab.title
  const blockSteps = Array.isArray(lab.content_blocks)
    ? lab.content_blocks
        .filter((block) => ['steps', 'solved-activity', 'graded-task'].includes(block.type))
        .reduce((total, block) => {
          if (block.type === 'steps') return total + (block.content?.items?.length || 0)
          if (block.type === 'solved-activity') return total + (block.content?.instructions?.length || 0)
          if (block.type === 'graded-task') return total + (block.content?.requirements?.length || 0)
          return total
        }, 0)
    : 0

  return {
    id: lab.id,
    type: 'lab',
    group: lab.lab_number === 8 || lab.lab_number === 15 ? 'Exams' : 'Labs',
    title,
    slug,
    path: `/student/labs/${slug}`,
    order: lab.lab_number ?? 0,
    status: 'published',
    labNumber: lab.lab_number ?? 0,
    objective: lab.objective || '',
    category: lab.category || 'General',
    content_blocks: lab.content_blocks || [],
    blocks: lab.content_blocks || [],
    steps: blockSteps || (Array.isArray(lab.steps) ? lab.steps.length : 0)
  }
}

function mapActivity(activity) {
  const slug = activity.slug || activity.id

  return {
    id: activity.id,
    type: 'activity',
    group: activity.type || 'Activities',
    title: activity.title,
    slug,
    path: `/docs/${slug}`,
    order: 0,
    status: 'published'
  }
}

export async function getPublishedContent() {
  if (!supabase) return contentDatabase

  const [lecturesResult, labsResult, activitiesResult] = await Promise.all([
    supabase
      .from('lectures')
      .select('id,title,slug,category,order_number,short_description,english_content,is_published')
      .eq('is_published', true)
      .order('order_number', { ascending: true }),
    supabase
      .from('labs')
      .select('id,title,slug,lab_number,objective,is_published')
      .eq('is_published', true)
      .order('lab_number', { ascending: true }),
    supabase
      .from('activities')
      .select('id,title,slug,type,is_published,created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
  ])

  const error = lecturesResult.error || labsResult.error || activitiesResult.error

  if (error) {
    console.warn('Falling back to local content database:', error.message)
    return contentDatabase
  }

  return [
    ...(lecturesResult.data || []).map(mapLecture),
    ...(labsResult.data || []).map(mapLab),
    ...(activitiesResult.data || []).map(mapActivity)
  ]
}

export async function getPublishedLectures() {
  if (!supabase) return fallbackLectures()

  const { data, error } = await supabase
    .from('lectures')
    .select('id,title,slug,category,order_number,short_description,english_content,is_published,content_blocks')
    .eq('is_published', true)
    .order('order_number', { ascending: true })

  if (error) {
    console.warn('Falling back to local lectures:', error.message)
    return fallbackLectures()
  }

  return (data || []).map((lecture) => ({
    ...mapLecture(lecture),
    blocks: Array.isArray(lecture.content_blocks) ? lecture.content_blocks.length : 0
  }))
}

export async function getPublishedLabs() {
  if (!supabase) return fallbackLabs()

  const { data, error } = await supabase
    .from('labs')
    .select('id,title,slug,lab_number,objective,steps,is_published,content_blocks')
    .eq('is_published', true)
    .order('lab_number', { ascending: true })

  if (error) {
    console.warn('Unable to fetch published labs:', error.message)
    return []
  }

  return (data || []).map((lab) => mapLab(lab))
}

export function subscribeToContentChanges(onChange) {
  if (!supabase) return () => {}

  // Use a unique channel name each call to avoid "cannot add callbacks after subscribe()" error
  const channelName = `published-content-${Math.random().toString(36).slice(2)}`

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lectures' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'labs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
