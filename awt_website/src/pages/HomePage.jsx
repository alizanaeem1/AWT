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
  ['Sign In', '/signin']
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
          Promise.all([getPublishedLectures(), getPublishedLabs()]),
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
    return () => { ignore = true }
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

        {/* ── HERO ── */}
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-7 sm:pt-10 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10 lg:pb-10 lg:pt-16">

          {/* Left column: copy */}
          <div>
            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Learn <span className="block text-emerald-400">Advanced Web</span> Technologies
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:mt-6 sm:text-base sm:leading-8">
              Interactive lectures, hands-on labs, real code examples and expert content to boost your web development skills.
            </p>

            {/* Buttons — stacked on mobile, row on sm+ */}
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
              <a
                href="#lectures"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300 sm:h-14 sm:w-auto sm:px-7"
              >
                Start Learning
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <Link
                to="/signin"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-600/80 bg-slate-950/35 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-emerald-300/70 sm:h-14 sm:w-auto sm:px-7"
              >
                <User className="h-4 w-4" />
                Sign In to Track Progress
              </Link>
            </div>

            {/* Feature badges — 2 cols on mobile, 4 on lg */}
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:mt-8 sm:text-sm lg:grid-cols-4">
              <HeroBadge icon={CheckCircle2} text="Interactive Content" />
              <HeroBadge icon={ShieldCheck} text="Hands-on Labs" />
              <HeroBadge icon={History} text="Track Progress" />
              <HeroBadge icon={Download} text="PWA Ready" />
            </div>
          </div>

          {/* Right column: illustration — hidden on small mobile, shown from sm */}
          <div className="mt-8 sm:mt-10 lg:mt-0">
            <HeroGraphic />
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-7">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800/95 bg-slate-900/65 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:gap-4 sm:p-5 lg:grid-cols-4">
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

        {/* ── FEATURES ── */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:py-10">
          <h2 className="text-xl font-black sm:text-2xl">Why Students Love AWT</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
    .filter((l) => l?.title && l?.slug)
    .map((l, i) => ({
      ...l,
      order: l.order || i + 1,
      group: l.group || l.category || 'AWT',
      duration: l.duration || `${Math.max(25, Math.ceil((l.english_content || l.shortDescription || '').length / 700))} min`
    }))
  return normalized.length > 0 ? normalized : fallbackLectures
}

function normalizeLabs(items = []) {
  const normalized = items
    .filter((l) => l?.title && l?.slug)
    .map((l, i) => ({
      ...l,
      labNumber: String(l.labNumber || l.number || l.order || i + 1).padStart(2, '0'),
      duration: l.estimatedTime || l.duration || '2 - 3 Hours',
      group: l.group || 'Lab'
    }))
  return normalized.length > 0 ? normalized : fallbackLabs
}

/* ─────────────── NAV ─────────────── */
function LandingNav() {
  return (
    <header className="border-b border-slate-900/90 bg-[#020817]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-7">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandLogo className="h-8 w-8 rounded-lg bg-emerald-400 text-[10px] font-black text-slate-950 sm:h-10 sm:w-10" />
          <span className="min-w-0">
            <span className="block text-lg font-black leading-tight sm:text-2xl">AWT</span>
            <span className="hidden truncate text-xs font-medium text-slate-300 sm:block">Interactive Learning Platform</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-200 lg:flex">
          {navItems.map(([label, to]) => (
            <NavLink key={label} to={to}>{label}</NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link to="/signin" className="inline-flex h-9 items-center rounded-lg border border-emerald-400/70 px-4 text-sm font-black text-white transition hover:bg-emerald-400/10">
            Sign In
          </Link>
          <a href="#lectures" className="inline-flex h-9 items-center rounded-lg bg-emerald-400 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-300">
            Get Started
          </a>
        </div>

        {/* Mobile: sign in + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link to="/signin" className="inline-flex h-8 items-center rounded-lg bg-emerald-400 px-3 text-xs font-black text-slate-950">
            Sign In
          </Link>
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-200" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, children }) {
  if (to.startsWith('#')) return <a href={to} className="transition hover:text-emerald-300">{children}</a>
  return <Link to={to} className="transition hover:text-emerald-300">{children}</Link>
}

/* ─────────────── HERO GRAPHIC ─────────────── */
function HeroGraphic() {
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl sm:max-w-md lg:max-w-none lg:min-h-[460px]">
      {/* Floating icons — hidden on smallest screens to reduce clutter */}
      <FloatingTech className="left-[6%] top-[8%] hidden sm:flex" icon={Code2} color="emerald" />
      <FloatingTech className="bottom-[10%] left-[6%] hidden sm:flex" text="JS" color="yellow" />
      <FloatingTech className="right-[4%] top-[8%] hidden sm:flex" icon={Atom} color="cyan" large />
      <FloatingTech className="bottom-[10%] right-[4%] hidden sm:flex" icon={Server} color="green" />

      {/* Code editor mockup */}
      <div className="relative z-10 mx-auto w-[90%] rounded-2xl border border-slate-700/80 bg-slate-900/85 p-4 shadow-2xl shadow-emerald-950/40 backdrop-blur sm:absolute sm:left-1/2 sm:top-1/2 sm:w-[82%] sm:max-w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2.5">
            {['w-16 sm:w-24', 'w-40 sm:w-56', 'w-32 sm:w-44', 'w-20 sm:w-28', 'w-28 sm:w-36', 'w-36 sm:w-52', 'w-24 sm:w-32', 'w-32 sm:w-48'].map((width, i) => (
              <CodeLine key={i} width={width} index={i} />
            ))}
          </div>
          <div className="hidden space-y-4 sm:block">
            <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-800/75 text-slate-500">
              <Code2 className="h-16 w-16" />
            </div>
            <div className="space-y-2.5 rounded-xl bg-slate-950/25 p-3">
              <span className="block h-2.5 w-20 rounded-full bg-slate-700" />
              <span className="block h-2.5 w-full rounded-full bg-slate-800" />
              <span className="block h-2.5 w-4/5 rounded-full bg-slate-800" />
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
    <div className="flex items-center gap-2">
      <span className="h-2 w-3 shrink-0 rounded-full bg-slate-700" />
      <span className={`h-2 ${width} rounded-full ${colors[index % colors.length]}`} />
      {index % 3 === 0 && <span className="h-2 w-6 shrink-0 rounded-full bg-emerald-500/70" />}
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
    <div className={`absolute z-10 flex ${large ? 'h-20 w-20' : 'h-16 w-16'} items-center justify-center rounded-xl border ${colorClasses[color]} shadow-xl shadow-black/20 ${className}`}>
      {Icon ? <Icon className={large ? 'h-11 w-11' : 'h-8 w-8'} /> : <span className="text-xl font-black">{text}</span>}
    </div>
  )
}

/* ─────────────── HERO BADGE ─────────────── */
function HeroBadge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-400/35 text-emerald-300">
        <Icon className="h-3 w-3" />
      </span>
      <span className="text-xs leading-tight sm:text-sm">{text}</span>
    </div>
  )
}

/* ─────────────── STAT CARD ─────────────── */
function StatCard({ stat }) {
  const Icon = stat.icon
  const colorClasses = {
    cyan: 'bg-cyan-400/10 text-cyan-300',
    purple: 'bg-purple-400/15 text-purple-300',
    emerald: 'bg-emerald-400/10 text-emerald-300',
    yellow: 'bg-yellow-400/10 text-yellow-300'
  }
  return (
    <div className="flex items-center gap-3 border-slate-800/90 sm:gap-4 lg:border-r lg:last:border-r-0">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${colorClasses[stat.color]}`}>
        <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none sm:text-3xl">{stat.value}</p>
        <p className="mt-0.5 text-xs font-black sm:mt-1 sm:text-sm">{stat.label}</p>
        <p className="hidden text-xs text-slate-300 sm:block">{stat.text}</p>
      </div>
    </div>
  )
}

/* ─────────────── PREVIEW SECTION ─────────────── */
function PreviewSection({ id, title, viewLabel, viewTo, isLoading, emptyText, children }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section id={id} className="mx-auto max-w-7xl px-4 pt-8 sm:px-7 sm:pt-12">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-2xl shadow-black/35 backdrop-blur-md sm:p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black sm:text-2xl md:text-3xl">{title}</h2>
          <Link to={viewTo} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 sm:gap-2 sm:text-sm">
            {viewLabel}
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
        {/* 1 col → 2 col sm → 5 col lg */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : hasContent ? children
            : <div className="col-span-full rounded-xl border border-slate-800 bg-slate-950/40 p-5 text-center text-sm text-slate-400">{emptyText}</div>
          }
        </div>
      </div>
    </section>
  )
}

/* ─────────────── CARDS ─────────────── */
function LectureCard({ lecture }) {
  return (
    <PreviewCard to={`/lectures/${lecture.slug}`} buttonText="View Lecture">
      <CategoryIcon label={lecture.group || 'AWT'} />
      <h3 className="mt-4 line-clamp-2 text-sm font-black text-white sm:text-base">{lecture.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
        {lecture.shortDescription || lecture.short_description || 'Open this lecture to explore the lesson content and examples.'}
      </p>
      <p className="mt-3 text-xs font-semibold text-slate-500">
        Lecture {lecture.order || 1}
        <span className="mx-1.5">·</span>
        {lecture.duration || '25 min'}
      </p>
    </PreviewCard>
  )
}

function LabCard({ lab }) {
  return (
    <PreviewCard to={`/labs/${lab.slug}`} buttonText="Open Lab">
      <div className="flex items-center gap-2.5">
        <CategoryIcon label={lab.group || 'Lab'} compact />
        <span className="text-xs font-semibold text-slate-400">Lab {lab.labNumber}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-black text-white sm:text-base">{cleanLabTitle(lab.title)}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
        {lab.objective || 'Practice a focused AWT skill with guided steps and a working output.'}
      </p>
      <p className="mt-3 text-xs font-semibold text-slate-500">{lab.duration || '2 - 3 Hours'}</p>
    </PreviewCard>
  )
}

/* No target="_blank" — stays in same tab */
function PreviewCard({ to, buttonText, children }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-slate-800/80 bg-slate-950/20 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-emerald-950/15 sm:p-5"
    >
      <div className="flex-1">{children}</div>
      <span className="mt-4 inline-flex h-10 items-center justify-between rounded-xl border border-slate-700 px-3 text-xs font-black text-slate-200 transition-all group-hover:border-emerald-400/50 group-hover:bg-emerald-400/5 group-hover:text-emerald-300">
        {buttonText}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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
  if (lower.includes('react')) { Icon = Atom; color = 'bg-cyan-400/15 text-cyan-300' }
  if (lower.includes('db') || lower.includes('mongo')) { Icon = Server; color = 'bg-green-400/15 text-green-300' }
  if (lower.includes('lab') || lower.includes('fs') || lower.includes('node')) { Icon = compact ? FlaskConical : Box; color = 'bg-purple-400/15 text-purple-300' }

  return (
    <span className={`flex ${compact ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-10 w-10 sm:h-12 sm:w-12'} items-center justify-center rounded-lg ${color}`}>
      {compact ? <Icon className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="text-[10px] font-black uppercase sm:text-xs">{shortLabel(label)}</span>}
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

/* ─────────────── CALLOUT ─────────────── */
function LearningHistoryCallout() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-7">
      <div className="overflow-hidden rounded-2xl border border-emerald-400/35 bg-slate-900/65 p-5 shadow-xl shadow-emerald-950/20 sm:p-7 md:grid md:grid-cols-[160px_1fr_auto] md:items-center md:gap-6">
        {/* Lock icon — md+ only */}
        <div className="relative hidden h-28 items-center justify-center md:flex">
          <span className="absolute h-24 w-40 rounded-full border border-emerald-400/20" />
          <span className="absolute h-16 w-28 -rotate-12 rounded-full border border-cyan-400/15" />
          <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 shadow-2xl shadow-emerald-500/20">
            <LockKeyhole className="h-12 w-12" />
          </span>
        </div>
        <div>
          <h2 className="text-lg font-black sm:text-2xl">Want to track your learning history?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200 sm:mt-3 sm:text-base sm:leading-7">
            Sign in to save your completed lectures, labs, quiz scores and track your progress over time.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:text-center">
          <Link
            to="/signin"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 text-sm font-black text-slate-950 transition hover:bg-emerald-300 sm:h-14 md:w-48"
          >
            <User className="h-4 w-4" />
            Sign In
          </Link>
          <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm sm:text-slate-300">It&apos;s free and only takes a minute!</p>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── FEATURES ─────────────── */
function FeatureItem({ feature }) {
  const Icon = feature.icon
  return (
    <div className="lg:border-r lg:last:border-r-0 lg:pr-4 border-slate-800/80">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300 sm:h-11 sm:w-11">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <h3 className="mt-2 text-xs font-black sm:mt-3 sm:text-sm">{feature.title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400 sm:leading-6">{feature.text}</p>
    </div>
  )
}

/* ─────────────── FOOTER ─────────────── */
function LandingFooter() {
  return (
    <footer className="mt-8 border-t border-slate-900 bg-slate-900/55">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-7 sm:grid-cols-2 lg:grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_1.7fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo className="h-9 w-9 rounded-lg bg-emerald-400 text-[10px] font-black text-slate-950" />
            <span>
              <span className="block text-xl font-black">AWT</span>
              <span className="block text-xs text-slate-300">Interactive Learning Platform</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-slate-300">
            Your complete platform to learn advanced web technologies with interactive content and hands-on practice.
          </p>
          <div className="mt-4 flex gap-3">
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
          { label: 'Sign In', to: '/signin' },
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
        <div className="sm:col-span-2 lg:col-span-1">
          <h3 className="font-black">Stay Updated</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">Subscribe to get the latest updates and new content notifications.</p>
          <form className="mt-4 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950/40">
            <label className="sr-only" htmlFor="landing-email">Email</label>
            <div className="flex flex-1 items-center gap-2 px-3">
              <Mail className="h-4 w-4 shrink-0 text-slate-500" />
              <input id="landing-email" type="email" placeholder="Enter your email" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </div>
            <button type="submit" className="bg-emerald-400 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-300">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-400 sm:px-7">
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
          if (to.startsWith('/')) return <Link key={label} to={to} className="transition hover:text-emerald-300">{label}</Link>
          return <a key={label} href={to} className="transition hover:text-emerald-300">{label}</a>
        })}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5">
      <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-800 sm:h-12 sm:w-12" />
      <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-slate-800" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-800/80" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-800/80" />
      <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-slate-800/70" />
    </div>
  )
}
