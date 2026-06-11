export function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-emerald-300">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function AdminCard({ children, className = '' }) {
  return <section className={`rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm ${className}`}>{children}</section>
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 ${className}`}
    />
  )
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
    />
  )
}

export function Toggle({ label, defaultChecked = true, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        type="checkbox"
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 accent-emerald-400"
      />
    </label>
  )
}

export function UploadBox({ label = 'Upload file' }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950 p-6 text-center">
      <p className="text-sm font-semibold text-slate-200">{label}</p>
      <p className="mt-1 text-xs text-slate-500">PNG, JPG, SVG, or WebP. Demo UI only.</p>
    </div>
  )
}
