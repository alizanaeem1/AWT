import { useEffect, useState } from 'react'
import { contentDatabase } from '../data/contentDatabase.js'
import { getPublishedContent, subscribeToContentChanges } from '../lib/contentRepository.js'

export function useDocsContent() {
  const [content, setContent] = useState(contentDatabase)

  useEffect(() => {
    let isMounted = true

    async function refreshContent() {
      const nextContent = await getPublishedContent()
      if (isMounted) setContent(nextContent)
    }

    refreshContent()
    const unsubscribe = subscribeToContentChanges(refreshContent)

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return content
}
