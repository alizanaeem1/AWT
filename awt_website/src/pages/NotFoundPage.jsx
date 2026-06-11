import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Page not found</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">The page you requested does not exist.</p>
      <Link className="mt-6 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white" to="/">
        Return home
      </Link>
    </section>
  )
}
