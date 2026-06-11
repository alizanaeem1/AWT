import { BookOpen, Calendar, CheckCircle2, Eye, EyeOff, FlaskConical, User as UserIcon, ShieldAlert, Upload, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useProgress } from '../hooks/useProgress.js'
import { useStudentContent } from '../hooks/useStudentContent.js'
import { supabase } from '../lib/supabase.js'
import { calculateStudentStats } from './studentProgress.js'

export default function StudentProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const { lectures, labs } = useStudentContent()
  const { records, readIds } = useProgress()
  const stats = calculateStudentStats({ lectures, labs, records, readIds })
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Today'

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Profile Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        <div className="relative p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-24 w-24 shrink-0 rounded-full object-cover shadow-xl shadow-blue-500/20 ring-4 ring-slate-900" />
              ) : (
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-4xl font-black text-white shadow-xl shadow-blue-500/20 ring-4 ring-slate-900">
                  {(profile?.full_name || user?.email || 'S').slice(0, 1).toUpperCase()}
                </span>
              )}
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white">{profile?.full_name || 'Student'}</h2>
                <p className="mt-1.5 font-medium text-slate-400">{user?.email}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-400/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {profile?.role || 'Student'} Account
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
        <StatCard icon={BookOpen} label="Total Lectures" value={stats.totalLectures} color="text-blue-400" bg="bg-blue-400/10" />
        <StatCard icon={CheckCircle2} label="Completed Lectures" value={stats.completedLectures} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard icon={FlaskConical} label="Total Labs" value={stats.totalLabs} color="text-purple-400" bg="bg-purple-400/10" />
        <StatCard icon={CheckCircle2} label="Completed Labs" value={stats.completedLabs} color="text-amber-400" bg="bg-amber-400/10" />
        <StatCard icon={Calendar} label="Member Since" value={memberSince} color="text-cyan-400" bg="bg-cyan-400/10" />
      </div>

      {/* Forms Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <EditProfileForm profile={profile} refreshProfile={refreshProfile} />
        <ChangePasswordForm />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 transition-all duration-300 hover:border-slate-700 hover:bg-slate-800/80 hover:shadow-2xl">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg} ${color} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Badge({ icon: Icon, color, bg, label }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] ${bg} ${color}`}>
        <Icon className="h-7 w-7" />
      </div>
      <span className="mt-2 text-xs font-semibold text-slate-300">{label}</span>
    </div>
  )
}

function EditProfileForm({ profile, refreshProfile }) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setError('')
    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('media').upload(`avatars/${fileName}`, avatarFile)
        
        if (uploadError) {
          throw new Error('Avatar upload failed. Make sure you have admin rights or the media bucket allows uploads.')
        }
        
        const { data } = supabase.storage.from('media').getPublicUrl(`avatars/${fileName}`)
        avatarUrl = data.publicUrl
      }

      const { error: updateError } = await supabase.from('profiles').update({ 
        full_name: fullName,
        avatar_url: avatarUrl
      }).eq('id', profile.id)
      
      if (updateError) throw updateError
      
      await refreshProfile()
      setMessage('Profile updated successfully.')
      setAvatarFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 shadow-xl transition-colors hover:border-slate-700 sm:p-8">
      <div className="mb-6 flex items-center gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-white">Update Information</h4>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Change your display name and photo</p>
        </div>
      </div>

      <div className="flex-1 space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-400">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-400">{message}</div>}
        
        <div className="flex items-center gap-4">
          {avatarFile ? (
            <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="h-16 w-16 rounded-full object-cover shadow-lg" />
          ) : profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Current Avatar" className="h-16 w-16 rounded-full object-cover shadow-lg" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-400 shadow-lg">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Profile Picture</label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
              <Upload className="h-3 w-3" />
              {avatarFile ? avatarFile.name : 'Choose Image'}
              <input type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Full Name <span className="normal-case text-slate-600">(optional)</span></label>
          <input 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            placeholder="Enter your full name"
            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-white outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30" 
          />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="mt-8 h-12 w-full rounded-xl bg-emerald-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:bg-emerald-300 hover:shadow-emerald-400/30 disabled:opacity-50 sm:w-auto sm:self-start">
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setError('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setMessage('Password updated successfully.')
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 shadow-xl transition-colors hover:border-slate-700 sm:p-8">
      <div className="mb-6 flex items-center gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-white">Change Password</h4>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Secure your account</p>
        </div>
      </div>

      <div className="flex-1 space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-400">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-400">{message}</div>}
        
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 pr-12 text-sm font-semibold text-white outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="mt-8 h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm font-black text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-50 sm:w-auto sm:self-start">
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )
}
