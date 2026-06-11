import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle.jsx'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/student', label: 'Student' },
  { to: '/admin', label: 'Admin' }
]

export default function Navigation() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3 text-slate-950 dark:text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-amber-400 dark:bg-white dark:text-slate-950">
            AWT
          </span>
          <span className="hidden text-sm font-semibold sm:block">Interactive Learning Platform</span>
        </NavLink>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-teal-50 text-teal-800 dark:bg-teal-400/10 dark:text-teal-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
