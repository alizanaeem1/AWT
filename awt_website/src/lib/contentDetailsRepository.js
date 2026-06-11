import { supabase } from './supabase.js'

export async function fetchPublishedLectureBySlug(slug) {
  if (!supabase) return null

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
  if (!supabase) return null

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
