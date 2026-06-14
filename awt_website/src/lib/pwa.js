export const pwaManifests = {
  student: '/manifest-student.json',
  admin: '/manifest-admin.json'
}

export function setManifest(type = 'student') {
  if (typeof document === 'undefined') return

  const href = pwaManifests[type] || pwaManifests.student
  let link = document.querySelector('link[rel="manifest"]')

  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }

  if (link.getAttribute('href') !== href) {
    link.setAttribute('href', href)
  }
}

export function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false

  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function isIOSDevice() {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent || ''
  const platform = window.navigator.platform || ''
  const isTouchMac = platform === 'MacIntel' && window.navigator.maxTouchPoints > 1

  return /iphone|ipad|ipod/i.test(ua) || isTouchMac
}
