import { useEffect, useState } from 'react'

export default function OfflineGate({ children }) {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  })

  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  if (isOnline) return children

  return (
    <main className="grid min-h-screen place-items-center bg-[#020b16] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/80 p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-sm font-black text-slate-950">
          AWT
        </div>
        <h1 className="mt-6 text-3xl font-black">You are offline.</h1>
        <p className="mt-3 leading-7 text-slate-300">Please reconnect to continue.</p>
      </div>
    </main>
  )
}
