import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  tone = 'danger',
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null

  const toneClasses = tone === 'danger'
    ? {
        icon: 'border-red-400/30 bg-red-400/10 text-red-300',
        button: 'bg-red-500 text-white hover:bg-red-400'
      }
    : {
        icon: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
        button: 'bg-amber-400 text-slate-950 hover:bg-amber-300'
      }

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={onCancel}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0b1020] shadow-2xl shadow-black/50"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4 border-b border-slate-800 p-5">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${toneClasses.icon}`}>
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-black text-white">{title}</h2>
            {message ? <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p> : null}
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-3 bg-slate-950/50 p-4">
          <button type="button" onClick={onCancel} disabled={isLoading} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:border-slate-500 disabled:opacity-60">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={isLoading} className={`rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses.button}`}>
            {isLoading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
