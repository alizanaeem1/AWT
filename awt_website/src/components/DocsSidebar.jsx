import { CheckCircle2, ChevronDown, Circle, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { contentTypeLabels } from '../data/contentDatabase.js'
import { useContentProgress } from '../hooks/useContentProgress.js'

const contentTypeOrder = ['lecture', 'lab', 'activity']

function groupContent(content) {
  return contentTypeOrder.map((type) => ({
    type,
    title: contentTypeLabels[type],
    groups: Object.values(
      content
        .filter((item) => item.type === type)
        .sort((first, second) => first.order - second.order)
        .reduce((groups, item) => {
          const groupName = item.group || 'General'
          groups[groupName] ??= { title: groupName, items: [] }
          groups[groupName].items.push(item)
          return groups
        }, {})
    )
  }))
}

export default function DocsSidebar({ activeSlug, content, isOpen, onClose, searchQuery, onSearchChange }) {
  const readContent = useContentProgress()
  const activeItemRef = useRef(null)
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const groupedContent = useMemo(() => groupContent(content), [content])
  const visibleSections = useMemo(() => {
    if (!normalizedSearch) return groupedContent

    return groupedContent
      .map((section) => ({
        ...section,
        groups: section.groups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
              [item.title, item.group, item.type].join(' ').toLowerCase().includes(normalizedSearch)
            )
          }))
          .filter((group) => group.items.length > 0)
      }))
      .filter((section) => section.groups.length > 0)
  }, [groupedContent, normalizedSearch])
  const initialOpen = useMemo(
    () =>
      groupedContent.reduce((sections, section) => {
        sections[section.title] =
          section.type === 'lecture' ||
          section.groups.some((group) => group.items.some((item) => item.slug === activeSlug))
        section.groups.forEach((group) => {
          sections[`${section.title}:${group.title}`] = group.items.some((item) => item.slug === activeSlug)
        })
        return sections
      }, {}),
    [activeSlug, groupedContent]
  )
  const [openSections, setOpenSections] = useState(initialOpen)

  useEffect(() => {
    window.setTimeout(() => {
      setOpenSections((current) => ({ ...current, ...initialOpen }))
    }, 0)
  }, [initialOpen])

  useEffect(() => {
    window.setTimeout(() => {
      activeItemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 80)
  }, [activeSlug])

  function toggleSection(key) {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-slate-950/70 transition lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        ].join(' ')}
        onClick={onClose}
      />
      <aside
        className={[
          'fixed bottom-0 left-0 top-16 z-50 w-72 border-r border-slate-800 bg-slate-950 transition-transform lg:z-30 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        ].join(' ')}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 lg:hidden">
            <span className="text-sm font-semibold text-white">Documentation</span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-slate-800 p-3 md:hidden">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="Search docs"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visibleSections.map((section) => {
              const hasActiveItem = section.groups.some((group) =>
                group.items.some((item) => item.slug === activeSlug)
              )
              const isExpanded = normalizedSearch ? true : (openSections[section.title] ?? hasActiveItem)

              return (
                <div key={section.title} className="mb-2">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:bg-slate-900 hover:text-white"
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      className={[
                        'h-4 w-4 text-slate-500 transition',
                        isExpanded ? 'rotate-180' : ''
                      ].join(' ')}
                    />
                  </button>
                  {isExpanded ? (
                    <div className="mt-1 space-y-1 pl-2">
                      {section.groups.map((group) => {
                        const groupKey = `${section.title}:${group.title}`
                        const hasActiveGroupItem = group.items.some((item) => item.slug === activeSlug)
                        const isGroupExpanded = normalizedSearch
                          ? true
                          : (openSections[groupKey] ?? hasActiveGroupItem)

                        return (
                          <div key={groupKey}>
                            <button
                              type="button"
                              onClick={() => toggleSection(groupKey)}
                              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-bold uppercase tracking-normal text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
                            >
                              <span>{group.title}</span>
                              <ChevronDown
                                className={[
                                  'h-3.5 w-3.5 transition',
                                  isGroupExpanded ? 'rotate-180' : ''
                                ].join(' ')}
                              />
                            </button>
                            {isGroupExpanded ? (
                              <div className="space-y-1 pl-2">
                                {group.items.map((item) => {
                                  const isRead = readContent.has(item.id)

                                  return (
                                    <NavLink
                                      key={item.id}
                                      to={item.path}
                                      ref={activeSlug === item.slug ? activeItemRef : null}
                                      onClick={onClose}
                                      className={({ isActive }) =>
                                        [
                                          'flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition',
                                          isActive || activeSlug === item.slug
                                            ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                                            : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                                        ].join(' ')
                                      }
                                    >
                                      {isRead ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                                      ) : (
                                        <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                                      )}
                                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                                    </NavLink>
                                  )
                                })}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
            {visibleSections.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-500">No matching content found.</p>
            ) : null}
          </nav>
        </div>
      </aside>
    </>
  )
}
