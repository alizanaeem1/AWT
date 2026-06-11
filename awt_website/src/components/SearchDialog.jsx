import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'

function Highlight({ text, query }) {
  if (!query) return text
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-cyan-300 px-0.5 text-slate-950">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}

export default function SearchDialog({ content, isOpen, onClose, query, onQueryChange }) {
  const inputRef = useRef(null)
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return content.slice(0, 8)

    return content
      .filter((item) => [item.title, item.group, item.type].join(' ').toLowerCase().includes(normalized))
      .slice(0, 12)
  }, [content, query])

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/80 px-4 py-20 backdrop-blur" onClick={onClose}>
      <section
        className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search lectures, labs, and activities"
            className="h-14 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-900 hover:text-white" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={onClose}
              className="block rounded-lg px-4 py-3 transition hover:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-100"><Highlight text={item.title} query={query} /></p>
                <span className="rounded-md border border-slate-800 px-2 py-1 text-xs font-bold uppercase text-slate-500">{item.type}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500"><Highlight text={item.group || 'General'} query={query} /></p>
            </Link>
          ))}
          {results.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">No results found.</p> : null}
        </div>
      </section>
    </div>
  )
}
