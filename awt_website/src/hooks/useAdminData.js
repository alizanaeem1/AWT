import { useEffect, useState } from 'react'
import { adminActivities, adminLabs, adminLectures } from '../admin/adminDemoData.js'
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
  logoUrl: ''
}

function useAsyncData(fetcher, initialData) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      const nextData = await fetcher()
      if (isMounted) {
        setData(nextData)
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [fetcher])

  return { data, isLoading }
}

export function useAdminLectures() {
  return useAsyncData(fetchAdminLectures, adminLectures)
}

export function useAdminLabs() {
  return useAsyncData(fetchAdminLabs, adminLabs)
}

export function useAdminActivities() {
  return useAsyncData(fetchAdminActivities, adminActivities)
}

export function useSiteSettings() {
  return useAsyncData(fetchSiteSettings, fallbackSettings)
}
