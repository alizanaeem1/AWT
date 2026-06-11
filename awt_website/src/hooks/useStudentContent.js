import { useEffect, useState } from 'react'
import { getPublishedLabs, getPublishedLectures, subscribeToContentChanges } from '../lib/contentRepository.js'

export function useStudentContent() {
  const [lectures, setLectures] = useState([])
  const [labs, setLabs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadContent() {
      const [nextLectures, nextLabs] = await Promise.all([getPublishedLectures(), getPublishedLabs()])
      if (!isMounted) return
      setLectures(nextLectures)
      setLabs(nextLabs)
      setIsLoading(false)
    }

    loadContent()
    const unsubscribe = subscribeToContentChanges(loadContent)

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return { lectures, labs, isLoading }
}
