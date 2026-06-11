import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function formatType(type) {
  return type ? type[0].toUpperCase() + type.slice(1) : 'Docs'
}

export default function DocsPageTools({ content, activeSlug }) {
  const location = useLocation()
  const [readingTime, setReadingTime] = useState('1 min read')
  const currentIndex = useMemo(
    () => content.findIndex((item) => item.slug === activeSlug || item.path === location.pathname),
    [activeSlug, content, location.pathname]
  )
  const current = currentIndex >= 0 ? content[currentIndex] : null
  const previous = currentIndex > 0 ? content[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < content.length - 1 ? content[currentIndex + 1] : null

  useEffect(() => {
    window.setTimeout(() => {
      const text = document.querySelector('main article')?.innerText || ''
      const words = text.trim().split(/\s+/).filter(Boolean).length
      setReadingTime(`${Math.max(1, Math.ceil(words / 220))} min read`)
    }, 0)
  }, [location.pathname])

  if (!current && location.pathname === '/') return null

  return (
    <div className="border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2 text-slate-500">
          <Link to="/" className="font-semibold hover:text-cyan-500">Home</Link>
          <span>/</span>
          <span>{formatType(current?.type)}</span>
          {current ? (
            <>
              <span>/</span>
              <span className="truncate text-slate-800 dark:text-slate-200">{current.title}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-slate-800">{readingTime}</span>
          {previous ? (
            <Link to={previous.path} className="inline-flex items-center gap-1 text-slate-500 hover:text-cyan-400" aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Link>
          ) : null}
          {next ? (
            <Link to={next.path} className="inline-flex items-center gap-1 text-slate-500 hover:text-cyan-400" aria-label="Next page">
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
