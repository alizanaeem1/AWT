export const defaultWebsiteTitle = 'AWT Interactive Learning Platform'
export const defaultLogoText = 'AWT'

export function getWebsiteInitials(title = defaultWebsiteTitle) {
  const words = String(title)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) return 'AWT'
  
  const firstWord = words[0].toUpperCase()
  if (firstWord === 'AWT') return 'AWT'

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function getLogoText(logoText, title = defaultWebsiteTitle) {
  const text = String(logoText || '').trim()
  return text || getWebsiteInitials(title) || defaultLogoText
}
