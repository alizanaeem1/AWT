import React from "react";
import { useApp } from "../context/AppContext";

const toneMap = {
  info: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-100"
};

export default function ToastStack() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[340px] flex-col gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`pointer-events-auto rounded-xl border p-3 shadow-lg shadow-black/30 transition-all ${toneMap[toast.variant] || toneMap.info}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-xs opacity-90">{toast.message}</p> : null}
            </div>
            <button className="text-xs opacity-80 hover:opacity-100" onClick={() => dismissToast(toast.id)}>
              Dismiss
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
