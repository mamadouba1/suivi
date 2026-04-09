'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/callback?next=/auth/reset-password',
    })
    if (error) {
      setError('Email introuvable ou erreur. Reessayez.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #f9e8d0 100%)' }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-brand-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Email envoye !
          </h2>
          <p className="text-gray-600 mb-2">
            Un lien de reinitialisation a ete envoye a <strong>{email}</strong>.
          </p>
          <p className="text-gray-500 text-sm">Cliquez rapidement sur le lien — il expire dans 1 heure.</p>
          <Link href="/auth/login" className="btn-primary inline-block mt-6">Retour connexion</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #f9e8d0 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>
            Mot de passe oublie
          </h1>
          <p className="text-gray-500 text-sm mt-1">Entrez votre email pour recevoir un lien.</p>
        </div>
        <div className="card">
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}
            <div>
              <label className="label">Adresse email</label>
              <input type="email" className="input" placeholder="votre@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">Retour a la connexion</Link>
        </p>
      </div>
    </main>
  )
}
