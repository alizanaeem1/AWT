import { Globe, Palette, Save, Type } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSiteSettings } from '../hooks/useAdminData.js'
import { useToast } from '../hooks/useToast.js'
import { saveSiteSettings } from '../lib/adminRepository.js'

const emptySettings = {
  websiteTitle: 'AWT Interactive Learning Platform',
  logoUrl: '',
  primaryColor: '#34d399',
  secondaryColor: '#22d3ee',
  defaultTheme: 'dark',
  languageDefault: 'en'
}

export default function ThemeSettingsPage() {
  const { data: settings, isLoading } = useSiteSettings()
  const { showToast } = useToast()
  const [baseValues, setBaseValues] = useState(null)
  const [draftValues, setDraftValues] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Once settings load from DB/localStorage, lock them in as base values
  useEffect(() => {
    if (!isLoading && settings) {
      setBaseValues({ ...emptySettings, ...settings })
      setDraftValues(null)
    }
  }, [isLoading, settings])

  const formValues = draftValues || baseValues || { ...emptySettings, ...settings }

  function updateField(field, value) {
    setDraftValues((current) => ({ ...(current || formValues), [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    try {
      const saved = await saveSiteSettings(formValues)
      const normalized = { ...emptySettings, ...saved }
      setBaseValues(normalized)
      setDraftValues(null)
      showToast('Theme settings saved successfully.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-400 ring-1 ring-purple-400/20">
          <Palette className="h-3 w-3" />
          Appearance
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Theme Settings</h1>
        <p className="mt-1.5 text-sm text-slate-400">Configure website identity, colors, and platform preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Site Identity */}
        <section className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Type className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-white">Site Identity</h2>
          </div>
          <div className="p-6">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Website Title</span>
              <input
                type="text"
                value={formValues.websiteTitle}
                onChange={(e) => updateField('websiteTitle', e.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-slate-700/60 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                placeholder="My Learning Platform"
              />
            </label>
          </div>
        </section>

        {/* Colors */}
        <section className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
              <Palette className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-white">Brand Colors</h2>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {/* Primary Color */}
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Color</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/60 px-4 py-2.5 transition focus-within:border-emerald-400/60">
                <div className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/10">
                  <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: formValues.primaryColor }} />
                  <input
                    type="color"
                    value={formValues.primaryColor}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <span className="font-mono text-sm font-bold text-slate-200">{formValues.primaryColor}</span>
              </div>
            </label>

            {/* Secondary Color */}
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Secondary Color</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/60 px-4 py-2.5 transition focus-within:border-emerald-400/60">
                <div className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/10">
                  <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: formValues.secondaryColor }} />
                  <input
                    type="color"
                    value={formValues.secondaryColor}
                    onChange={(e) => updateField('secondaryColor', e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <span className="font-mono text-sm font-bold text-slate-200">{formValues.secondaryColor}</span>
              </div>
            </label>

            {/* Color Preview */}
            <div className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview</span>
              <div className="mt-2 flex gap-3">
                <div className="flex-1 rounded-2xl px-4 py-3 text-center text-xs font-black text-slate-950" style={{ backgroundColor: formValues.primaryColor }}>
                  Primary
                </div>
                <div className="flex-1 rounded-2xl px-4 py-3 text-center text-xs font-black text-slate-950" style={{ backgroundColor: formValues.secondaryColor }}>
                  Secondary
                </div>
                <div className="flex-1 rounded-2xl px-4 py-3 text-center text-xs font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${formValues.primaryColor}, ${formValues.secondaryColor})` }}>
                  Gradient
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-white">Preferences</h2>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {/* Default Theme */}
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Theme</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {['dark', 'light'].map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => updateField('defaultTheme', theme)}
                    className={`rounded-2xl border py-3 text-sm font-black capitalize transition ${
                      formValues.defaultTheme === theme
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
                        : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </label>

            {/* Language */}
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Language</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[{ value: 'en', label: '🇺🇸 English' }, { value: 'roman-urdu', label: '🇵🇰 Roman Urdu' }].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField('languageDefault', value)}
                    className={`rounded-2xl border py-3 text-sm font-black transition ${
                      formValues.languageDefault === value
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
                        : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </label>
          </div>
        </section>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving || isLoading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:from-emerald-300 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Theme Settings'}
        </button>
      </form>
    </div>
  )
}
