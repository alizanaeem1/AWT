import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './auth.js'

const adminEmails = String(import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

function isAdminEmail(email) {
  const cleanEmail = String(email || '').toLowerCase().trim()
  return cleanEmail === 'alizanaeem37@gmail.com' || adminEmails.includes(cleanEmail)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))

  const loadProfile = useCallback(async (userId, userEmail = '') => {
    if (!supabase || !userId) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,email,role,avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      if (error.message?.includes('email')) {
        const fallback = await supabase
          .from('profiles')
          .select('id,full_name,role,avatar_url')
          .eq('id', userId)
          .maybeSingle()

        if (!fallback.error) {
          const synced = await syncAdminProfile(fallback.data, userId, userEmail)
          if (synced && isAdminEmail(userEmail)) {
            synced.role = 'admin'
          }
          setProfile(synced)
          return synced
        }
      }

      console.warn('Unable to load profile:', error.message)
      if (isAdminEmail(userEmail)) {
        const fallbackAdmin = { id: userId, email: userEmail, role: 'admin', full_name: 'Admin User' }
        setProfile(fallbackAdmin)
        return fallbackAdmin
      }
      setProfile(null)
      return null
    }

    const synced = await syncAdminProfile(data, userId, userEmail)
    if (synced && isAdminEmail(userEmail)) {
      synced.role = 'admin'
    }
    setProfile(synced)
    return synced
  }, [])

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return

      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id, data.session.user.email)
      setIsLoading(false)
    }

    loadSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        loadProfile(nextSession.user.id, nextSession.user.email)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const nextProfile = await loadProfile(data.user.id, data.user.email)
    return { session: data.session, user: data.user, profile: nextProfile }
  }, [loadProfile])

  const signUp = useCallback(async ({ email, password, fullName }) => {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || '' } }
    })

    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName || '',
        role: 'student',
        updated_at: new Date().toISOString()
      })
      if (profileError) {
        const { error: fallbackError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName || '',
          role: 'student',
          updated_at: new Date().toISOString()
        })
        if (fallbackError) console.warn('Unable to create student profile:', fallbackError.message)
      }
      await loadProfile(data.user.id, data.user.email)
    }

    return data
  }, [loadProfile])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      isAdmin: profile?.role === 'admin',
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile: () => loadProfile(session?.user?.id, session?.user?.email)
    }),
    [isLoading, loadProfile, profile, session, signIn, signOut, signUp]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

async function syncAdminProfile(profile, userId, userEmail) {
  if (!isAdminEmail(userEmail)) return profile

  const nextProfile = {
    ...(profile || {}),
    id: userId,
    email: userEmail,
    role: 'admin'
  }

  if (profile?.role === 'admin') return nextProfile

  const payload = {
    id: userId,
    email: userEmail,
    full_name: profile?.full_name || 'Admin User',
    role: 'admin',
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase.from('profiles').upsert(payload)
  if (error) console.warn('Unable to sync admin profile:', error.message)
  return nextProfile
}
