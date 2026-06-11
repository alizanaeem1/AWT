import { Eye, EyeOff, KeyRound, Search, Users, X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const demoUsers = [
  { id: 'demo-1', full_name: 'Ali Raza', email: 'ali@student.com', role: 'student', created_at: '2026-06-01T10:00:00Z' },
  { id: 'demo-2', full_name: 'Ayesha Khan', email: 'ayesha@student.com', role: 'student', created_at: '2026-06-03T12:30:00Z' },
  { id: 'demo-3', full_name: 'Aliza Naeem', email: 'aliza@admin.com', role: 'admin', created_at: '2026-05-15T09:00:00Z' }
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ id: null, text: '', type: '' })
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function loadUsers() {
      if (!isSupabaseConfigured || !supabase) {
        setUsers(demoUsers)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        setLoadError(error.message)
        setUsers([])
      } else {
        setUsers(data || [])
      }
      setIsLoading(false)
    }

    loadUsers()
  }, [])

  const filtered = users.filter((user) => {
    const query = search.toLowerCase()
    return (
      (user.full_name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.role || '').toLowerCase().includes(query)
    )
  })

  async function handlePasswordUpdate(userId) {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ id: userId, text: 'Password must be at least 6 characters.', type: 'error' })
      return
    }
    if (!supabase) {
      setMessage({ id: userId, text: 'Supabase is not configured.', type: 'error' })
      return
    }

    setSaving(true)
    try {
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      if (!serviceRoleKey) {
        throw new Error('Service Role Key not found in .env')
      }

      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      )
      
      if (error) throw error
      
      setMessage({ id: userId, text: 'Password updated successfully.', type: 'success' })
      setEditingId(null)
      setNewPassword('')
    } catch (err) {
      console.error(err)
      setMessage({ id: userId, text: 'Failed to update password. Check console for details.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-black text-white">Users</h1>
            <p className="text-sm text-slate-400">{users.length} users registered (Admins & Students)</p>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Unable to load users: {loadError}. Apply the latest <code>supabase/schema.sql</code> policies.
        </div>
      ) : null}

      {/* Hidden dummy inputs to trick browser autofill and prevent it from hijacking the search input */}
      <div className="hidden" aria-hidden="true">
        <input type="text" name="dummy-username" tabIndex={-1} autoComplete="off" />
        <input type="password" name="dummy-password" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-550" />
        <input
          type="search"
          name="search-query"
          autoComplete="new-password"
          data-lpignore="true"
          data-1p-ignore
          spellCheck="false"
          placeholder="Search users by name, email or role..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-700/60 bg-slate-900/60 pl-11 pr-10 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-350 transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 shadow-2xl backdrop-blur-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0d1725] text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4 text-left font-bold">User</th>
              <th className="px-5 py-4 text-left font-bold">Role</th>
              <th className="px-5 py-4 text-left font-bold">Joined</th>
              <th className="px-5 py-4 text-right font-bold">Password</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-5 animate-pulse rounded bg-slate-800/40" />
                  </td>
                </tr>
              ))
            ) : filtered.length ? (
              filtered.map((user) => (
                <Fragment key={user.id}>
                  <tr className="transition duration-200 hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          user.role === 'admin' 
                            ? 'bg-gradient-to-br from-amber-400/15 to-orange-500/15 text-amber-300 ring-1 ring-amber-400/20' 
                            : 'bg-gradient-to-br from-cyan-400/15 to-blue-500/15 text-cyan-300 ring-1 ring-cyan-400/20'
                        }`}>
                          {(user.full_name || user.email || 'U').slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-bold text-white">{user.full_name || (user.role === 'admin' ? 'Admin' : 'Student')}</p>
                          <p className="text-xs text-slate-500">{user.email || 'No email saved yet'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-black capitalize text-amber-350 ring-1 ring-amber-400/20">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-cyan-400/10 px-2.5 py-1 text-xs font-black capitalize text-cyan-300 ring-1 ring-cyan-400/20">
                          Student
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(editingId === user.id ? null : user.id)
                          setNewPassword('')
                          setMessage({ id: null, text: '', type: '' })
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-slate-450" />
                        Reset Password
                      </button>
                    </td>
                  </tr>

                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Password Reset Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 bg-slate-800/50 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
              <p className="mt-1 text-sm text-slate-400">
                Enter a new password for the selected user.
              </p>
            </div>
            <div className="space-y-4 p-6">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="New password (min. 6 characters)"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 pr-10 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {message.id === editingId && message.text ? (
                <div className={`rounded-xl border p-3 text-sm font-medium ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400' : 'border-red-400/20 bg-red-400/10 text-red-400'}`}>
                  {message.text}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setNewPassword('')
                    setMessage({ id: null, text: '', type: '' })
                  }}
                  className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePasswordUpdate(editingId)}
                  disabled={saving}
                  className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
