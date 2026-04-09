'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function NouveauProjetPage() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [objectif, setObjectif] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom du projet est obligatoire.'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('projets').insert({
      user_id: user!.id,
      nom: nom.trim(),
      description: description.trim() || null,
      objectif_montant: objectif ? parseFloat(objectif) : 0,
    })
    if (error) {
      setError('Erreur lors de la creation. Reessayez.')
      setLoading(false)
    } else {
      router.push('/projets')
      router.refresh()
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/projets" className="text-brand-600 text-sm hover:underline">← Retour</Link>
        <h1 className="text-2xl font-bold text-brand-800 mt-2" style={{ fontFamily: "Georgia, serif" }}>
          Nouveau projet
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          <div>
            <label className="label">Nom du projet *</label>
            <input type="text" className="input" placeholder="Ex: Construction maison, Achat voiture..."
              value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Decrivez votre projet..."
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Objectif financier (optionnel)</label>
            <input type="number" className="input" placeholder="Montant cible"
              value={objectif} onChange={(e) => setObjectif(e.target.value)} min="0" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creation...' : 'Creer le projet'}
          </button>
        </form>
      </div>
    </div>
  )
}
