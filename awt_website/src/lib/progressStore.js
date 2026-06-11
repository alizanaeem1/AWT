const progressKey = 'awt-content-progress'
const labStepsKey = 'awt-lab-step-progress'
const progressEvent = 'awt-progress-change'

function emitProgressChange() {
  window.dispatchEvent(new CustomEvent(progressEvent))
}

export function getReadContent() {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(progressKey)) ?? []
  } catch {
    return []
  }
}

export function isContentRead(id) {
  return getReadContent().includes(id)
}

export function setContentRead(id, isRead) {
  const current = new Set(getReadContent())

  if (isRead) {
    current.add(id)
  } else {
    current.delete(id)
  }

  window.localStorage.setItem(progressKey, JSON.stringify([...current]))
  emitProgressChange()
}

export function replaceReadContent(ids) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(progressKey, JSON.stringify(ids))
  emitProgressChange()
}

export function subscribeToProgress(listener) {
  window.addEventListener(progressEvent, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(progressEvent, listener)
    window.removeEventListener('storage', listener)
  }
}

export function getLabStepProgress(labId) {
  if (typeof window === 'undefined') return []

  try {
    const progress = JSON.parse(window.localStorage.getItem(labStepsKey)) ?? {}
    return progress[labId] ?? []
  } catch {
    return []
  }
}

export function setLabStepProgress(labId, checkedSteps) {
  const progress = JSON.parse(window.localStorage.getItem(labStepsKey) ?? '{}')
  progress[labId] = checkedSteps
  window.localStorage.setItem(labStepsKey, JSON.stringify(progress))
  emitProgressChange()
}

export function getAllLabStepProgress() {
  if (typeof window === 'undefined') return {}

  try {
    return JSON.parse(window.localStorage.getItem(labStepsKey)) ?? {}
  } catch {
    return {}
  }
}

export function replaceLabStepProgress(progress) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(labStepsKey, JSON.stringify(progress))
  emitProgressChange()
}
