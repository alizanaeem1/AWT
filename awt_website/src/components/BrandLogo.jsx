import { useTheme } from '../hooks/useTheme.js'
import { getLogoText } from '../lib/siteBrand.js'

export default function BrandLogo({ className = '', imageClassName = '', fallbackClassName = '' }) {
  const { logoUrl, logoText, websiteTitle } = useTheme()
  const fallbackText = getLogoText(logoText, websiteTitle)
  const isLongText = fallbackText.length > 2
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

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className} ${fallbackClassName}`}
      style={fallbackStyle}
      title={fallbackText}
    >
      <span className="block max-w-full whitespace-nowrap px-1.5 text-center leading-tight" style={textStyle}>
        {fallbackText}
      </span>
    </span>
  )
}
