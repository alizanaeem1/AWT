import { adminActivities, adminLabs, adminLectures } from '../admin/adminDemoData.js'
import { supabase } from './supabase.js'
import { slugify } from './slugify.js'

const fallbackSiteSettings = {
  websiteTitle: 'AWT Interactive Learning Platform',
  primaryColor: '#34d399',
  secondaryColor: '#22d3ee',
  defaultTheme: 'dark',
  languageDefault: 'en',
  logoUrl: ''
}

const localSettingsKey = 'awt-site-settings'

function formatDate(value) {
  if (!value) return 'Not updated'
  return new Intl.DateTimeFormat('en-CA').format(new Date(value))
}

function statusLabel(isPublished) {
  return isPublished ? 'Published' : 'Draft'
}

function stepCount(steps) {
  if (Array.isArray(steps)) return steps.length
  return Number(steps) || 0
}

function labBlockStepCount(blocks, fallbackSteps) {
  const fallbackCount = stepCount(fallbackSteps)
  if (!Array.isArray(blocks) || !blocks.length) return fallbackCount

  const blockCount = blocks.reduce((total, block) => {
    const content = block?.content || {}
    if (block?.type === 'steps') return total + stepCount(content.items)
    if (block?.type === 'solved-activity') return total + stepCount(content.instructions)
    if (block?.type === 'graded-task') return total + stepCount(content.requirements)
    return total
  }, 0)

  return blockCount || fallbackCount
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase environment variables are missing.')
}

function splitLines(value) {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function stringifyList(value) {
  if (Array.isArray(value)) return value.join('\n')
  return value || ''
}

function normalizeSlug(title, slug) {
  return slugify(slug || title || `content-${Date.now()}`)
}

export async function uploadMediaFile(file, folder) {
  if (!file) return ''
  requireSupabase()

  const extension = file.name.split('.').pop()
  const filePath = `${folder}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('media').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  })

  if (error) throw error

  const { data } = supabase.storage.from('media').getPublicUrl(filePath)
  return data.publicUrl
}

export async function fetchAdminLectures() {
  if (!supabase) return adminLectures

  const { data, error } = await supabase
    .from('lectures')
    .select('id,title,slug,category,order_number,is_published,updated_at,content_blocks')
    .order('order_number', { ascending: true })

  if (error) {
    console.warn('Falling back to local lecture records:', error.message)
    return adminLectures
  }

  return data.map((lecture) => ({
    id: lecture.id,
    title: lecture.title || lecture.content_blocks?.find((block) => block.type === 'heading')?.content?.text || 'Untitled Lecture',
    slug: lecture.slug,
    category: lecture.category || 'General',
    order: lecture.order_number ?? 0,
    status: statusLabel(lecture.is_published),
    updatedAt: formatDate(lecture.updated_at),
    blocks: Array.isArray(lecture.content_blocks) ? lecture.content_blocks.length : 0
  }))
}

export async function fetchAdminLabs() {
  if (!supabase) return adminLabs

  const { data, error } = await supabase
    .from('labs')
    .select('id,title,lab_number,steps,is_published,content_blocks,updated_at')
    .order('lab_number', { ascending: true })

  if (error) {
    console.warn('Falling back to local lab records:', error.message)
    return adminLabs
  }

  return data.map((lab) => ({
    id: lab.id,
    title: lab.lab_number === 8 ? 'Mid Term' : lab.lab_number === 15 ? 'Final Term' : lab.title,
    number: lab.lab_number ?? 0,
    status: statusLabel(lab.is_published),
    blocks: Array.isArray(lab.content_blocks) ? lab.content_blocks.length : 0,
    steps: labBlockStepCount(lab.content_blocks, lab.steps),
    updated: formatDate(lab.updated_at)
  }))
}

export async function fetchAdminActivities() {
  if (!supabase) return adminActivities

  const { data, error } = await supabase
    .from('activities')
    .select('id,title,slug,type,description,deadline,is_published')
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('Falling back to local activity records:', error.message)
    return adminActivities
  }

  return data.map((activity) => ({
    id: activity.id,
    title: activity.title,
    slug: activity.slug || '',
    type: activity.type || 'Activity',
    description: activity.description || '',
    deadline: activity.deadline ? formatDate(activity.deadline) : 'No deadline',
    status: statusLabel(activity.is_published)
  }))
}

export async function fetchSiteSettings() {
  const localSettings = JSON.parse(localStorage.getItem(localSettingsKey) || 'null')
  if (!supabase) return localSettings || fallbackSiteSettings

  const { data, error } = await supabase
    .from('site_settings')
    .select('id,website_title,logo_url,primary_color,secondary_color,default_theme,language_default')
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    if (error) console.warn('Falling back to local site settings:', error.message)
    return localSettings || fallbackSiteSettings
  }

  return {
    id: data.id,
    websiteTitle: data.website_title || fallbackSiteSettings.websiteTitle,
    primaryColor: data.primary_color || fallbackSiteSettings.primaryColor,
    secondaryColor: data.secondary_color || fallbackSiteSettings.secondaryColor,
    defaultTheme: data.default_theme || fallbackSiteSettings.defaultTheme,
    languageDefault: data.language_default || fallbackSiteSettings.languageDefault,
    logoUrl: data.logo_url || fallbackSiteSettings.logoUrl
  }
}

export async function saveSiteSettings(settings) {
  const normalized = {
    websiteTitle: settings.websiteTitle || fallbackSiteSettings.websiteTitle,
    logoUrl: settings.logoUrl || '',
    primaryColor: settings.primaryColor || fallbackSiteSettings.primaryColor,
    secondaryColor: settings.secondaryColor || fallbackSiteSettings.secondaryColor,
    defaultTheme: settings.defaultTheme === 'light' ? 'light' : 'dark',
    languageDefault: settings.languageDefault === 'roman-urdu' ? 'roman-urdu' : 'en'
  }

  localStorage.setItem(localSettingsKey, JSON.stringify(normalized))
  localStorage.setItem('awt-theme', normalized.defaultTheme)
  window.dispatchEvent(new CustomEvent('awt-site-settings-saved', { detail: normalized }))
  if (!supabase) return normalized

  const payload = {
    website_title: normalized.websiteTitle,
    logo_url: normalized.logoUrl,
    primary_color: normalized.primaryColor,
    secondary_color: normalized.secondaryColor,
    default_theme: normalized.defaultTheme,
    language_default: normalized.languageDefault,
    updated_at: new Date().toISOString()
  }

  const existing = await supabase.from('site_settings').select('id').limit(1).maybeSingle()
  if (existing.error) throw existing.error

  const query = existing.data?.id
    ? supabase.from('site_settings').update(payload).eq('id', existing.data.id).select('id').single()
    : supabase.from('site_settings').insert(payload).select('id').single()

  const { error } = await query
  if (error) throw error
  return normalized
}

export async function fetchLectureForEdit(id) {
  if (!supabase) {
    const fallback = adminLectures.find((lecture) => lecture.id === id)
    return fallback
      ? {
          ...fallback,
          order_number: fallback.order,
          is_published: fallback.status === 'Published'
        }
      : null
  }

  const { data, error } = await supabase.from('lectures').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function saveLecture(formValues, thumbnailFile) {
  requireSupabase()

  const thumbnailUrl = await uploadMediaFile(thumbnailFile, 'lecture-thumbnails')
  const titleFromBlocks = formValues.content_blocks?.find((block) => block.type === 'heading')?.content?.text
  const title = formValues.title || titleFromBlocks || 'Untitled Lecture'
  const payload = {
    title,
    slug: normalizeSlug(title, formValues.slug),
    category: formValues.category,
    order_number: Number(formValues.order_number) || 0,
    short_description: formValues.short_description,
    english_content: formValues.english_content,
    roman_urdu_content: formValues.roman_urdu_content,
    code_examples: formValues.code_examples,
    notes: formValues.notes,
    resources: splitLines(formValues.resources),
    content_blocks: formValues.content_blocks || [],
    is_published: Boolean(formValues.is_published),
    updated_at: new Date().toISOString()
  }

  if (thumbnailUrl) payload.thumbnail_url = thumbnailUrl

  const query = formValues.id
    ? supabase.from('lectures').update(payload).eq('id', formValues.id).select('id,slug').single()
    : supabase.from('lectures').insert(payload).select('id,slug').single()

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function deleteLecture(id) {
  requireSupabase()
  const { error } = await supabase.from('lectures').delete().eq('id', id)
  if (error) throw error
}

export async function setLecturePublished(id, isPublished) {
  requireSupabase()
  const { error } = await supabase
    .from('lectures')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function fetchCustomComponents() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('custom_components')
    .select('id,name,block_type,block_template,created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('Unable to load custom components:', error.message)
    return []
  }

  return data || []
}

export async function createCustomComponent({ name, blockType, blockTemplate }) {
  requireSupabase()

  const { data, error } = await supabase
    .from('custom_components')
    .insert({
      name,
      slug: normalizeSlug(name, name),
      block_type: blockType,
      block_template: blockTemplate
    })
    .select('id,name,block_type,block_template,created_at')
    .single()

  if (error) throw error
  return data
}

export async function fetchLabForEdit(id) {
  if (!supabase) {
    const fallback = adminLabs.find((lab) => lab.id === id)
    return fallback
      ? {
          ...fallback,
          title: fallback.title,
          lab_number: fallback.number,
          is_published: fallback.status === 'Published'
        }
      : null
  }

  const { data, error } = await supabase.from('labs').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function saveLab(formValues) {
  requireSupabase()

  const payload = {
    title: formValues.title,
    slug: normalizeSlug(formValues.title, formValues.slug || `lab-${formValues.lab_number}`),
    lab_number: Number(formValues.lab_number) || 0,
    objective: formValues.objective,
    required_tools: splitLines(formValues.required_tools),
    steps: splitLines(formValues.steps),
    code_examples: formValues.code_examples,
    output_preview: formValues.output_preview,
    common_errors: splitLines(formValues.common_errors),
    tips: splitLines(formValues.tips),
    content_blocks: formValues.content_blocks || [],
    is_published: Boolean(formValues.is_published),
    updated_at: new Date().toISOString()
  }

  const query = formValues.id
    ? supabase.from('labs').update(payload).eq('id', formValues.id).select('id,slug').single()
    : supabase.from('labs').insert(payload).select('id,slug').single()

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function deleteLab(id) {
  requireSupabase()
  const { error } = await supabase.from('labs').delete().eq('id', id)
  if (error) throw error
}

export async function setLabPublished(id, isPublished) {
  requireSupabase()
  const { error } = await supabase
    .from('labs')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function saveActivity(formValues) {
  requireSupabase()

  const payload = {
    title: formValues.title,
    slug: normalizeSlug(formValues.title, formValues.slug),
    type: formValues.type,
    description: formValues.description,
    deadline: formValues.deadline || null,
    is_published: Boolean(formValues.is_published),
    updated_at: new Date().toISOString()
  }

  const query = formValues.id
    ? supabase.from('activities').update(payload).eq('id', formValues.id).select('id').single()
    : supabase.from('activities').insert(payload).select('id').single()

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function deleteActivity(id) {
  requireSupabase()
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw error
}

export async function setActivityPublished(id, isPublished) {
  requireSupabase()
  const { error } = await supabase
    .from('activities')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export function lectureToFormValues(lecture) {
  return {
    id: lecture?.id || '',
    title: lecture?.title || '',
    slug: lecture?.slug || '',
    category: lecture?.category || '',
    order_number: lecture?.order_number ?? '',
    short_description: lecture?.short_description || '',
    english_content: lecture?.english_content || '',
    roman_urdu_content: lecture?.roman_urdu_content || '',
    code_examples: lecture?.code_examples || '',
    notes: lecture?.notes || '',
    resources: stringifyList(lecture?.resources),
    content_blocks: lecture?.content_blocks || [],
    is_published: Boolean(lecture?.is_published)
  }
}

export function labToFormValues(lab) {
  return {
    id: lab?.id || '',
    title: lab?.title || '',
    slug: lab?.slug || '',
    lab_number: lab?.lab_number ?? '',
    objective: lab?.objective || '',
    required_tools: stringifyList(lab?.required_tools),
    steps: stringifyList(lab?.steps),
    code_examples: lab?.code_examples || '',
    output_preview: lab?.output_preview || '',
    common_errors: stringifyList(lab?.common_errors),
    tips: stringifyList(lab?.tips),
    content_blocks: lab?.content_blocks || [],
    is_published: Boolean(lab?.is_published)
  }
}
