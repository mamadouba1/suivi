'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/auth/forgot-password')
      }
    })
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Erreur : ' + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #f9e8d0 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>
            Nouveau mot de passe
          </h1>
          <p className="text-gray-500 text-sm mt-1">Choisissez un nouveau mot de passe.</p>
        </div>
        <div className="card">
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}
            <div>
              <label className="label">Nouveau mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input pr-12"
                  placeholder="Minimum 6 caracteres" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirmer le mot de passe</label>
              <input type={showPassword ? 'text' : 'password'} className="input"
                placeholder="Repetez le mot de passe" value={confirm}
                onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Mise a jour...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
