import { useEffect, useState } from 'react'
import {
  fetchAdminActivities,
  fetchAdminLabs,
  fetchAdminLectures,
  fetchSiteSettings
} from '../lib/adminRepository.js'

const fallbackSettings = {
  websiteTitle: 'AWT Interactive Learning Platform',
  primaryColor: '#34d399',
  secondaryColor: '#22d3ee',
  defaultTheme: 'dark',
  languageDefault: 'en',
  logoUrl: '',
  logoText: 'AWT'
}

/**
 * Generic async data hook.
 * - Starts with empty array (or fallback for settings) and isLoading=true
 * - Never pre-fills with stale demo data
 * - Uses ignore flag to prevent stale responses from updating state
 * - Re-fetches on every mount (page navigation triggers clean fetch)
 */
function useAsyncData(fetcher, emptyValue = []) {
  const [data, setData] = useState(emptyValue)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    // Reset to empty + loading on every mount
    setData(emptyValue)
    setIsLoading(true)

    async function loadData() {
      try {
        const result = await fetcher()
        if (!ignore) {
          setData(result)
        }
      } catch {
        // keep empty on error
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, isLoading }
}

export function useAdminLectures() {
  return useAsyncData(fetchAdminLectures, [])
}

export function useAdminLabs() {
  return useAsyncData(fetchAdminLabs, [])
}

export function useAdminActivities() {
  return useAsyncData(fetchAdminActivities, [])
}

export function useSiteSettings() {
  return useAsyncData(fetchSiteSettings, fallbackSettings)
}
