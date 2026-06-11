import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import CodeCopyEnhancer from '../components/CodeCopyEnhancer.jsx'
import DocsPageTools from '../components/DocsPageTools.jsx'
import DocsNavbar from '../components/DocsNavbar.jsx'
import DocsSidebar from '../components/DocsSidebar.jsx'
import OnThisPage from '../components/OnThisPage.jsx'
import ReadingProgress from '../components/ReadingProgress.jsx'
import SearchDialog from '../components/SearchDialog.jsx'
import { docsHeadings, lectureHeadings } from '../data/docsNavigation.js'
import { examLabHeadings, labHeadings } from '../data/labs.js'
import { useDocsContent } from '../hooks/useDocsContent.js'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [language, setLanguage] = useState(() => window.localStorage.getItem('awt-language') || 'EN')
  const [searchQuery, setSearchQuery] = useState('')
  const content = useDocsContent()
  const location = useLocation()
  const sortedContent = useMemo(
    () => [...content].sort((first, second) => {
      const typeOrder = { lecture: 0, lab: 1, activity: 2 }
      return (typeOrder[first.type] - typeOrder[second.type]) || first.order - second.order
    }),
    [content]
  )
  const activeSlug = location.pathname.startsWith('/docs/')
    ? location.pathname.replace('/docs/', '')
    : location.pathname.startsWith('/labs/')
      ? location.pathname.replace('/labs/', '')
    : location.pathname.startsWith('/lectures/html-introduction')
      ? 'html-introduction-lecture'
      : location.pathname.startsWith('/lectures/')
        ? location.pathname.replace('/lectures/', '')
      : 'introduction'
  const isExamLabRoute = ['/labs/lab-8', '/labs/lab-15'].includes(location.pathname)
  const pageHeadings = location.pathname.startsWith('/lectures/')
    ? lectureHeadings
    : location.pathname.startsWith('/labs/')
      ? isExamLabRoute
        ? examLabHeadings
        : labHeadings
      : docsHeadings

  useEffect(() => {
    window.localStorage.setItem('awt-language', language)
  }, [language])

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <ReadingProgress />
      <CodeCopyEnhancer />
      <DocsNavbar
        language={language}
        onLanguageToggle={() => setLanguage((current) => (current === 'EN' ? 'Roman Urdu' : 'EN'))}
        onMenuClick={() => setIsSidebarOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchOpen={() => setIsSearchOpen(true)}
      />
      <SearchDialog
        content={sortedContent}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        query={searchQuery}
        onQueryChange={setSearchQuery}
      />
      <DocsSidebar
        activeSlug={activeSlug}
        content={sortedContent}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="pt-16 lg:pl-72">
        <div className="mx-auto flex max-w-[1400px]">
          <main className="min-w-0 flex-1">
            <DocsPageTools content={sortedContent} activeSlug={activeSlug} />
            <Outlet context={{ language }} />
          </main>
          <OnThisPage headings={pageHeadings} />
        </div>
      </div>
    </div>
  )
}
