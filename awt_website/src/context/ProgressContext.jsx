import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import {
  getAllLabStepProgress,
  getReadContent,
  replaceLabStepProgress,
  replaceReadContent,
  setContentRead,
  setLabStepProgress
} from '../lib/progressStore.js'
import {
  fetchUserProgress,
  saveLabProgress,
  saveLectureProgress
} from '../lib/progressRepository.js'
import { ProgressContext } from './progress.js'

function hydrateLocalProgress(records) {
  const completedIds = records
    .filter((record) => record.status === 'completed' || record.percent === 100)
    .map((record) => record.content_id)
  const labSteps = records
    .filter((record) => record.content_type === 'lab')
    .reduce((progress, record) => {
      progress[record.content_id] = record.metadata?.checked_steps || []
      return progress
    }, {})

  replaceReadContent(completedIds)
  replaceLabStepProgress(labSteps)
}

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [isProgressLoading, setIsProgressLoading] = useState(Boolean(user))
  const [progressMessage, setProgressMessage] = useState('')

  const refreshProgress = useCallback(async () => {
    if (!user) {
      setRecords([])
      setIsProgressLoading(false)
      return []
    }

    setIsProgressLoading(true)
    const nextRecords = await fetchUserProgress(user.id)
    setRecords(nextRecords)
    hydrateLocalProgress(nextRecords)
    setIsProgressLoading(false)
    return nextRecords
  }, [user])

  useEffect(() => {
    let isMounted = true

    async function loadProgress() {
      if (!user) {
        window.setTimeout(() => {
          if (isMounted) {
            setRecords([])
            setIsProgressLoading(false)
          }
        }, 0)
        return
      }

      try {
        const nextRecords = await fetchUserProgress(user.id)
        if (!isMounted) return
        setRecords(nextRecords)
        hydrateLocalProgress(nextRecords)
        setIsProgressLoading(false)
      } catch (error) {
        console.warn('Unable to load progress:', error.message)
        if (isMounted) setIsProgressLoading(false)
      }
    }

    loadProgress()

    return () => {
      isMounted = false
    }
  }, [user])

  const markLectureRead = useCallback(async ({ contentId, title, isRead }) => {
    if (!user) {
      setProgressMessage('Please sign in to track your learning history.')
      return
    }

    setContentRead(contentId, isRead)
    await saveLectureProgress({ profileId: user.id, contentId, title, isRead })
    await refreshProgress()
    setProgressMessage(isRead ? 'Lecture marked as read.' : 'Lecture marked as unread.')
  }, [refreshProgress, user])

  const saveLabSteps = useCallback(async ({ contentId, title, checkedSteps, totalSteps }) => {
    if (!user) {
      setProgressMessage('Please sign in to track your learning history.')
      return
    }

    setLabStepProgress(contentId, checkedSteps)
    setContentRead(contentId, totalSteps > 0 && checkedSteps.length === totalSteps)
    await saveLabProgress({ profileId: user.id, contentId, title, checkedSteps, totalSteps })
    await refreshProgress()
    setProgressMessage('Lab progress saved.')
  }, [refreshProgress, user])

  const value = useMemo(() => ({
    records,
    isProgressLoading,
    progressMessage,
    refreshProgress,
    markLectureRead,
    saveLabSteps,
    readIds: new Set(getReadContent()),
    labSteps: getAllLabStepProgress()
  }), [isProgressLoading, markLectureRead, progressMessage, records, refreshProgress, saveLabSteps])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
