import { Bell, BookOpen, FlaskConical, Home, LayoutDashboard, LogOut, Menu, Palette, Settings, User, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import { ToastProvider } from '../context/ToastContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSEO } from '../hooks/useSEO.js'
import { setManifest } from '../lib/pwa.js'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Lectures', to: '/admin/lectures', icon: BookOpen },
  { label: 'Labs', to: '/admin/labs', icon: FlaskConical },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Theme Settings', to: '/admin/theme', icon: Palette }
]

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const { signOut, user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const notifRef = useRef(null)
  const pageTitle = getAdminPageTitle(location.pathname)

  useSEO({
    title: `${pageTitle} | AWT Admin Portal`,
    description: 'Admin portal for managing AWT lectures, labs, users, notifications, and platform settings.',
    robots: 'noindex, nofollow'
  })

  useEffect(() => {
    setManifest('admin')
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <ToastProvider>
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div
        className={[
          'fixed inset-0 z-40 bg-slate-950/70 transition lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        ].join(' ')}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={[
          'fixed bottom-0 left-0 top-0 z-50 w-[80vw] max-w-80 border-r border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform lg:w-72 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        ].join(' ')}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <Link to="/admin/dashboard" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <BrandLogo
                className="h-12 w-12 flex-shrink-0 rounded-xl bg-emerald-400 text-sm font-black text-slate-950"
                imageClassName="object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="whitespace-normal text-base font-black leading-tight text-white">Admin Panel</p>
                <p className="mt-0.5 text-xs leading-tight text-slate-500">AWT Interactive Learning</p>
              </div>
            </Link>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  ].join(' ')
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-800 pt-4">
            <NavLink to="/student" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white">
              <Home className="h-4 w-4" />
              Back to Student Portal
            </NavLink>
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-red-300">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="w-full min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 rounded-b-2xl border-b border-slate-800/90 bg-slate-950/90 shadow-lg shadow-black/20 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Link to="/admin/dashboard" className="flex items-center gap-2.5">
                <BrandLogo className="h-10 w-10 rounded-xl bg-emerald-400 text-xs font-black text-slate-950" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{pageTitle}</p>
                  <p className="truncate text-[11px] font-semibold text-slate-500">AWT Admin</p>
                </div>
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false) }}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-1rem)] max-w-72 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur">
                    <div className="border-b border-slate-800 px-4 py-3">
                      <p className="text-sm font-black text-white">Notifications</p>
                      <p className="mt-0.5 text-xs text-slate-500">Admin updates</p>
                    </div>
                    <p className="p-4 text-center text-sm text-slate-500">No new notifications</p>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false) }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  aria-label="Admin profile"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-black text-emerald-300">
                    {(profile?.full_name || user?.email || 'A').slice(0, 1).toUpperCase()}
                  </span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-black text-white">{profile?.full_name || 'Admin User'}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="my-1 border-t border-slate-800" />
                    <Link to="/admin/users" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link to="/admin/theme" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <div className="my-1 border-t border-slate-800" />
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 shadow-sm backdrop-blur transition hover:bg-slate-800 hover:text-white active:scale-95"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}

function getAdminPageTitle(pathname) {
  if (pathname.includes('/admin/lectures/add')) return 'Add Lecture'
  if (pathname.includes('/admin/lectures/edit')) return 'Edit Lecture'
  if (pathname.includes('/admin/lectures')) return 'Lectures'
  if (pathname.includes('/admin/labs/add')) return 'Add Lab'
  if (pathname.includes('/admin/labs/edit')) return 'Edit Lab'
  if (pathname.includes('/admin/labs')) return 'Labs'
  if (pathname.includes('/admin/users')) return 'Users'
  if (pathname.includes('/admin/theme')) return 'Theme Settings'
  if (pathname.includes('/admin/media')) return 'Media'
  if (pathname.includes('/admin/activities')) return 'Activities'
  return 'Dashboard'
}
