import { contentDatabase } from '../data/contentDatabase.js'
import { labs } from '../data/labs.js'
import { supabase } from './supabase.js'

export async function fetchPublishedLectureBySlug(slug) {
  if (!supabase) {
    const lecture = contentDatabase.find((item) => item.type === 'lecture' && item.slug === slug)
    return lecture
      ? {
          ...lecture,
          category: lecture.group || 'General',
          short_description: lecture.shortDescription || lecture.short_description || '',
          is_published: true
        }
      : null
  }

  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) {
    console.warn('Unable to fetch lecture detail:', error.message)
    return null
  }

  return data
}

export async function fetchPublishedLabBySlug(slug) {
  if (!supabase) {
    const lab = labs.find((item) => item.slug === slug || item.id === slug)
    return lab
      ? {
          ...lab,
          lab_number: lab.number,
          objective: lab.objective || '',
          steps: lab.steps || [],
          code_examples: lab.code || '',
          output_preview: lab.output || '',
          is_published: true
        }
      : null
  }

  const { data, error } = await supabase
    .from('labs')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) {
    console.warn('Unable to fetch lab detail:', error.message)
    return null
  }

  return data
}
