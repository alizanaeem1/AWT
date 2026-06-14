import { supabase } from './supabase.js'

const localHiddenKey = (userId) => `awt-hidden-notifications-${userId || 'guest'}`

function notificationTitle(type) {
  if (type === 'lab') return 'New Lab Added'
  if (type === 'activity') return 'New Activity Added'
  return 'New Lecture Added'
}

function notificationMessage(type, title) {
  if (type === 'lab') return `${title} is now available in your labs.`
  if (type === 'activity') return `${title} is now available in your activities.`
  return `${title} is now available in your lectures.`
}

export function getNotificationPath(notification) {
  if (notification.type === 'lab') return `/student/labs/${notification.content_slug}`
  if (notification.type === 'activity') return '/student'
  return `/student/lectures/${notification.content_slug}`
}

export function readHiddenNotifications(userId) {
  try {
    const value = JSON.parse(localStorage.getItem(localHiddenKey(userId)) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function hideNotifications(userId, ids) {
  const nextIds = [...new Set([...readHiddenNotifications(userId), ...ids])]
  localStorage.setItem(localHiddenKey(userId), JSON.stringify(nextIds))
  return nextIds
}

export async function fetchNotifications(userId) {
  const hiddenIds = readHiddenNotifications(userId)

  if (!supabase) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,message,type,content_id,content_slug,is_read,created_at')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.warn('Unable to load notifications:', error.message)
    return []
  }

  return (data || []).filter((notification) => !hiddenIds.includes(notification.id))
}

export async function markNotificationRead(id) {
  if (!supabase || !id) return

  const { error } = await supabase.rpc('mark_notifications_read', { notification_ids: [id] })

  if (error) console.warn('Unable to mark notification as read:', error.message)
}

export async function markAllNotificationsRead(ids) {
  if (!supabase || !ids.length) return

  const { error } = await supabase.rpc('mark_notifications_read', { notification_ids: ids })

  if (error) console.warn('Unable to mark notifications as read:', error.message)
}

export async function createPublishNotification({ type, contentId, slug, title }) {
  if (!supabase || !contentId || !slug || !title) return

  const normalizedType = type || 'lecture'
  const payload = {
    title: notificationTitle(normalizedType),
    message: notificationMessage(normalizedType, title),
    type: normalizedType,
    content_id: String(contentId),
    content_slug: slug,
    is_read: false
  }

  const { error } = await supabase
    .from('notifications')
    .upsert(payload, { onConflict: 'type,content_id' })

  if (error) console.warn('Unable to create notification:', error.message)
}

export function subscribeToNotifications(onChange) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel(`student-notifications-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
