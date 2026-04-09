'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function NouvelleBoutiquePage() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [adresse, setAdresse] = useState('')
  const [telephone, setTelephone] = useState('')
  const [devise, setDevise] = useState('FCFA')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom est obligatoire'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('boutiques').insert({
      user_id: user!.id,
      nom: nom.trim(),
      description: description.trim() || null,
      adresse: adresse.trim() || null,
      telephone: telephone.trim() || null,
      devise,
    })
    if (error) { setError('Erreur. Reessayez.'); setLoading(false) }
    else { router.push('/boutique'); router.refresh() }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/boutique" className="text-brand-600 text-sm hover:underline">← Retour</Link>
        <h1 className="text-2xl font-bold text-brand-800 mt-2" style={{ fontFamily: "Georgia, serif" }}>
          Nouvelle boutique
        </h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
          <div>
            <label className="label">Nom de la boutique *</label>
            <input type="text" className="input" placeholder="Ex: Boutique Aminata, Pharmacie..." value={nom} onChange={e => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} placeholder="Type de commerce..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Adresse</label>
            <input type="text" className="input" placeholder="Quartier, ville..." value={adresse} onChange={e => setAdresse(e.target.value)} />
          </div>
          <div>
            <label className="label">Telephone</label>
            <input type="tel" className="input" placeholder="+221 77 000 00 00" value={telephone} onChange={e => setTelephone(e.target.value)} />
          </div>
          <div>
            <label className="label">Devise</label>
            <select className="input" value={devise} onChange={e => setDevise(e.target.value)}>
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creation...' : 'Creer la boutique'}
          </button>
        </form>
      </div>
    </div>
  )
}
