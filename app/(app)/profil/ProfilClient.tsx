'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  userId: string
  email: string
  fullName: string
  devise: string
}

export default function ProfilClient({ userId, email, fullName, devise }: Props) {
  const [name, setName] = useState(fullName)
  const [selectedDevise, setSelectedDevise] = useState(devise)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ full_name: name, devise: selectedDevise }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSendRecap() {
    setSendingEmail(true)
    try {
      const res = await fetch('/api/recap-email', { method: 'POST' })
      if (res.ok) setEmailSent(true)
    } catch {}
    setSendingEmail(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>Mon profil</h2>
        <p className="text-sm text-gray-500">Gérez vos informations et préférences</p>
      </div>

      {/* Infos compte */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">👤 Informations</h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input type="text" className="input" value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} disabled
              style={{ background: '#f9fafb', color: '#6b7280' }} />
          </div>
          <div>
            <label className="label">Devise</label>
            <select className="input" value={selectedDevise}
              onChange={(e) => setSelectedDevise(e.target.value)}>
              <option value="FCFA">FCFA (Franc CFA)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar US)</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saved ? '✅ Enregistré !' : saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      {/* Récap email */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-2">📧 Récapitulatif mensuel</h3>
        <p className="text-sm text-gray-500 mb-4">
          Recevez un résumé de vos dépenses et revenus du mois par email.
        </p>
        <button onClick={handleSendRecap} className="btn-secondary w-full" disabled={sendingEmail || emailSent}>
          {emailSent ? '✅ Email envoyé !' : sendingEmail ? 'Envoi en cours...' : '📬 Envoyer le récap maintenant'}
        </button>
      </div>

      {/* Infos app */}
      <div className="card text-center text-xs text-gray-400 space-y-1">
        <p>🇸🇳 Suivi Dépenses Familiales</p>
        <p>Conçu pour les familles sénégalaises</p>
        <p className="text-brand-400">v1.0.0</p>
      </div>
    </div>
  )
}
