import {
  ArrowRight,
  Atom,
  BarChart3,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  Code2,
  Download,
  FlaskConical,
  Globe2,
  History,
  LockKeyhole,
  Mail,
  Menu,
  Play,
  Server,
  ShieldCheck,
  Smartphone,
  User,
  Video
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import { getPublishedLabs, getPublishedLectures } from '../lib/contentRepository.js'

const fallbackLectures = [
  { title: 'Introduction to AWT', group: 'AWT', shortDescription: 'Overview of advanced web technologies and roadmap.', order: 1, duration: '25 min', slug: 'html-introduction-lecture' },
  { title: 'Environment Setup', group: 'Tools', shortDescription: 'Setting up Node.js, VS Code and essential tools.', order: 2, duration: '30 min', slug: 'css-selectors' },
  { title: 'HTML Basics', group: 'HTML', shortDescription: 'Learn the building blocks of web development.', order: 3, duration: '28 min', slug: 'core-syntax' },
  { title: 'CSS Basics', group: 'CSS', shortDescription: 'Styling your web pages like a pro.', order: 4, duration: '35 min', slug: 'react-components' },
  { title: 'JavaScript Basics', group: 'JS', shortDescription: 'Learn JavaScript fundamentals with examples.', order: 5, duration: '40 min', slug: 'node-apis' }
]

const fallbackLabs = [
  { title: 'Basic HTTP Server', objective: 'Create a basic server using Node.js http module.', labNumber: '01', duration: '2 - 3 Hours', slug: 'lab-1', group: 'Node' },
  { title: 'File System Module', objective: 'Work with files and directories using FS module.', labNumber: '02', duration: '2 - 3 Hours', slug: 'lab-2', group: 'FS' },
  { title: 'React Components', objective: 'Build and understand React components.', labNumber: '03', duration: '2 - 3 Hours', slug: 'lab-3', group: 'React' },
  { title: 'MongoDB & Mongoose', objective: 'Learn MongoDB and Mongoose basics.', labNumber: '04', duration: '2 - 3 Hours', slug: 'lab-4', group: 'DB' },
  { title: 'Express Server', objective: 'Build a basic server using Express.js.', labNumber: '05', duration: '2 - 3 Hours', slug: 'lab-5', group: 'EX' }
]

const featureItems = [
  { title: 'Interactive Lectures', icon: Play, text: 'Engaging lessons with real examples.' },
  { title: 'Practical Labs', icon: FlaskConical, text: 'Hands-on labs to apply your knowledge.' },
  { title: 'Real Code Examples', icon: Code2, text: 'Production-ready code you can use.' },
  { title: 'Progress Tracking', icon: BarChart3, text: 'Track your learning and achievements.' },
  { title: 'Multi Language', icon: Globe2, text: 'English and Roman Urdu content available.' },
  { title: 'PWA Support', icon: Smartphone, text: 'Install the app and learn offline anytime.' }
]

const navItems = [
  ['Lectures', '#lectures'],
  ['Labs', '#labs'],
  ['Features', '#features'],
  ['Sign In', '/student']
]

const socialItems = [Globe2, Video, User]

export default function HomePage() {
  const [lectures, setLectures] = useState([])
  const [labs, setLabs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadPreviewContent() {
      try {
        const [nextLectures, nextLabs] = await Promise.race([
          Promise.all([
            getPublishedLectures(),
            getPublishedLabs()
          ]),
          new Promise((resolve) => {
            window.setTimeout(() => resolve([fallbackLectures, fallbackLabs]), 2500)
          })
        ])
        if (ignore) return
        setLectures(normalizeLectures(nextLectures).slice(0, 5))
        setLabs(normalizeLabs(nextLabs).slice(0, 5))
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadPreviewContent()

    return () => {
      ignore = true
    }
  }, [])

  const displayLectures = lectures.length ? lectures : fallbackLectures
  const displayLabs = labs.length ? labs : fallbackLabs

  const stats = useMemo(() => [
    { label: 'Lectures', value: '24+', text: 'Expert video lectures', icon: BookOpen, color: 'cyan' },
    { label: 'Labs', value: '15+', text: 'Practical hands-on labs', icon: FlaskConical, color: 'purple' },
    { label: 'Code Examples', value: '100+', text: 'Real-world examples', icon: Code2, color: 'emerald' },
    { label: 'Students Learning', value: '5K+', text: 'Join our community', icon: User, color: 'yellow' }
  ], [])

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_84%_12%,rgba(16,185,129,0.16),transparent_28rem),radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.12),transparent_24rem)]" />
      <div className="relative">
        <LandingNav />

        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-8 pt-10 sm:px-7 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-10 lg:pt-16">
          <div>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.08] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Learn <span className="block text-emerald-400">Advanced Web</span> Technologies
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
              Interactive lectures, hands-on labs, real code examples and expert content to boost your web development skills.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href="#lectures" className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-emerald-400 px-7 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300">
                Start Learning
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link to="/student" className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-slate-600/80 bg-slate-950/35 px-7 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-emerald-300/70">
                <User className="h-5 w-5" />
                Sign In to Track Progress
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
              <HeroBadge icon={CheckCircle2} text="Interactive Content" />
              <HeroBadge icon={ShieldCheck} text="Hands-on Labs" />
              <HeroBadge icon={History} text="Track Progress" />
              <HeroBadge icon={Download} text="PWA Ready" />
            </div>
          </div>

          <HeroGraphic />
        </section>

        <section className="mx-auto max-w-7xl px-5 sm:px-7">
          <div className="grid gap-4 rounded-xl border border-slate-800/95 bg-slate-900/65 p-5 shadow-2xl shadow-black/20 backdrop-blur md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
          </div>
        </section>

        <PreviewSection
          id="lectures"
          title="Featured Lectures"
          viewLabel="View All Lectures"
          viewTo="/student/lectures"
          isLoading={isLoading}
          emptyText="No published lectures yet."
        >
          {displayLectures.map((lecture, index) => <LectureCard key={`${lecture.slug}-${index}`} lecture={lecture} />)}
        </PreviewSection>

        <PreviewSection
          id="labs"
          title="Featured Labs"
          viewLabel="View All Labs"
          viewTo="/student/labs"
          isLoading={isLoading}
          emptyText="No published labs yet."
        >
          {displayLabs.map((lab, index) => <LabCard key={`${lab.slug}-${index}`} lab={lab} />)}
        </PreviewSection>

        <LearningHistoryCallout />

        <section id="features" className="mx-auto max-w-7xl px-5 py-8 sm:px-7 lg:py-10">
          <h2 className="text-2xl font-black">Why Students Love AWT</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {featureItems.map((feature) => <FeatureItem key={feature.title} feature={feature} />)}
          </div>
        </section>

        <LandingFooter />
      </div>
    </main>
  )
}

function normalizeLectures(items = []) {
  const normalized = items
    .filter((lecture) => lecture?.title && lecture?.slug)
    .map((lecture, index) => ({
      ...lecture,
      order: lecture.order || index + 1,
      group: lecture.group || lecture.category || 'AWT',
      duration: lecture.duration || `${Math.max(25, Math.ceil((lecture.english_content || lecture.shortDescription || '').length / 700))} min`
    }))

  return normalized.length >= 5 ? normalized : [...normalized, ...fallbackLectures].slice(0, 5)
}

function normalizeLabs(items = []) {
  const normalized = items
    .filter((lab) => lab?.title && lab?.slug)
    .map((lab, index) => ({
      ...lab,
      labNumber: String(lab.labNumber || lab.number || lab.order || index + 1).padStart(2, '0'),
      duration: lab.estimatedTime || lab.duration || '2 - 3 Hours',
      group: lab.group || 'Lab'
    }))

  return normalized.length >= 5 ? normalized : [...normalized, ...fallbackLabs].slice(0, 5)
}

function LandingNav() {
  return (
    <header className="border-b border-slate-900/90 bg-[#020817]/85 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-7">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <BrandLogo className="h-10 w-10 rounded-lg bg-emerald-400 text-[10px] font-black text-slate-950" />
          <span className="min-w-0">
            <span className="block text-2xl font-black leading-tight">AWT</span>
            <span className="block truncate text-xs font-medium text-slate-300">Interactive Learning Platform</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-200 lg:flex">
          {navItems.map(([label, to]) => (
            <NavLink key={label} to={to}>{label}</NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-4 sm:flex">
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/35 px-4 text-xs font-bold text-slate-200">
            <Globe2 className="h-4 w-4" />
            EN
            <ChevronDown className="h-4 w-4" />
          </button>
          <Link to="/student" className="inline-flex h-10 items-center rounded-lg border border-emerald-400/70 px-5 text-sm font-black text-white transition hover:bg-emerald-400/10">
            Sign In
          </Link>
          <a href="#lectures" className="inline-flex h-10 items-center rounded-lg bg-emerald-400 px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
            Get Started
          </a>
        </div>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-200 sm:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

function NavLink({ to, children }) {
  if (to.startsWith('#')) {
    return <a href={to} className="transition hover:text-emerald-300">{children}</a>
  }
  return <Link to={to} className="transition hover:text-emerald-300">{children}</Link>
}

function HeroGraphic() {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-2xl lg:min-h-[500px]">
      <FloatingTech className="left-[8%] top-[8%]" icon={Code2} text="JS" color="emerald" />
      <FloatingTech className="bottom-[12%] left-[8%]" text="JS" color="yellow" />
      <FloatingTech className="right-[5%] top-[8%]" icon={Atom} color="cyan" large />
      <FloatingTech className="bottom-[12%] right-[6%]" icon={Server} color="green" />
      <div className="absolute left-1/2 top-1/2 w-[82%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-slate-900/85 p-4 shadow-2xl shadow-emerald-950/40 backdrop-blur">
        <div className="mb-5 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
        </div>
        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {['w-24', 'w-56', 'w-44', 'w-28', 'w-36', 'w-52', 'w-32', 'w-48'].map((width, index) => (
              <CodeLine key={index} width={width} index={index} />
            ))}
          </div>
          <div className="space-y-5">
            <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-800/75 text-slate-500">
              <Code2 className="h-20 w-20" />
            </div>
            <div className="space-y-3 rounded-xl bg-slate-950/25 p-4">
              <span className="block h-3 w-24 rounded-full bg-slate-700" />
              <span className="block h-3 w-full rounded-full bg-slate-800" />
              <span className="block h-3 w-4/5 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeLine({ width, index }) {
  const colors = ['bg-slate-700', 'bg-orange-400', 'bg-amber-200', 'bg-indigo-400', 'bg-emerald-400']
  return (
    <div className="flex items-center gap-3">
      <span className="h-2.5 w-4 rounded-full bg-slate-700" />
      <span className={`h-2.5 ${width} rounded-full ${colors[index % colors.length]}`} />
      {index % 3 === 0 && <span className="h-2.5 w-8 rounded-full bg-emerald-500/70" />}
    </div>
  )
}

function FloatingTech({ className = '', icon: Icon, text, color = 'emerald', large = false }) {
  const colorClasses = {
    emerald: 'border-emerald-400/35 bg-emerald-400/10 text-lime-300',
    yellow: 'border-yellow-400/35 bg-yellow-400/10 text-yellow-300',
    cyan: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-300',
    green: 'border-green-400/35 bg-green-400/10 text-green-300'
  }
  return (
    <div className={`absolute z-10 flex ${large ? 'h-24 w-24' : 'h-20 w-20'} items-center justify-center rounded-xl border ${colorClasses[color]} shadow-xl shadow-black/20 ${className}`}>
      {Icon ? <Icon className={large ? 'h-14 w-14' : 'h-10 w-10'} /> : <span className="text-2xl font-black">{text}</span>}
    </div>
  )
}

function HeroBadge({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-md border border-emerald-400/35 text-emerald-300">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span>{text}</span>
    </div>
  )
}

function StatCard({ stat }) {
  const Icon = stat.icon
  const colorClasses = {
    cyan: 'bg-cyan-400/10 text-cyan-300',
    purple: 'bg-purple-400/15 text-purple-300',
    emerald: 'bg-emerald-400/10 text-emerald-300',
    yellow: 'bg-yellow-400/10 text-yellow-300'
  }
  return (
    <div className="flex items-center gap-5 border-slate-800/90 lg:border-r lg:last:border-r-0">
      <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${colorClasses[stat.color]}`}>
        <Icon className="h-8 w-8" />
      </span>
      <div>
        <p className="text-3xl font-black leading-none">{stat.value}</p>
        <p className="mt-1 text-sm font-black">{stat.label}</p>
        <p className="text-xs text-slate-300">{stat.text}</p>
      </div>
    </div>
  )
}

function PreviewSection({ id, title, viewLabel, viewTo, isLoading, emptyText, children }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section id={id} className="mx-auto max-w-7xl px-5 pt-5 sm:px-7">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">{title}</h2>
          <Link to={viewTo} className="inline-flex items-center gap-2 text-sm font-black text-emerald-300 hover:text-emerald-200">
            {viewLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {isLoading ? Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />) : hasContent ? children : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-400">{emptyText}</div>
          )}
        </div>
      </div>
    </section>
  )
}

function LectureCard({ lecture }) {
  return (
    <PreviewCard to={`/student/lectures/${lecture.slug}`} buttonText="View Lecture">
      <CategoryIcon label={lecture.group || 'AWT'} />
      <h3 className="mt-5 line-clamp-2 min-h-[3rem] text-base font-black text-white">{lecture.title}</h3>
      <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-300">
        {lecture.shortDescription || lecture.short_description || 'Open this lecture to explore the lesson content and examples.'}
      </p>
      <p className="mt-4 text-xs font-semibold text-slate-400">
        Lecture {lecture.order || 1}
        <span className="mx-2">-</span>
        {lecture.duration || '25 min'}
      </p>
    </PreviewCard>
  )
}

function LabCard({ lab }) {
  return (
    <PreviewCard to={`/student/labs/${lab.slug}`} buttonText="Open Lab">
      <div className="flex items-center gap-3">
        <CategoryIcon label={lab.group || 'Lab'} compact />
        <span className="text-sm font-semibold text-slate-300">Lab {lab.labNumber}</span>
      </div>
      <h3 className="mt-5 line-clamp-2 min-h-[3rem] text-base font-black text-white">{cleanLabTitle(lab.title)}</h3>
      <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-300">
        {lab.objective || 'Practice a focused AWT skill with guided steps and a working output.'}
      </p>
      <p className="mt-4 text-xs font-semibold text-slate-400">{lab.duration || '2 - 3 Hours'}</p>
    </PreviewCard>
  )
}

function PreviewCard({ to, buttonText, children }) {
  return (
    <Link to={to} className="group flex min-h-[244px] flex-col rounded-lg border border-slate-800 bg-slate-950/30 p-4 transition hover:-translate-y-1 hover:border-emerald-400/45 hover:bg-slate-900/70">
      <div className="flex-1">{children}</div>
      <span className="mt-5 inline-flex h-10 items-center justify-between rounded-md border border-slate-700 px-3 text-sm font-black text-white transition group-hover:border-emerald-400/60 group-hover:text-emerald-300">
        {buttonText}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

function CategoryIcon({ label, compact = false }) {
  const lower = String(label).toLowerCase()
  let Icon = Code2
  let color = 'bg-cyan-400/15 text-cyan-300'
  if (lower.includes('html')) color = 'bg-emerald-400/15 text-emerald-300'
  if (lower.includes('css')) color = 'bg-amber-400/15 text-amber-300'
  if (lower.includes('js') || lower.includes('javascript')) color = 'bg-yellow-400/15 text-yellow-300'
  if (lower.includes('react')) {
    Icon = Atom
    color = 'bg-cyan-400/15 text-cyan-300'
  }
  if (lower.includes('db') || lower.includes('mongo')) {
    Icon = Server
    color = 'bg-green-400/15 text-green-300'
  }
  if (lower.includes('lab') || lower.includes('fs')) {
    Icon = compact ? FlaskConical : Box
    color = 'bg-purple-400/15 text-purple-300'
  }

  return (
    <span className={`flex ${compact ? 'h-10 w-10' : 'h-12 w-12'} items-center justify-center rounded-lg ${color}`}>
      {compact ? <Icon className="h-5 w-5" /> : <span className="text-xs font-black uppercase">{shortLabel(label)}</span>}
    </span>
  )
}

function shortLabel(label) {
  const text = String(label || 'AWT')
  if (text.toLowerCase().includes('javascript')) return 'JS'
  if (text.length <= 5) return text
  return text.slice(0, 4)
}

function cleanLabTitle(title = '') {
  return title.replace(/^Lab\s+\d+:\s*/i, '')
}

function LearningHistoryCallout() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-5 sm:px-7">
      <div className="grid gap-6 overflow-hidden rounded-xl border border-emerald-400/35 bg-slate-900/65 p-7 shadow-xl shadow-emerald-950/20 md:grid-cols-[180px_1fr_auto] md:items-center">
        <div className="relative hidden h-28 items-center justify-center md:flex">
          <span className="absolute h-24 w-40 rounded-full border border-emerald-400/20" />
          <span className="absolute h-16 w-28 -rotate-12 rounded-full border border-cyan-400/15" />
          <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 shadow-2xl shadow-emerald-500/20">
            <LockKeyhole className="h-12 w-12" />
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-black">Want to track your learning history?</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">
            Sign in to save your completed lectures, labs, quiz scores and track your progress over time.
          </p>
        </div>
        <div className="text-left md:text-center">
          <Link to="/student" className="inline-flex h-14 min-w-48 items-center justify-center gap-3 rounded-lg bg-emerald-400 px-7 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
            <User className="h-5 w-5" />
            Sign In
          </Link>
          <p className="mt-3 text-sm text-slate-300">It&apos;s free and only takes a minute!</p>
        </div>
      </div>
    </section>
  )
}

function FeatureItem({ feature }) {
  const Icon = feature.icon
  return (
    <div className="border-slate-800/80 lg:border-r lg:last:border-r-0 lg:pr-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-sm font-black">{feature.title}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-300">{feature.text}</p>
    </div>
  )
}

function LandingFooter() {
  return (
    <footer className="mt-8 border-t border-slate-900 bg-slate-900/55">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-7 lg:grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_1.7fr]">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo className="h-9 w-9 rounded-lg bg-emerald-400 text-[10px] font-black text-slate-950" />
            <span>
              <span className="block text-xl font-black">AWT</span>
              <span className="block text-xs text-slate-300">Interactive Learning Platform</span>
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-7 text-slate-300">
            Your complete platform to learn advanced web technologies with interactive content and hands-on practice.
          </p>
          <div className="mt-5 flex gap-3">
            {socialItems.map((Icon, index) => (
              <span key={index} className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 text-slate-300">
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
        <FooterColumn title="Platform" links={[
          { label: 'Lectures', to: '/student/lectures' },
          { label: 'Labs', to: '/student/labs' },
          { label: 'Sign In', to: '/student' },
          { label: 'Admin', to: '/admin' }
        ]} />
        <FooterColumn title="Company" links={[
          { label: 'About Us', to: '#features' },
          { label: 'Contact Us', to: '#' },
          { label: 'Privacy Policy', to: '#' },
          { label: 'Terms of Use', to: '#' }
        ]} />
        <FooterColumn title="Help" links={[
          { label: 'FAQ', to: '#' },
          { label: 'Guides', to: '#' },
          { label: 'Support', to: '#' },
          { label: 'Report Issue', to: '#' }
        ]} />
        <div>
          <h3 className="font-black">Stay Updated</h3>
          <p className="mt-4 text-sm leading-6 text-slate-300">Subscribe to get the latest updates and new content notifications.</p>
          <form className="mt-5 flex overflow-hidden rounded-md border border-slate-700 bg-slate-950/40">
            <label className="sr-only" htmlFor="landing-email">Email</label>
            <div className="flex flex-1 items-center gap-2 px-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input id="landing-email" type="email" placeholder="Enter your email" className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </div>
            <button type="submit" className="bg-emerald-400 px-5 text-sm font-black text-slate-950">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-slate-800 px-5 py-5 text-center text-xs text-slate-400 sm:px-7">
        © 2024 AWT Interactive Learning Platform. All rights reserved.
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="font-black">{title}</h3>
      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        {links.map((link) => {
          const label = typeof link === 'string' ? link : link.label
          const to = typeof link === 'string' ? '#' : link.to
          if (to.startsWith('/')) {
            return <Link key={label} to={to} className="transition hover:text-emerald-300">{label}</Link>
          }
          return <a key={label} href={to} className="transition hover:text-emerald-300">{label}</a>
        })}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="min-h-[244px] rounded-lg border border-slate-800 bg-slate-950/30 p-4">
      <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-800" />
      <div className="mt-6 h-5 w-4/5 animate-pulse rounded bg-slate-800" />
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-800/80" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-800/80" />
      <div className="mt-8 h-10 w-full animate-pulse rounded bg-slate-800/70" />
    </div>
  )
}
