import { useEffect, useState } from 'react'
import { getReadContent, subscribeToProgress } from '../lib/progressStore.js'

export function useContentProgress() {
  const [readContent, setReadContent] = useState(getReadContent)

  useEffect(() => {
    return subscribeToProgress(() => setReadContent(getReadContent()))
  }, [])

  return new Set(readContent)
}
