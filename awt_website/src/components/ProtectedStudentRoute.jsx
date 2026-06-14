import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function ProtectedStudentRoute({ children }) {
  const location = useLocation()
  const { user, isLoading } = useAuth()

  // Still checking session — show nothing until resolved
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b1422]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm font-semibold text-slate-400">Loading...</p>
        </div>
      </main>
    )
  }

  // No session → go to sign in, remember where they were
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }

  return children
}
