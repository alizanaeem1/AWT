import { BookOpen, Languages, Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle.jsx'

export default function DocsNavbar({ language, onLanguageToggle, onMenuClick, searchQuery, onSearchOpen }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex min-w-0 items-center gap-3 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-400 text-sm font-black text-slate-950">
            AWT
          </span>
          <span className="hidden truncate text-sm font-semibold sm:block">Interactive Learning Platform</span>
        </Link>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSearchOpen}
            className="relative hidden h-10 w-full max-w-sm items-center rounded-md border border-slate-800 bg-slate-900 pl-9 pr-3 text-left text-sm text-slate-500 outline-none transition hover:border-cyan-400 md:flex"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <span className="min-w-0 flex-1 truncate">{searchQuery || 'Search docs'}</span>
            <kbd className="ml-2 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">Ctrl K</kbd>
          </button>

          <button
            type="button"
            onClick={onSearchOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-400 hover:text-white md:hidden"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>

          <select
            aria-label="Documentation version"
            className="h-10 rounded-md border border-slate-800 bg-slate-900 px-3 text-sm font-medium text-slate-200 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            defaultValue="v1.0"
          >
            <option value="v1.0">v1.0</option>
            <option value="v0.9">v0.9</option>
          </select>

          <button
            type="button"
            onClick={onLanguageToggle}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white"
            aria-label="Toggle language"
            title="Toggle language"
          >
            <Languages className="h-4 w-4" />
            <span>{language}</span>
          </button>

          <ThemeToggle />

          <Link
            to="/student"
            className="hidden h-10 items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400 hover:text-slate-950 lg:inline-flex"
          >
            <BookOpen className="h-4 w-4" />
            Student
          </Link>

          <a
            href="#overview"
            className="hidden h-10 items-center gap-2 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 xl:inline-flex"
          >
            <BookOpen className="h-4 w-4" />
            Start
          </a>
        </div>
      </div>
    </header>
  )
}
