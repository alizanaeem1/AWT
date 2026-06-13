import { useEffect, useMemo } from 'react'
import { LanguageContext } from './language.js'

const STORAGE_KEY = 'awt-language'

export function LanguageProvider({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'en')
    }
  }, [])

  const value = useMemo(
    () => ({
      language: 'en',
      setLanguage: () => {}
    }),
    []
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}
