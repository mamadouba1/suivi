'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #f9e8d0 100%)' }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-brand-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Vérifiez votre email !
          </h2>
          <p className="text-gray-600 mb-2">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>.
          </p>
          <p className="text-gray-500 text-sm">
            Cliquez sur le lien dans l&apos;email pour activer votre compte, puis connectez-vous.
          </p>
          <Link href="/auth/login" className="btn-primary inline-block mt-6">
            Aller à la connexion
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #f9e8d0 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🇸🇳</div>
          <h1 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>
            Créer mon compte
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos dépenses familiales facilement</p>
        </div>

        <div className="card">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="label">Nom complet</label>
              <input
                type="text"
                className="input"
                placeholder="Mamadou Diallo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                className="input"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                className="input"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
