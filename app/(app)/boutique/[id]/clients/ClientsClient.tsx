'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ClientsClient({ boutique, clients }: { boutique: any, clients: any[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [paiement, setPaiement] = useState('')

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('clients').insert({
      boutique_id: boutique.id,
      user_id: user!.id,
      nom: nom.trim(),
      telephone: telephone.trim() || null,
    })
    setNom(''); setTelephone(''); setShowForm(false); setLoading(false)
    router.refresh()
  }

  async function handlePaiement(client: any) {
    if (!paiement || parseFloat(paiement) <= 0) return
    const supabase = createClient()
    const newDette = Math.max(0, client.dette - parseFloat(paiement))
    await supabase.from('clients').update({ dette: newDette }).eq('id', client.id)
    setPaiement(''); setSelectedClient(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce client ?')) return
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', id)
    router.refresh()
  }

  const totalDettes = clients.reduce((s, c) => s + (c.dette || 0), 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>👥 Clients</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {totalDettes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-orange-700 font-medium">💰 Total dettes clients : {totalDettes.toLocaleString()} {boutique.devise}</p>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleAddClient} className="space-y-3">
            <div>
              <label className="label">Nom du client *</label>
              <input type="text" className="input" placeholder="Nom complet" value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
            <div>
              <label className="label">Telephone</label>
              <input type="tel" className="input" placeholder="+221 77 000 00 00" value={telephone} onChange={e => setTelephone(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter le client'}
            </button>
          </form>
        </div>
      )}

      {selectedClient && (
        <div className="card mb-4 border-2 border-brand-200">
          <h3 className="font-semibold text-gray-700 mb-3">💳 Enregistrer paiement — {selectedClient.nom}</h3>
          <p className="text-sm text-orange-600 mb-3">Dette actuelle : {selectedClient.dette.toLocaleString()} {boutique.devise}</p>
          <div className="flex gap-2">
            <input type="number" className="input flex-1" placeholder="Montant paye" value={paiement} onChange={e => setPaiement(e.target.value)} />
            <button onClick={() => handlePaiement(selectedClient)} className="btn-primary px-4">Valider</button>
            <button onClick={() => setSelectedClient(null)} className="btn-secondary px-4">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {clients.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">👥</div>
            <p>Aucun client enregistre</p>
          </div>
        ) : (
          clients.map((c: any) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{c.nom}</h3>
                    {c.dette > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                        Dette: {c.dette.toLocaleString()} {boutique.devise}
                      </span>
                    )}
                  </div>
                  {c.telephone && <p className="text-sm text-gray-400">📞 {c.telephone}</p>}
                </div>
                <div className="flex gap-2">
                  {c.dette > 0 && (
                    <button onClick={() => setSelectedClient(c)} className="btn-secondary px-3 py-1 text-xs">
                      💳 Payer
                    </button>
                  )}
                  <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500 text-xl">×</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
