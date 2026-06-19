import { Activity, BarChart3, Bell, BookOpen, CheckCheck, ChevronDown, Clock, FlaskConical, Home, LogOut, Menu, Settings, User, X } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSEO } from '../hooks/useSEO.js'
import { useTheme } from '../hooks/useTheme.js'
import {
  fetchNotifications,
  getNotificationPath,
  hideNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications
} from '../lib/notificationRepository.js'
import { setManifest } from '../lib/pwa.js'

const navItems = [
  { label: 'Dashboard', to: '/student', icon: Home, end: true },
  { label: 'Lectures', to: '/student/lectures', icon: BookOpen },
  { label: 'Labs', to: '/student/labs', icon: FlaskConical },
  { label: 'Analytics', to: '/student/analytics', icon: BarChart3 },
  { label: 'Profile', to: '/student/profile', icon: User }
]

export default function StudentLayout() {
  const { signOut, user, profile } = useAuth()
  const { websiteTitle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.is_read), [notifications])
  const pageTitle = getStudentPageTitle(location.pathname)

  useSEO({
    title: `${pageTitle} | AWT Lectures Student Portal`,
    description: 'Student portal for AWT lectures, labs, analytics, profile, and learning progress.',
    robots: 'noindex, nofollow'
  })

  useEffect(() => {
    setManifest('student')
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadNotifications() {
      if (!user) {
        setNotifications([])
        return
      }

      setIsNotificationsLoading(true)
      const nextNotifications = await fetchNotifications(user.id)
      if (!ignore) {
        setNotifications(nextNotifications)
        setIsNotificationsLoading(false)
      }
    }

    loadNotifications()
    const unsubscribe = subscribeToNotifications(loadNotifications)

    return () => {
      ignore = true
      unsubscribe()
    }
  }, [user])

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

  async function handleNotificationClick(notification) {
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item))
    setIsNotifOpen(false)
    await markNotificationRead(notification.id)
  }

  async function handleMarkAllRead() {
    const ids = notifications.map((notification) => notification.id)
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
    await markAllNotificationsRead(ids)
  }

  function handleClearNotifications() {
    const ids = notifications.map((notification) => notification.id)
    hideNotifications(user?.id, ids)
    setNotifications([])
    setIsNotifOpen(false)
  }

  async function handleLogout() {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0b1422] dark:text-slate-100">
      <div className={['fixed inset-0 z-40 bg-slate-950/70 lg:hidden print:hidden', isOpen ? 'block' : 'hidden'].join(' ')} onClick={() => setIsOpen(false)} />
      <aside className={['fixed bottom-0 left-0 top-0 z-50 w-[80vw] max-w-80 border-r border-[#1b2b3c] bg-[#07111e] shadow-2xl shadow-black/20 transition-transform duration-300 ease-out lg:w-52 lg:border-slate-200 lg:bg-white lg:shadow-black/10 lg:translate-x-0 lg:dark:border-[#1b2b3c] lg:dark:bg-[#07111e] lg:dark:shadow-black/20 print:hidden', isOpen ? 'translate-x-0' : '-translate-x-full'].join(' ')}>
        <div className="flex h-full flex-col p-3">
          <div className="flex items-center gap-3 px-2 py-4">
            <BrandLogo
              className="h-12 w-12 flex-shrink-0 rounded-xl bg-emerald-400/15 text-xs font-black text-slate-950 ring-1 ring-emerald-400/30 dark:text-slate-950 lg:h-9 lg:w-9 lg:rounded-lg lg:text-[10px]"
              imageClassName="object-contain"
              fallbackClassName="!w-12 !max-w-12 lg:!w-9 lg:!max-w-9"
            />
            <div className="min-w-0 flex-1">
              <p className="whitespace-normal text-lg font-bold leading-snug text-white lg:text-sm lg:font-black lg:text-slate-900 lg:dark:text-white">AWT Lectures</p>
              <p className="text-sm leading-tight text-slate-400 lg:text-xs lg:text-slate-500">Interactive Learning Platform</p>
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
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-white lg:text-slate-500 lg:hover:bg-slate-100 lg:hover:text-slate-900 lg:dark:text-slate-400 lg:dark:hover:bg-slate-900/80 lg:dark:hover:text-white'
                ].join(' ')}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-2 border-t border-[#1b2b3c] pt-3 lg:border-slate-200 lg:dark:border-[#1b2b3c]">
            {user ? (
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-slate-400 hover:bg-slate-900 hover:text-red-200 lg:text-slate-500 lg:hover:bg-slate-100 lg:hover:text-red-600 lg:dark:text-slate-400 lg:dark:hover:bg-slate-900 lg:dark:hover:text-red-200">
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between rounded-b-2xl border-b border-slate-200 bg-white/90 px-3 shadow-sm backdrop-blur-md print:hidden dark:border-white/5 dark:bg-[#07111e]/90 dark:shadow-md dark:shadow-black/20 lg:h-auto lg:rounded-none lg:px-4 lg:py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <BrandLogo
                className="h-10 w-10 rounded-xl bg-emerald-400/15 text-xs font-black text-slate-950 ring-1 ring-emerald-400/30 dark:text-slate-950"
                imageClassName="object-contain"
                fallbackClassName="!w-10 !max-w-10"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900 dark:text-white">{pageTitle}</p>
                <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">Student Portal</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <BrandLogo
                className="h-7 w-7 rounded-md bg-emerald-400/15 text-[9px] font-black text-slate-950 ring-1 ring-emerald-400/30 dark:text-slate-950"
                imageClassName="object-contain"
                fallbackClassName="!w-7 !max-w-7"
              />
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-sm font-black text-transparent dark:from-emerald-300 dark:to-cyan-300">Student Portal</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white lg:h-9 lg:w-9"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-[#07111e]">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm lg:hidden" onClick={() => setIsNotifOpen(false)} />
                    <NotificationPanel
                      notifications={notifications}
                      unreadCount={unreadNotifications.length}
                      isLoading={isNotificationsLoading}
                      onClose={() => setIsNotifOpen(false)}
                      onClear={handleClearNotifications}
                      onMarkAllRead={handleMarkAllRead}
                      onNotificationClick={handleNotificationClick}
                    />
                  </>
                )}
              </div>
            )}

            {/* Profile Dropdown or Sign In */}
            <div className="relative" ref={profileRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-left transition hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:bg-slate-800 sm:w-auto sm:justify-start sm:gap-2 sm:rounded-full sm:py-1 sm:pl-1 sm:pr-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 sm:block">
                      {profile?.full_name || 'Student'}
                    </span>
                    <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-[#07111e] dark:shadow-black/40 z-50">
                      <div className="mb-2 px-3 py-2">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{profile?.full_name || 'Student'}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />
                      <Link to="/student/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link to="/student/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white">
                        <Settings className="h-4 w-4" />
                        Settings
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
            <button type="button" onClick={() => setIsOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm backdrop-blur transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden" aria-label="Open Navigation Menu">
              <Menu className="h-5 w-5" />
            </button>
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

function getStudentPageTitle(pathname) {
  if (pathname.includes('/student/lectures/')) return 'Lecture Detail'
  if (pathname.includes('/student/labs/')) return 'Lab Detail'
  if (pathname.includes('/student/lectures')) return 'Lectures'
  if (pathname.includes('/student/labs')) return 'Labs'
  if (pathname.includes('/student/analytics')) return 'Analytics'
  if (pathname.includes('/student/profile')) return 'Profile'
  return 'Dashboard'
}

function NotificationPanel({ notifications, unreadCount, isLoading, onClose, onClear, onMarkAllRead, onNotificationClick }) {
  // Render via portal — completely outside the layout tree so it never affects page layout
  return createPortal(
    <>
      {/* Backdrop — full screen, dark overlay, closes on click */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — fixed, above backdrop */}
      <div className="fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/30 dark:border-slate-800/90 dark:bg-[#07111e]
        /* Mobile: centered bottom sheet */
        bottom-3 left-3 right-3 max-h-[70vh]
        /* Desktop: dropdown near bell */
        lg:bottom-auto lg:left-auto lg:right-4 lg:top-20 lg:w-[360px] lg:max-h-[min(70vh,520px)]">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800/90">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{unreadCount} unread</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions row — only show if there are notifications */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800/90">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black text-cyan-700 transition hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-400/10"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg px-2.5 py-1.5 text-xs font-black text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
              ))}
            </div>
          ) : notifications.length ? (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onClick={onNotificationClick} />
            ))
          ) : (
            /* Improved empty state */
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-slate-900">
                🔔
              </div>
              <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">No Notifications Yet</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                You'll see lecture, lab and activity updates here.
              </p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

function NotificationItem({ notification, onClick }) {
  const Icon = notification.type === 'lab' ? FlaskConical : notification.type === 'activity' ? Activity : BookOpen
  const typeLabel = notification.type === 'lab' ? 'Lab' : notification.type === 'activity' ? 'Activity' : 'Lecture'
  const iconClass = notification.type === 'lab'
    ? 'bg-purple-500/15 text-purple-500 ring-purple-500/20'
    : notification.type === 'activity'
      ? 'bg-amber-500/15 text-amber-500 ring-amber-500/20'
      : 'bg-blue-500/15 text-blue-500 ring-blue-500/20'

  return (
    <Link
      to={getNotificationPath(notification)}
      onClick={() => onClick(notification)}
      className={[
        'mb-2 flex gap-3 rounded-xl border p-3 transition hover:border-cyan-400/50 hover:bg-slate-50 dark:hover:bg-slate-900/70',
        notification.is_read
          ? 'border-slate-100 bg-white dark:border-slate-800/70 dark:bg-slate-950/20'
          : 'border-cyan-400/35 bg-cyan-50/70 dark:border-cyan-400/25 dark:bg-cyan-400/10'
      ].join(' ')}
    >
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-black leading-snug text-slate-900 dark:text-white">{notification.title}</p>
          {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{notification.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">{typeLabel}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Clock className="h-3 w-3" />
            {formatNotificationTime(notification.created_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function formatNotificationTime(value) {
  if (!value) return 'Just now'
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}
