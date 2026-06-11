import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const location = useLocation()

  useEffect(() => {
    function updateProgress() {
      const article = document.querySelector('main article')
      if (!article) {
        setProgress(0)
        return
      }

      const rect = article.getBoundingClientRect()
      const readableHeight = rect.height - window.innerHeight
      const read = Math.min(Math.max(-rect.top, 0), Math.max(readableHeight, 1))
      setProgress(Math.round((read / Math.max(readableHeight, 1)) * 100))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [location.pathname])

  return (
    <div className="fixed left-0 right-0 top-16 z-40 h-0.5 bg-transparent">
      <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
    </div>
  )
}
