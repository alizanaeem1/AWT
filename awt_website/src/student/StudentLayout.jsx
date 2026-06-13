import { BarChart3, Bell, BookOpen, ChevronDown, FlaskConical, Home, LogOut, PanelLeft, Settings, User } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
import { useTheme } from '../hooks/useTheme.js'
import StudentLoginPage from './StudentLoginPage.jsx'

const navItems = [
  { label: 'Dashboard', to: '/student', icon: Home, end: true },
  { label: 'Lectures', to: '/student/lectures', icon: BookOpen },
  { label: 'Labs', to: '/student/labs', icon: FlaskConical },
  { label: 'Analytics', to: '/student/analytics', icon: BarChart3 },
  { label: 'Profile', to: '/student/profile', icon: User }
]

function notificationKey(notification) {
  return [
    notification?.type || 'item',
    notification?.id || notification?.slug || notification?.title || 'unknown',
    notification?.updated_at || notification?.created_at || ''
  ].join(':')
}

export default function StudentLayout() {
  const { signOut, user, profile } = useAuth()
  const { lectures, labs } = useStudentContent()
  const { websiteTitle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notificationVersion, setNotificationVersion] = useState(0)
  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const notificationStorageKey = user?.id ? `awt-student-read-notifications-${user.id}` : ''

  const readNotificationIds = useMemo(() => {
    if (!notificationStorageKey) return []
    void notificationVersion
    try {
      const saved = JSON.parse(localStorage.getItem(notificationStorageKey) || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  }, [notificationStorageKey, notificationVersion])

  const allNotifications = useMemo(() => {
    const recentLectures = [...(lectures || [])].sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0)).slice(0, 2)
    const recentLabs = [...(labs || [])].sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0)).slice(0, 2)
    return [...recentLectures.map((lecture) => ({ ...lecture, type: 'lecture' })), ...recentLabs.map((lab) => ({ ...lab, type: 'lab' }))]
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
      .slice(0, 4)
  }, [labs, lectures])

  const unreadNotifications = useMemo(
    () => allNotifications.filter((notification) => !readNotificationIds.includes(notificationKey(notification))),
    [allNotifications, readNotificationIds]
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function saveReadNotifications(ids) {
    const uniqueIds = [...new Set(ids)]
    if (notificationStorageKey) localStorage.setItem(notificationStorageKey, JSON.stringify(uniqueIds))
    setNotificationVersion((version) => version + 1)
  }

  function markNotificationRead(notification) {
    saveReadNotifications([...readNotificationIds, notificationKey(notification)])
  }

  function clearNotifications() {
    saveReadNotifications([...readNotificationIds, ...allNotifications.map(notificationKey)])
  }

  async function handleLogout() {
    await signOut()
    navigate('/student', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0b1422] dark:text-slate-100">
      <div className={['fixed inset-0 z-40 bg-slate-950/70 lg:hidden print:hidden', isOpen ? 'block' : 'hidden'].join(' ')} onClick={() => setIsOpen(false)} />
      <aside className={['fixed bottom-0 left-0 top-0 z-50 w-52 border-r border-slate-200 bg-white shadow-2xl shadow-black/10 transition-transform dark:border-[#1b2b3c] dark:bg-[#07111e] dark:shadow-black/20 lg:translate-x-0 print:hidden', isOpen ? 'translate-x-0' : '-translate-x-full'].join(' ')}>
        <div className="flex h-full flex-col p-3">
          <div className="flex items-center gap-3 px-2 py-4">
            <BrandLogo className="h-9 w-9 rounded-lg bg-emerald-400/15 text-sm font-black text-emerald-600 ring-1 ring-emerald-400/30 dark:text-emerald-300" />
            <div className="min-w-0">
              <p className="font-black text-slate-900 dark:text-white">Student Portal</p>
              <p className="truncate text-xs text-slate-500">{websiteTitle}</p>
            </div>
          </div>

          <nav className="mt-5 flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition',
                  isActive
                    ? 'bg-emerald-400/15 text-emerald-700 ring-1 ring-emerald-400/20 dark:text-emerald-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-white'
                ].join(' ')}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-[#1b2b3c]">
            {user ? (
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-red-200">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link to="/signin" state={{ from: location }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </aside>

      <div className="lg:pl-52 print:pl-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md print:hidden shadow-sm dark:border-white/5 dark:bg-[#07111e]/80 dark:shadow-md dark:shadow-black/20">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden">
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 lg:flex">
              <BrandLogo className="h-7 w-7 rounded-md bg-emerald-400/15 text-[10px] font-black text-emerald-600 ring-1 ring-emerald-400/30 dark:text-emerald-300" />
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-sm font-black text-transparent dark:from-emerald-300 dark:to-cyan-300">Student Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/20 transition hover:bg-amber-400/20"
              >
                Admin Panel
              </Link>
            )}

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false) }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-[#07111e]">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="animate-scale-in absolute right-0 mt-2.5 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-md z-50 dark:border-slate-800/80 dark:bg-[#0b1422]/95 dark:shadow-black/40">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800/80">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{unreadNotifications.length} new items</p>
                      </div>
                      {unreadNotifications.length ? (
                        <button
                          type="button"
                          onClick={clearNotifications}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-black text-cyan-600 transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-700/70 dark:text-cyan-300 dark:hover:border-cyan-400 dark:hover:bg-cyan-400/10"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2">
                      {unreadNotifications.length ? unreadNotifications.map(n => (
                        <Link key={notificationKey(n)} to={n.type === 'lecture' ? `/student/lectures/${n.slug}` : `/student/labs/${n.slug}`} onClick={() => { markNotificationRead(n); setIsNotifOpen(false) }} className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-slate-800/50">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.type === 'lecture' ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20' : 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/20'}`}>
                            {n.type === 'lecture' ? <BookOpen className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">New {n.type === 'lecture' ? 'Lecture' : 'Lab'} Added</p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">{n.title}</p>
                          </div>
                        </Link>
                      )) : (
                        <p className="p-4 text-center text-sm text-slate-500">No new notifications</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown or Sign In */}
            <div className="relative" ref={profileRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-left transition hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 sm:block">
                      {profile?.full_name || 'Student'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-[#07111e] dark:shadow-black/40 z-50">
                      <div className="mb-2 px-3 py-2">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{profile?.full_name || 'Student'}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />
                      <Link to="/student" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white">
                        <Home className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link to="/student/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white">
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />
                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/signin" state={{ from: location }} className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-slate-100 px-4 py-5 dark:bg-[#0b1422] sm:px-6 lg:px-7">
          <div key={location.pathname} className="page-animate">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
