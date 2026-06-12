import { BarChart3, Bell, BookOpen, ChevronDown, FlaskConical, Home, LogOut, PanelLeft, Settings, User } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
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

  if (!user) return <StudentLoginPage />

  return (
    <div className="min-h-screen bg-[#0b1422] text-slate-100">
      <div className={['fixed inset-0 z-40 bg-slate-950/70 lg:hidden print:hidden', isOpen ? 'block' : 'hidden'].join(' ')} onClick={() => setIsOpen(false)} />
      <aside className={['fixed bottom-0 left-0 top-0 z-50 w-52 border-r border-[#1b2b3c] bg-[#07111e] shadow-2xl shadow-black/20 transition-transform lg:translate-x-0 print:hidden', isOpen ? 'translate-x-0' : '-translate-x-full'].join(' ')}>
        <div className="flex h-full flex-col p-3">
          <div className="flex items-center gap-3 px-2 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-sm font-black text-emerald-300 ring-1 ring-emerald-400/30">A</span>
            <div className="min-w-0">
              <p className="font-black text-white">AWT</p>
              <p className="truncate text-xs text-slate-400">Learning Platform</p>
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
                  isActive ? 'bg-emerald-400/18 text-emerald-100 ring-1 ring-emerald-400/20' : 'text-slate-400 hover:bg-slate-900/80 hover:text-white'
                ].join(' ')}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-2 border-t border-[#1b2b3c] pt-3">
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-slate-400 hover:bg-slate-900 hover:text-red-200">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-52 print:pl-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#07111e]/80 px-4 py-3 backdrop-blur-md print:hidden shadow-md shadow-black/20">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 text-slate-300 transition hover:bg-slate-800 hover:text-white lg:hidden">
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-400/15 text-xs font-black text-emerald-300 ring-1 ring-emerald-400/30">A</span>
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-sm font-black text-transparent">Student Portal</span>
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
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false) }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-[#07111e]">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="animate-scale-in absolute right-0 mt-2.5 w-80 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0b1422]/95 shadow-2xl shadow-black/40 backdrop-blur-md z-50">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3.5">
                    <div>
                      <h3 className="text-sm font-black text-white">Notifications</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{unreadNotifications.length} new items</p>
                    </div>
                    {unreadNotifications.length ? (
                      <button
                        type="button"
                        onClick={clearNotifications}
                        className="rounded-lg border border-slate-700/70 px-2.5 py-1 text-[11px] font-black text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-400/10"
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

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false) }}
                className="flex items-center gap-2.5 rounded-xl border border-slate-700/50 bg-slate-900/60 py-1.5 pl-1.5 pr-3 transition hover:border-slate-600 hover:bg-slate-800"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-7 w-7 shrink-0 rounded-lg object-cover ring-1 ring-slate-700" />
                ) : (
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white ${
                    profile?.role === 'admin'
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-cyan-400 to-blue-500'
                  }`}>
                    {(profile?.full_name || user?.email || 'U').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="hidden text-sm font-bold text-white sm:block">
                  {profile?.full_name || (profile?.role === 'admin' ? 'Admin' : 'Student')}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>

              {isProfileOpen && (
                <div className="animate-scale-in absolute right-0 mt-2.5 w-56 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0b1422]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-md z-50">
                  <div className="mb-1 rounded-xl bg-slate-800/40 px-3 py-3">
                    <p className="text-sm font-black text-white">{profile?.full_name || (profile?.role === 'admin' ? 'Admin User' : 'Student')}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{user?.email}</p>
                    {profile?.role === 'admin' && (
                      <span className="mt-1.5 inline-block rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/20">
                        Administrator
                      </span>
                    )}
                  </div>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-slate-800/60 hover:text-emerald-300">
                      <Settings className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/student/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/60 hover:text-white">
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <div className="my-1 border-t border-slate-800/80" />
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-[#0b1422] px-4 py-5 sm:px-6 lg:px-7">
          <div key={location.pathname} className="page-animate">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
