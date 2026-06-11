import { useEffect, useMemo, useState } from 'react'
import { fetchSiteSettings } from '../lib/adminRepository.js'
import { ThemeContext } from './theme.js'

const storageKey = 'awt-theme'
const settingsKey = 'awt-site-settings'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const savedTheme = window.localStorage.getItem(storageKey)
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  return 'dark'
}

// Convert hex color to RGB values for rgba() usage
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null
}

function applyBrandColors(primaryColor, secondaryColor) {
  if (!primaryColor && !secondaryColor) return

  const p = primaryColor || '#34d399'
  const s = secondaryColor || '#22d3ee'
  const pRgb = hexToRgb(p)
  const sRgb = hexToRgb(s)

  // Remove any existing brand style tag
  const existing = document.getElementById('awt-brand-style')
  if (existing) existing.remove()

  // Inject new style overrides
  const style = document.createElement('style')
  style.id = 'awt-brand-style'
  style.textContent = `
    :root {
      --color-primary: ${p};
      --color-secondary: ${s};
      --color-primary-rgb: ${pRgb};
      --color-secondary-rgb: ${sRgb};
    }

    /* Override key emerald/cyan classes with brand primary color */
    .bg-emerald-400  { background-color: ${p} !important; }
    .text-emerald-400 { color: ${p} !important; }
    .text-emerald-300 { color: ${p} !important; }
    .border-emerald-400 { border-color: ${p} !important; }
    .ring-emerald-400\\/20 { --tw-ring-color: ${p}33 !important; }
    .bg-emerald-400\\/10 { background-color: ${p}1a !important; }
    .bg-emerald-400\\/15 { background-color: ${p}26 !important; }
    .bg-emerald-400\\/20 { background-color: ${p}33 !important; }
    .from-emerald-400 { --tw-gradient-from: ${p} !important; }
    .to-emerald-400  { --tw-gradient-to: ${p} !important; }
    .hover\\:bg-emerald-300:hover { background-color: ${p}ee !important; }
    .hover\\:text-emerald-300:hover { color: ${p}ee !important; }
    .focus\\:border-emerald-400:focus { border-color: ${p} !important; }
    .shadow-emerald-400\\/20 { --tw-shadow-color: ${p}33 !important; }

    /* Override cyan classes with brand secondary color */
    .text-cyan-300   { color: ${s} !important; }
    .text-cyan-400   { color: ${s} !important; }
    .from-cyan-400   { --tw-gradient-from: ${s} !important; }
    .to-cyan-400     { --tw-gradient-to: ${s} !important; }
    .bg-cyan-400\\/10 { background-color: ${s}1a !important; }
    .ring-cyan-400\\/20 { --tw-ring-color: ${s}33 !important; }
  `
  document.head.appendChild(style)
}

function applyTitle(websiteTitle) {
  if (websiteTitle) document.title = websiteTitle
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    let isMounted = true

    // Apply any locally cached settings immediately (no flicker)
    const cached = JSON.parse(localStorage.getItem(settingsKey) || 'null')
    if (cached) {
      applyBrandColors(cached.primaryColor, cached.secondaryColor)
      applyTitle(cached.websiteTitle)
    }

    async function loadSettings() {
      try {
        const settings = await fetchSiteSettings()
        if (!isMounted) return

        if (settings.defaultTheme === 'light' || settings.defaultTheme === 'dark') {
          setTheme(settings.defaultTheme)
        }
        applyBrandColors(settings.primaryColor, settings.secondaryColor)
        applyTitle(settings.websiteTitle)
      } catch (error) {
        console.warn('Unable to load site settings:', error.message)
      }
    }

    // Listen for live saves from Theme Settings page
    function handleSettingsSaved(event) {
      const detail = event.detail
      if (!detail) return
      if (detail.defaultTheme === 'light' || detail.defaultTheme === 'dark') {
        setTheme(detail.defaultTheme)
      }
      applyBrandColors(detail.primaryColor, detail.secondaryColor)
      applyTitle(detail.websiteTitle)
    }

    loadSettings()
    window.addEventListener('awt-site-settings-saved', handleSettingsSaved)

    return () => {
      isMounted = false
      window.removeEventListener('awt-site-settings-saved', handleSettingsSaved)
    }
  }, [])

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    window.localStorage.setItem(storageKey, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
