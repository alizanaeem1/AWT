import { supabase } from './supabase.js'

export async function fetchUserProgress(profileId) {
  if (!supabase || !profileId) return []

  const { data, error } = await supabase
    .from('progress')
    .select('id,content_type,content_id,status,percent,completed_at,updated_at,metadata')
    .eq('profile_id', profileId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function saveLectureProgress({ profileId, contentId, title, isRead }) {
  if (!supabase || !profileId) return null

  const payload = {
    profile_id: profileId,
    content_type: 'lecture',
    content_id: contentId,
    status: isRead ? 'completed' : 'not_started',
    percent: isRead ? 100 : 0,
    completed_at: isRead ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    metadata: { title }
  }

  const { data, error } = await supabase
    .from('progress')
    .upsert(payload, { onConflict: 'profile_id,content_type,content_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveLabProgress({ profileId, contentId, title, checkedSteps, totalSteps }) {
  if (!supabase || !profileId) return null

  const percent = totalSteps ? Math.round((checkedSteps.length / totalSteps) * 100) : 0
  const isComplete = percent === 100
  const payload = {
    profile_id: profileId,
    content_type: 'lab',
    content_id: contentId,
    status: isComplete ? 'completed' : percent > 0 ? 'in_progress' : 'not_started',
    percent,
    completed_at: isComplete ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    metadata: {
      title,
      checked_steps: checkedSteps,
      total_steps: totalSteps
    }
  }

  const { data, error } = await supabase
    .from('progress')
    .upsert(payload, { onConflict: 'profile_id,content_type,content_id' })
    .select()
    .single()

  if (error) throw error
  return data
}
