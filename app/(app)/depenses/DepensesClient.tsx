'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CATEGORIES_DEPENSES, formatMontant, formatMois, getMoisActuel } from '@/lib/utils'

interface Depense {
  id: string
  date: string
  type: string
  libelle: string
  montant_prev: number
  montant_depense: number
  personne: string
}

interface Props {
  depensesInitiales: Depense[]
  mois: string
  devise: string
  userId: string
}

export default function DepensesClient({ depensesInitiales, mois, devise, userId }: Props) {
  const [depenses, setDepenses] = useState<Depense[]>(depensesInitiales)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '',
    libelle: '',
    montant_prev: '',
    montant_depense: '',
    personne: '',
  })

  const total = depenses.reduce((s, d) => s + (d.montant_depense || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.from('depenses').insert({
      user_id: userId,
      date: form.date,
      mois: getMoisActuel(),
      type: form.type,
      libelle: form.libelle,
      montant_prev: parseFloat(form.montant_prev) || 0,
      montant_depense: parseFloat(form.montant_depense) || 0,
      personne: form.personne,
    }).select().single()

    if (!error && data) {
      setDepenses([data as Depense, ...depenses])
      setForm({ date: new Date().toISOString().split('T')[0], type: '', libelle: '', montant_prev: '', montant_depense: '', personne: '' })
      setShowForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    const supabase = createClient()
    await supabase.from('depenses').delete().eq('id', id)
    setDepenses(depenses.filter((d) => d.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>Dépenses</h2>
          <p className="text-sm text-gray-500">{formatMois(mois)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Annuler' : '+ Ajouter'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card border-2 border-brand-200">
          <h3 className="font-semibold text-brand-800 mb-4">Nouvelle dépense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="label">Personne</label>
                <input type="text" className="input" placeholder="ex: Papa, Maman..."
                  value={form.personne} onChange={(e) => setForm({ ...form, personne: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                <option value="">Choisir une catégorie...</option>
                {CATEGORIES_DEPENSES.map((groupe) => (
                  <optgroup key={groupe.groupe} label={`${groupe.icone} ${groupe.groupe}`}>
                    {groupe.items.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Libellé / Description</label>
              <input type="text" className="input" placeholder="ex: Marché Sandaga, Facture SENELEC..."
                value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Montant prévu ({devise})</label>
                <input type="number" className="input" placeholder="0" min="0"
                  value={form.montant_prev} onChange={(e) => setForm({ ...form, montant_prev: e.target.value })} />
              </div>
              <div>
                <label className="label">Montant dépensé ({devise})</label>
                <input type="number" className="input" placeholder="0" min="0"
                  value={form.montant_depense} onChange={(e) => setForm({ ...form, montant_depense: e.target.value })} required />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Enregistrement...' : '✅ Enregistrer la dépense'}
            </button>
          </form>
        </div>
      )}

      {/* Résumé */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-brand-700">Total dépenses du mois</span>
          <span className="text-xl font-bold text-brand-700">{formatMontant(total, devise)}</span>
        </div>
        <p className="text-xs text-brand-500 mt-1">{depenses.length} dépense(s) enregistrée(s)</p>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {depenses.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>Aucune dépense ce mois-ci</p>
          </div>
        ) : (
          depenses.map((d) => (
            <div key={d.id} className="card flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                    {d.type}
                  </span>
                  {d.personne && (
                    <span className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">{d.personne}</span>
                  )}
                </div>
                <p className="font-medium text-gray-800 mt-1">{d.libelle}</p>
                <p className="text-xs text-gray-400">{d.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-600">{formatMontant(d.montant_depense, devise)}</p>
                {d.montant_prev > 0 && d.montant_prev !== d.montant_depense && (
                  <p className="text-xs text-gray-400 line-through">{formatMontant(d.montant_prev, devise)}</p>
                )}
                <button onClick={() => handleDelete(d.id)}
                  className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
