'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Transaction {
  id: string
  type: string
  montant: number
  description: string
  date: string
}

interface Projet {
  id: string
  nom: string
  description: string
  objectif_montant: number
  statut: string
}

export default function ProjetDetailClient({ projet, transactions, devise }: {
  projet: Projet
  transactions: Transaction[]
  devise: string
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('entree')
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const totalEntrees = transactions.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0)
  const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0)
  const solde = totalEntrees - totalDepenses
  const progression = projet.objectif_montant > 0 ? Math.min((totalEntrees / projet.objectif_montant) * 100, 100) : 0

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault()
    if (!montant || parseFloat(montant) <= 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('projet_transactions').insert({
      projet_id: projet.id,
      user_id: user!.id,
      type,
      montant: parseFloat(montant),
      description: description.trim() || null,
      date,
    })
    setMontant('')
    setDescription('')
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('projet_transactions').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/projets" className="text-brand-600 text-sm hover:underline">← Mes projets</Link>
      </div>

      <div className="card mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>
              {projet.nom}
            </h1>
            {projet.description && <p className="text-gray-500 text-sm mt-1">{projet.description}</p>}
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            projet.statut === 'termine' ? 'bg-green-100 text-green-700' :
            projet.statut === 'pause' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {projet.statut === 'termine' ? 'Termine' : projet.statut === 'pause' ? 'En pause' : 'En cours'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Entrees</p>
            <p className="font-bold text-green-700 text-sm">{totalEntrees.toLocaleString()} {devise}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Depenses</p>
            <p className="font-bold text-red-600 text-sm">{totalDepenses.toLocaleString()} {devise}</p>
          </div>
          <div className="bg-brand-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Solde</p>
            <p className={`font-bold text-sm ${solde >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
              {solde.toLocaleString()} {devise}
            </p>
          </div>
        </div>

        {projet.objectif_montant > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression vers objectif</span>
              <span>{Math.round(progression)}% — {projet.objectif_montant.toLocaleString()} {devise}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: progression + "%" }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">Transactions</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleAddTransaction} className="space-y-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('entree')}
                className={"flex-1 py-2 rounded-xl text-sm font-medium border transition " + (type === 'entree' ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-600')}>
                💰 Entree
              </button>
              <button type="button" onClick={() => setType('depense')}
                className={"flex-1 py-2 rounded-xl text-sm font-medium border transition " + (type === 'depense' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600')}>
                💸 Depense
              </button>
            </div>
            <input type="number" className="input" placeholder="Montant" value={montant}
              onChange={(e) => setMontant(e.target.value)} required min="1" />
            <input type="text" className="input" placeholder="Description" value={description}
              onChange={(e) => setDescription(e.target.value)} />
            <input type="date" className="input" value={date}
              onChange={(e) => setDate(e.target.value)} />
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <p>Aucune transaction pour ce projet</p>
          </div>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="card flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{t.type === 'entree' ? '💰' : '💸'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t.description || (t.type === 'entree' ? 'Entree' : 'Depense')}</p>
                  <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={"font-semibold text-sm " + (t.type === 'entree' ? 'text-green-600' : 'text-red-600')}>
                  {t.type === 'entree' ? '+' : '-'}{t.montant.toLocaleString()} {devise}
                </span>
                <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500 transition text-lg">
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
