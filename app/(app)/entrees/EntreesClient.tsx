'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatMontant, formatMois, getMoisActuel } from '@/lib/utils'

interface Entree {
  id: string
  date: string
  personne: string
  montant: number
}

interface Props {
  entreesInitiales: Entree[]
  mois: string
  devise: string
  userId: string
}

export default function EntreesClient({ entreesInitiales, mois, devise, userId }: Props) {
  const [entrees, setEntrees] = useState<Entree[]>(entreesInitiales)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    personne: '',
    montant: '',
  })

  const total = entrees.reduce((s, e) => s + (e.montant || 0), 0)

  function startEdit(e: Entree) {
    setEditingId(e.id)
    setForm({
      date: e.date,
      personne: e.personne,
      montant: e.montant?.toString() || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ date: new Date().toISOString().split('T')[0], personne: '', montant: '' })
    setShowForm(false)
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setLoading(true)
    const supabase = createClient()

    if (editingId) {
      const { data, error } = await supabase.from('entrees').update({
        date: form.date,
        personne: form.personne,
        montant: parseFloat(form.montant) || 0,
      }).eq('id', editingId).select().single()

      if (!error && data) {
        setEntrees(entrees.map(e => e.id === editingId ? data as Entree : e))
        cancelEdit()
      }
    } else {
      const { data, error } = await supabase.from('entrees').insert({
        user_id: userId,
        date: form.date,
        mois: getMoisActuel(),
        personne: form.personne,
        montant: parseFloat(form.montant) || 0,
      }).select().single()

      if (!error && data) {
        setEntrees([data as Entree, ...entrees])
        cancelEdit()
      }
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette entree ?')) return
    const supabase = createClient()
    await supabase.from('entrees').delete().eq('id', id)
    setEntrees(entrees.filter((e) => e.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>Revenus / Entrees</h2>
          <p className="text-sm text-gray-500">{formatMois(mois)}</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowForm(!showForm) }} className="btn-primary">
          {showForm && !editingId ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <div className="card border-2 border-brand-200">
          <h3 className="font-semibold text-brand-800 mb-4">{editingId ? 'Modifier le revenu' : 'Nouveau revenu'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="label">Personne / Source</label>
                <input type="text" className="input" placeholder="Papa, Salaire, Client..."
                  value={form.personne} onChange={(e) => setForm({ ...form, personne: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Montant ({devise})</label>
              <input type="number" className="input" placeholder="0" min="0"
                value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Enregistrement...' : editingId ? 'Modifier' : 'Enregistrer'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="btn-secondary px-6">Annuler</button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card bg-brand-50 border-brand-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-brand-700">Total revenus du mois</span>
          <span className="text-xl font-bold text-brand-700">{formatMontant(total, devise)}</span>
        </div>
        <p className="text-xs text-brand-500 mt-1">{entrees.length} entree(s)</p>
      </div>

      <div className="space-y-2">
        {entrees.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">💰</p>
            <p>Aucun revenu ce mois-ci</p>
          </div>
        ) : (
          entrees.map((e) => (
            <div key={e.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{e.personne}</p>
                <p className="text-xs text-gray-400">{e.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-brand-600 text-lg">{formatMontant(e.montant, devise)}</span>
                <button onClick={() => startEdit(e)} className="text-xs text-brand-500 hover:text-brand-700 transition-colors">
                  ✏️
                </button>
                <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
