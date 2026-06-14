import { useCallback, useEffect, useState } from 'react'
import { isIOSDevice, isStandaloneDisplayMode, setManifest } from '../lib/pwa.js'

let deferredPrompt = null
const listeners = new Set()

function notifyListeners() {
  listeners.forEach((listener) => listener(Boolean(deferredPrompt)))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    notifyListeners()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifyListeners()
  })
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(Boolean(deferredPrompt))
  const [installResult, setInstallResult] = useState(null)
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplayMode)
  const isIOS = isIOSDevice()

  useEffect(() => {
    function handleCanInstall(nextCanInstall) {
      setCanInstall(nextCanInstall)
    }

    listeners.add(handleCanInstall)
    setCanInstall(Boolean(deferredPrompt))

    const media = window.matchMedia?.('(display-mode: standalone)')
    const handleDisplayModeChange = () => setIsStandalone(isStandaloneDisplayMode())

    media?.addEventListener?.('change', handleDisplayModeChange)

    return () => {
      listeners.delete(handleCanInstall)
      media?.removeEventListener?.('change', handleDisplayModeChange)
    }
  }, [])

  const installApp = useCallback(async (type = 'student') => {
    setManifest(type)

    if (!deferredPrompt || isStandaloneDisplayMode()) {
      return { outcome: 'unavailable' }
    }

    const promptEvent = deferredPrompt
    deferredPrompt = null
    notifyListeners()

    await promptEvent.prompt()
    const choiceResult = await promptEvent.userChoice
    const outcome = choiceResult?.outcome || 'dismissed'

    setInstallResult(outcome)
    return { outcome }
  }, [])

  return {
    canInstall: canInstall && !isStandalone,
    installApp,
    installResult,
    isIOS,
    isStandalone
  }
}
