import { GraduationCap, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950">
            AWT
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-normal text-white sm:text-5xl">
            AWT Interactive Learning Platform
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Choose where you want to go. Admins manage content, students learn and track progress.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <PortalCard
            to="/admin/dashboard"
            icon={ShieldCheck}
            title="Admin Panel"
            description="Manage lectures, labs, activities, media, theme settings, and published content."
            button="Open Admin"
            tone="emerald"
          />
          <PortalCard
            to="/student"
            icon={GraduationCap}
            title="Student Dashboard"
            description="View lectures and labs, mark work complete, and track course progress."
            button="Open Student"
            tone="cyan"
          />
        </div>
      </section>
    </main>
  )
}

function PortalCard({ to, icon: Icon, title, description, button, tone }) {
  const styles = {
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:border-emerald-300',
    cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:border-cyan-300'
  }

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-400/50"
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-xl border ${styles[tone]}`}>
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="mt-6 text-2xl font-black text-white">{title}</h2>
      <p className="mt-3 min-h-14 leading-7 text-slate-400">{description}</p>
      <span className="mt-6 inline-flex rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 transition group-hover:bg-cyan-300">
        {button}
      </span>
    </Link>
  )
}
