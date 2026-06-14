import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { ProgressProvider } from './context/ProgressContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import OfflineGate from './components/OfflineGate.jsx'
import './styles/index.css'

const isLocalPreview = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

if ((import.meta.env.DEV || isLocalPreview) && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys
        .filter((key) => key.includes('workbox') || key.includes('awt-'))
        .forEach((key) => caches.delete(key))
    })
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProgressProvider>
            <OfflineGate>
              <RouterProvider router={router} />
            </OfflineGate>
          </ProgressProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
)
