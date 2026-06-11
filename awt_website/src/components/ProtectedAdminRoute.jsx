import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function ProtectedAdminRoute({ children }) {
  const location = useLocation()
  const { user, profile, isAdmin, isLoading, signOut } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-300">
        Checking admin access...
      </main>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace state={{ from: location }} />

  if (profile && !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your account is signed in, but it is not marked as an admin profile.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-5 h-11 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-slate-950 hover:bg-emerald-300"
          >
            Sign out
          </button>
        </section>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <section className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <h1 className="text-2xl font-black text-white">Profile not found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your Supabase auth user exists, but there is no matching row in the <code>profiles</code> table.
            Create a profile row for this account and set role to <code>admin</code>.
          </p>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
            <p className="font-bold text-emerald-300">Use this user id:</p>
            <code className="break-all">{user.id}</code>
            <p className="mt-3 font-bold text-emerald-300">Email:</p>
            <code className="break-all">{user.email}</code>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-5 h-11 rounded-lg bg-emerald-400 px-4 text-sm font-bold text-slate-950 hover:bg-emerald-300"
          >
            Sign out
          </button>
        </section>
      </main>
    )
  }

  return children
}
