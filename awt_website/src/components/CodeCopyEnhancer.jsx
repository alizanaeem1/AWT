import { Check, Clipboard } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightCode(value) {
  return escapeHtml(value)
    .replace(/(&lt;\/?)([a-zA-Z0-9-]+)/g, '$1<span class="syntax-tag">$2</span>')
    .replace(/\b(const|let|function|return|import|from|export|async|await|if|else)\b/g, '<span class="syntax-keyword">$1</span>')
    .replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="syntax-string">$1</span>')
}

function CopyButton({ code }) {
  async function copyCode(event) {
    const button = event.currentTarget
    await navigator.clipboard.writeText(code)
    button.dataset.copied = 'true'
    window.setTimeout(() => {
      button.dataset.copied = 'false'
    }, 1500)
  }

  return (
    <button
      type="button"
      onClick={copyCode}
      data-copied="false"
      className="code-copy-button inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-cyan-400 hover:text-white"
    >
      <Clipboard className="copy-icon h-3.5 w-3.5" />
      <Check className="check-icon hidden h-3.5 w-3.5 text-emerald-300" />
      Copy
    </button>
  )
}

export default function CodeCopyEnhancer() {
  const location = useLocation()

  useEffect(() => {
    const roots = []
    const pres = [...document.querySelectorAll('main pre')].filter((pre) => !pre.dataset.copyEnhanced)
    pres.forEach((pre) => {
      pre.dataset.copyEnhanced = 'true'
      pre.classList.add('relative')
      const codeElement = pre.querySelector('code')
      const code = codeElement?.innerText || pre.innerText
      if (codeElement) codeElement.innerHTML = highlightCode(code)
      const mount = document.createElement('div')
      mount.className = 'absolute right-3 top-3'
      pre.appendChild(mount)
      const root = createRoot(mount)
      root.render(<CopyButton code={code} />)
      roots.push(root)
    })

    return () => roots.forEach((root) => root.unmount())
  }, [location.pathname])

  return null
}
