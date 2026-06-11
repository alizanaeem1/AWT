import { ListTree, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

function slugifyHeading(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function TocNav({ headings, activeId, onNavigate }) {
  return (
    <nav className="space-y-2">
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          onClick={onNavigate}
          className={[
            'block rounded-md border-l-2 px-3 py-1.5 text-sm transition',
            heading.level === 3 ? 'ml-3' : '',
            activeId === heading.id
              ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
              : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-cyan-200'
          ].join(' ')}
        >
          {heading.title}
        </a>
      ))}
    </nav>
  )
}

export default function OnThisPage({ headings: fallbackHeadings = [] }) {
  const location = useLocation()
  const [headings, setHeadings] = useState(fallbackHeadings)
  const [activeId, setActiveId] = useState(fallbackHeadings[0]?.id)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    window.setTimeout(() => {
      const detected = [...document.querySelectorAll('main article h1, main article h2, main article h3')]
        .map((heading) => {
          if (!heading.id) heading.id = slugifyHeading(heading.innerText)
          return {
            id: heading.id,
            title: heading.innerText,
            level: Number(heading.tagName.replace('H', ''))
          }
        })
        .filter((heading) => heading.id && heading.title)
      const nextHeadings = detected.length ? detected : fallbackHeadings
      setHeadings(nextHeadings)
      setActiveId(nextHeadings[0]?.id)
    }, 0)
  }, [fallbackHeadings, location.pathname])

  useEffect(() => {
    const sections = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0]

        if (visibleEntry) setActiveId(visibleEntry.target.id)
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: [0, 1] }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [headings])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-200 shadow-xl xl:hidden"
        aria-label="Open table of contents"
      >
        <ListTree className="h-5 w-5" />
      </button>

      <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-64 shrink-0 border-l border-slate-800 px-6 py-8 xl:block">
        <p className="mb-4 text-xs font-bold uppercase tracking-normal text-slate-500">On This Page</p>
        <TocNav headings={headings} activeId={activeId} />
      </aside>

      <div className={['fixed inset-0 z-[75] bg-slate-950/70 transition xl:hidden', isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'].join(' ')} onClick={() => setIsOpen(false)} />
      <aside className={['fixed bottom-0 right-0 top-0 z-[80] w-80 border-l border-slate-800 bg-slate-950 p-5 transition-transform xl:hidden', isOpen ? 'translate-x-0' : 'translate-x-full'].join(' ')}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold uppercase text-slate-500">On This Page</p>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-white" aria-label="Close table of contents">
            <X className="h-5 w-5" />
          </button>
        </div>
        <TocNav headings={headings} activeId={activeId} onNavigate={() => setIsOpen(false)} />
      </aside>
    </>
  )
}
