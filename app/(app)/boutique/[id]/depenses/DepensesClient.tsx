'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function DepensesClient({ boutique, depenses }: { boutique: any, depenses: any[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState('')
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('autre')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const categories = ['loyer','electricite','eau','telephone','transport','reappro','salaire','autre']
  const total = depenses.reduce((s, d) => s + d.montant, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !montant) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('depenses_boutique').insert({
      boutique_id: boutique.id,
      user_id: user!.id,
      description: description.trim(),
      montant: parseFloat(montant),
      categorie,
      date,
    })
    setDescription(''); setMontant(''); setShowForm(false); setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('depenses_boutique').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>💸 Depenses boutique</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      <div className="card mb-4 text-center">
        <p className="text-sm text-gray-500">Total depenses</p>
        <p className="text-2xl font-bold text-red-600">{total.toLocaleString()} {boutique.devise}</p>
      </div>

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Description *</label>
              <input type="text" className="input" placeholder="Ex: Loyer, Electricite..." value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <label className="label">Montant *</label>
              <input type="number" className="input" placeholder="0" value={montant} onChange={e => setMontant(e.target.value)} required min="1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Categorie</label>
                <select className="input" value={categorie} onChange={e => setCategorie(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {depenses.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">💸</div>
            <p>Aucune depense enregistree</p>
          </div>
        ) : (
          depenses.map((d: any) => (
            <div key={d.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{d.description}</p>
                <p className="text-xs text-gray-400">{d.categorie} — {new Date(d.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-600">{d.montant.toLocaleString()} {boutique.devise}</span>
                <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-red-500 text-xl">×</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
