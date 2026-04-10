'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function NouvelleFamillePage() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom est obligatoire'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: famille, error: err } = await supabase.from('familles').insert({
      nom: nom.trim(),
      description: description.trim() || null,
      created_by: user!.id,
    }).select().single()

    if (err || !famille) { setError('Erreur. Reessayez.'); setLoading(false); return }

    await supabase.from('famille_membres').insert({
      famille_id: famille.id,
      user_id: user!.id,
      role: 'admin',
    })

    router.push('/famille/' + famille.id)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/famille" className="text-brand-600 text-sm hover:underline">← Retour</Link>
        <h1 className="text-2xl font-bold text-brand-800 mt-2" style={{ fontFamily: "Georgia, serif" }}>
          Nouvelle famille
        </h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
          <div>
            <label className="label">Nom de la famille *</label>
            <input type="text" className="input" placeholder="Ex: Famille Diallo, Famille BA..."
              value={nom} onChange={e => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} placeholder="Description optionnelle..."
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Création...' : 'Créer la famille'}
          </button>
        </form>
      </div>
    </div>
  )
}
