import { useTheme } from '../hooks/useTheme.js'
import { getLogoText } from '../lib/siteBrand.js'

export default function BrandLogo({ className = '', imageClassName = '', fallbackClassName = '' }) {
  const { logoUrl, logoText, websiteTitle } = useTheme()
  const fallbackText = getLogoText(logoText, websiteTitle)
  const isLongText = fallbackText.length > 4
  const wordCount = fallbackText.split(/\s+/).filter(Boolean).length
  const fallbackStyle = isLongText
    ? {
        width: `${Math.min(28, Math.max(5.5, fallbackText.length * 0.85 + wordCount))}ch`,
        maxWidth: '100%'
      }
    : undefined
  const textStyle = isLongText
    ? {
        fontSize: `${Math.max(0.5, Math.min(0.875, 1.05 - fallbackText.length * 0.02))}rem`
      }
    : undefined

  if (logoUrl) {
    return (
      <span className={`inline-flex shrink-0 overflow-hidden ${className}`}>
        <img
          src={logoUrl}
          alt={websiteTitle}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      </span>
    )
  }

  // Remove override text classes if they interfere, and render with a premium gradient
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden font-black tracking-wider shadow-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 hover:brightness-110 active:scale-95 transition-all duration-200 ${className} ${fallbackClassName}`}
      style={{
        color: '#020617',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        ...fallbackStyle
      }}
      title={fallbackText}
    >
      <span className="block max-w-full truncate whitespace-nowrap px-1 text-center leading-none uppercase" style={textStyle}>
        {fallbackText}
      </span>
    </span>
  )
}
