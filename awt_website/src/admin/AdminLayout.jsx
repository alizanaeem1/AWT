import { BookOpen, FilePlus2, FlaskConical, Home, Image, LayoutDashboard, LogOut, Palette, PanelLeft, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ToastProvider } from '../context/ToastContext.jsx'
import { useAuth } from '../hooks/useAuth.js'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Lectures', to: '/admin/lectures', icon: BookOpen },
  { label: 'Labs', to: '/admin/labs', icon: FlaskConical },
  { label: 'Activities', to: '/admin/activities', icon: FilePlus2 },
  { label: 'Media', to: '/admin/media', icon: Image },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Theme Settings', to: '/admin/theme', icon: Palette }
]

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut, user, profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <ToastProvider>
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        className={[
          'fixed inset-0 z-40 bg-slate-950/70 transition lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        ].join(' ')}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={[
          'fixed bottom-0 left-0 top-0 z-50 w-72 border-r border-slate-800 bg-slate-950 transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        ].join(' ')}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400 text-sm font-black text-slate-950">
              AWT
            </span>
            <div>
              <p className="font-semibold text-white">Admin Panel</p>
              <p className="text-xs text-slate-500">Content operations</p>
            </div>
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
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-black text-emerald-300">
                {(profile?.full_name || user?.email || 'A').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{profile?.full_name || 'Admin User'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white lg:hidden"
              aria-label="Open admin navigation"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}
