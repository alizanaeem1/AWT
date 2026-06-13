import { Globe, ImagePlus, Palette, Save, Type, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSiteSettings } from '../hooks/useAdminData.js'
import { useToast } from '../hooks/useToast.js'
import { useTheme } from '../hooks/useTheme.js'
import { saveSiteSettings, uploadMediaFile } from '../lib/adminRepository.js'
import { defaultLogoText, getLogoText } from '../lib/siteBrand.js'

const emptySettings = {
  websiteTitle: 'AWT Interactive Learning Platform',
  logoUrl: '',
  logoText: defaultLogoText,
  primaryColor: '#34d399',
  secondaryColor: '#22d3ee',
  defaultTheme: 'dark',
  languageDefault: 'en'
}

export default function ThemeSettingsPage() {
  const { data: settings, isLoading } = useSiteSettings()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()

  const [savedValues, setSavedValues] = useState(null)
  const [draftValues, setDraftValues] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadedSettings = useMemo(
    () => ({ ...emptySettings, ...settings }),
    [settings]
  )

  const loadedValues = draftValues || savedValues || loadedSettings
  const formValues = {
    ...loadedValues,
    defaultTheme: draftValues?.defaultTheme || theme,
    languageDefault: 'en'
  }
  const logoFallbackText = getLogoText(formValues.logoText, formValues.websiteTitle)
  const isLongLogoText = logoFallbackText.length > 2
  const logoWordCount = logoFallbackText.split(/\s+/).filter(Boolean).length
  const logoFallbackStyle = isLongLogoText
    ? {
        width: `${Math.min(28, Math.max(5.5, logoFallbackText.length * 0.85 + logoWordCount))}ch`,
        maxWidth: '100%'
      }
    : undefined
  const logoTextStyle = isLongLogoText
    ? {
        fontSize: `${Math.max(0.5, Math.min(0.875, 1.05 - logoFallbackText.length * 0.02))}rem`
      }
    : undefined

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  function updateField(field, value) {
    setDraftValues((current) => ({ ...(current || formValues), [field]: value }))
  }

  function handleThemeClick(selectedTheme) {
    updateField('defaultTheme', selectedTheme)
    setTheme(selectedTheme)
  }

  function handleLogoFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setLogoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return previewUrl
    })
  }

  function clearLogo() {
    setLogoFile(null)
    setLogoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return ''
    })
    updateField('logoUrl', '')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    try {
      let nextValues = formValues
      if (logoFile) {
        const logoUrl = await uploadMediaFile(logoFile, 'logos')
        nextValues = { ...formValues, logoUrl }
      }

      const saved = await saveSiteSettings(nextValues)
      const normalized = { ...emptySettings, ...saved, languageDefault: 'en' }
      setSavedValues(normalized)
      setDraftValues(null)
      setLogoFile(null)
      setLogoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return ''
      })
      showToast('Theme settings saved successfully.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-400 ring-1 ring-purple-400/20">
          <Palette className="h-3 w-3" />
          Appearance
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Theme Settings</h1>
        <p className="mt-1.5 text-sm text-slate-400">Configure website identity, colors, and platform preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <Type className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-white">Site Identity</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Website Title</span>
                <input
                  type="text"
                  value={formValues.websiteTitle}
                  onChange={(event) => updateField('websiteTitle', event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-700/60 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                  placeholder="My Learning Platform"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Logo Text</span>
                <input
                  type="text"
                  value={formValues.logoText}
                  onChange={(event) => updateField('logoText', event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-700/60 bg-slate-950/60 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                  placeholder={defaultLogoText}
                />
                <p className="mt-2 text-xs text-slate-500">Shows when no image logo is saved.</p>
              </label>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Website Logo</span>
                <div className="mt-2 flex items-center gap-3">
                  {logoPreviewUrl || formValues.logoUrl ? (
                    <span className="flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/60">
                      <img src={logoPreviewUrl || formValues.logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                    </span>
                  ) : (
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950/60 text-sm font-black text-emerald-300 ring-1 ring-slate-700/60"
                      style={logoFallbackStyle}
                      title={logoFallbackText}
                    >
                      <span className="block max-w-full whitespace-nowrap px-1.5 text-center leading-tight" style={logoTextStyle}>
                        {logoFallbackText}
                      </span>
                    </span>
                  )}

                  <div className="flex min-w-0 flex-1 gap-2">
                    <label className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/40 px-3 text-xs font-black text-slate-300 transition hover:border-emerald-400/50 hover:text-white">
                      <ImagePlus className="h-4 w-4" />
                      Upload
                      <input type="file" accept="image/*" onChange={handleLogoFileChange} className="sr-only" />
                    </label>
                    {(logoPreviewUrl || formValues.logoUrl) ? (
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/40 px-3 text-xs font-black text-slate-400 transition hover:border-red-400/50 hover:text-red-300"
                        aria-label="Remove logo"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Logo applies after saving.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
              <Palette className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-white">Brand Colors</h2>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Color</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/60 px-4 py-2.5 transition focus-within:border-emerald-400/60">
                <div className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/10">
                  <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: formValues.primaryColor }} />
                  <input
                    type="color"
                    value={formValues.primaryColor}
                    onChange={(event) => updateField('primaryColor', event.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <span className="font-mono text-sm font-bold text-slate-200">{formValues.primaryColor}</span>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Secondary Color</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/60 px-4 py-2.5 transition focus-within:border-emerald-400/60">
                <div className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/10">
                  <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: formValues.secondaryColor }} />
                  <input
                    type="color"
                    value={formValues.secondaryColor}
                    onChange={(event) => updateField('secondaryColor', event.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <span className="font-mono text-sm font-bold text-slate-200">{formValues.secondaryColor}</span>
              </div>
            </label>

            <div className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview</span>
              <div className="mt-2 flex gap-3">
                <div className="flex-1 rounded-2xl px-4 py-3 text-center text-xs font-black text-slate-950" style={{ backgroundColor: formValues.primaryColor }}>
                  Primary
                </div>
                <div className="flex-1 rounded-2xl px-4 py-3 text-center text-xs font-black text-slate-950" style={{ backgroundColor: formValues.secondaryColor }}>
                  Secondary
                </div>
                <div
                  className="flex-1 rounded-2xl px-4 py-3 text-center text-xs font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${formValues.primaryColor}, ${formValues.secondaryColor})` }}
                >
                  Gradient
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-black text-white">Preferences</h2>
          </div>
          <div className="p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Theme</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['dark', 'light'].map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  onClick={() => handleThemeClick(themeOption)}
                  className={`rounded-2xl border py-3 text-sm font-black capitalize transition ${
                    formValues.defaultTheme === themeOption
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
                      : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {themeOption}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Changes apply instantly across the app.</p>
          </div>
        </section>

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
