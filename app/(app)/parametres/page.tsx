'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp, Theme, Langue } from '@/lib/app-context'
import { createClient } from '@/lib/supabase'

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm transition"
const disabledCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed"

export default function ParametresPage() {
  const router = useRouter()
  const { langue, setLangue, theme, setTheme, tr } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [devise, setDevise] = useState('FCFA')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cacheSize, setCacheSize] = useState('...')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '')
        supabase.from('profiles').select('full_name, devise').eq('id', user.id).single()
          .then(({ data }) => {
            if (data) { setName(data.full_name || ''); setDevise(data.devise || 'FCFA') }
          })
      }
    })
    try {
      let size = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || ''
        size += (localStorage.getItem(key) || '').length
      }
      setCacheSize((size / 1024).toFixed(1) + ' KB')
    } catch { setCacheSize('N/A') }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name: name, devise }).eq('id', user!.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function viderCache() {
    if (!confirm('Vider le cache ?')) return
    localStorage.clear()
    setCacheSize('0 KB')
    window.location.reload()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const langues: { code: Langue, label: string, flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'wo', label: 'Wolof', flag: '🇸🇳' },
  ]

  const themes: { code: Theme, label: string, icon: string }[] = [
    { code: 'light', label: tr('mode_clair'), icon: '☀️' },
    { code: 'dark', label: tr('mode_sombre'), icon: '🌙' },
    { code: 'system', label: tr('mode_systeme'), icon: '📱' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-brand-800 dark:text-brand-200" style={{ fontFamily: 'Georgia, serif' }}>
        ⚙️ {tr('parametres')}
      </h1>

      {/* Profil */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">👤 {tr('profil')}</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nom complet</label>
            <input type="text" className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" className={disabledCls} value={email} disabled />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Devise</label>
            <select className={inputCls} value={devise} onChange={e => setDevise(e.target.value)}>
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition disabled:opacity-60" disabled={saving}>
            {saved ? '✅ Enregistré !' : saving ? 'Enregistrement...' : tr('enregistrer')}
          </button>
        </form>
      </div>

      {/* Langue */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">🌍 {tr('langue')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {langues.map(l => (
            <button key={l.code} onClick={() => setLangue(l.code)}
              className={'py-3 rounded-xl text-sm font-medium border transition flex flex-col items-center gap-1 ' +
                (langue === l.code ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700')}>
              <span className="text-xl">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Thème */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">🎨 {tr('theme')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(t => (
            <button key={t.code} onClick={() => setTheme(t.code)}
              className={'py-3 rounded-xl text-sm font-medium border transition flex flex-col items-center gap-1 ' +
                (theme === t.code ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700')}>
              <span className="text-xl">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cache */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">🗄️ Cache</h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Taille du cache</p>
            <p className="text-xs text-gray-400">{cacheSize}</p>
          </div>
          <button onClick={viderCache} className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition">
            🗑️ {tr('vider_cache')}
          </button>
        </div>
      </div>

      {/* À propos */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">ℹ️ {tr('a_propos')}</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>{tr('version')}</span>
            <span className="font-medium text-brand-600">v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Application</span>
            <span className="font-medium">Suivi Dépenses</span>
          </div>
        </div>
      </div>

      {/* Déconnexion */}
      <button onClick={handleLogout}
        className="w-full py-3 rounded-xl text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition">
        🚪 {tr('deconnexion')}
      </button>
    </div>
  )
}
