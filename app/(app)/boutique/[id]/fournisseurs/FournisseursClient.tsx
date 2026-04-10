'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function FournisseursClient({ boutique, fournisseurs, produits, reappros }: {
  boutique: any, fournisseurs: any[], produits: any[], reappros: any[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState('fournisseurs')
  const [showForm, setShowForm] = useState(false)
  const [showReappro, setShowReappro] = useState(false)
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [loading, setLoading] = useState(false)
  const [fournisseurId, setFournisseurId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [montantPaye, setMontantPaye] = useState('')
  const [items, setItems] = useState([{ produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
  const [selectedF, setSelectedF] = useState<any>(null)
  const [paiementF, setPaiementF] = useState('')

  const totalDettes = fournisseurs.reduce((s, f) => s + (f.dette || 0), 0)
  const totalReappro = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0)

  function addItem() {
    setItems([...items, { produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
  }

  function updateItem(idx: number, field: string, value: any) {
    const newItems = [...items]
    if (field === 'produit_id') {
      const p = produits.find(p => p.id === value)
      newItems[idx] = { ...newItems[idx], produit_id: value, nom_produit: p ? p.nom : '', prix_unitaire: p ? p.prix_achat : 0 }
    } else {
      newItems[idx] = { ...newItems[idx], [field]: value }
    }
    setItems(newItems)
  }

  async function handleAddFournisseur(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('fournisseurs').insert({
      boutique_id: boutique.id, user_id: user!.id,
      nom: nom.trim(), telephone: telephone || null, adresse: adresse || null,
    })
    setNom(''); setTelephone(''); setAdresse(''); setShowForm(false); setLoading(false)
    router.refresh()
  }

  async function handleReappro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const montantPaye2 = parseFloat(montantPaye) || 0
    const dette = totalReappro - montantPaye2

    const { data: reappro } = await supabase.from('reappros').insert({
      boutique_id: boutique.id, user_id: user!.id,
      fournisseur_id: fournisseurId || null,
      montant_total: totalReappro, montant_paye: montantPaye2,
      note: note || null, date,
    }).select().single()

    if (reappro) {
      const validItems = items.filter(i => i.nom_produit)
      if (validItems.length > 0) {
        await supabase.from('reappro_items').insert(
          validItems.map(i => ({
            reappro_id: reappro.id,
            produit_id: i.produit_id || null,
            nom_produit: i.nom_produit,
            quantite: i.quantite,
            prix_unitaire: i.prix_unitaire,
          }))
        )
        for (const item of validItems.filter(i => i.produit_id)) {
          await supabase.rpc('increment_stock', { p_id: item.produit_id, qty: item.quantite })
        }
      }
      if (fournisseurId && dette > 0) {
        const f = fournisseurs.find(f => f.id === fournisseurId)
        if (f) await supabase.from('fournisseurs').update({ dette: (f.dette || 0) + dette }).eq('id', fournisseurId)
      }
    }
    setItems([{ produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
    setFournisseurId(''); setNote(''); setMontantPaye(''); setShowReappro(false); setLoading(false)
    router.refresh()
  }

  async function handlePaiementF(f: any) {
    if (!paiementF || parseFloat(paiementF) <= 0) return
    const supabase = createClient()
    const newDette = Math.max(0, f.dette - parseFloat(paiementF))
    await supabase.from('fournisseurs').update({ dette: newDette }).eq('id', f.id)
    setPaiementF(''); setSelectedF(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce fournisseur ?')) return
    const supabase = createClient()
    await supabase.from('fournisseurs').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>👨‍💼 Fournisseurs</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowReappro(!showReappro); setShowForm(false) }} className="btn-secondary px-3 py-2 text-sm">📦 Reappro</button>
          <button onClick={() => { setShowForm(!showForm); setShowReappro(false) }} className="btn-primary px-3 py-2 text-sm">+ Ajouter</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['fournisseurs', 'reappros'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"flex-1 py-2 rounded-xl text-sm font-medium " + (tab === t ? 'bg-brand-500 text-white' : 'bg-white border text-gray-600')}>
            {t === 'fournisseurs' ? '👨‍💼 Fournisseurs' : '📦 Reappros'}
          </button>
        ))}
      </div>

      {totalDettes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-orange-700 font-medium">💰 Total dettes : {totalDettes.toLocaleString()} {boutique.devise}</p>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Nouveau fournisseur</h3>
          <form onSubmit={handleAddFournisseur} className="space-y-3">
            <div>
              <label className="label">Nom *</label>
              <input type="text" className="input" placeholder="Nom du fournisseur" value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Telephone</label>
                <input type="tel" className="input" placeholder="+221..." value={telephone} onChange={e => setTelephone(e.target.value)} />
              </div>
              <div>
                <label className="label">Adresse</label>
                <input type="text" className="input" placeholder="Quartier..." value={adresse} onChange={e => setAdresse(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>Ajouter</button>
          </form>
        </div>
      )}

      {showReappro && (
        <div className="card mb-4 border-2 border-brand-200">
          <h3 className="font-semibold text-gray-700 mb-3">📦 Nouveau reapprovisionnement</h3>
          <form onSubmit={handleReappro} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fournisseur</label>
                <select className="input" value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}>
                  <option value="">Sans fournisseur</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Produits</label>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                  <select className="input" value={item.produit_id} onChange={e => updateItem(idx, 'produit_id', e.target.value)}>
                    <option value="">Produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                  <input type="number" className="input" placeholder="Qte" value={item.quantite}
                    onChange={e => updateItem(idx, 'quantite', parseInt(e.target.value) || 1)} min="1" />
                  <input type="number" className="input" placeholder="Prix" value={item.prix_unitaire}
                    onChange={e => updateItem(idx, 'prix_unitaire', parseFloat(e.target.value) || 0)} min="0" />
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-brand-600 text-sm hover:underline">+ Produit</button>
            </div>
            {totalReappro > 0 && (
              <div className="bg-brand-50 rounded-xl px-4 py-2 text-center">
                <p className="font-bold text-brand-700">Total : {totalReappro.toLocaleString()} {boutique.devise}</p>
              </div>
            )}
            <div>
              <label className="label">Montant paye</label>
              <input type="number" className="input" placeholder="0" value={montantPaye} onChange={e => setMontantPaye(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Valider'}
            </button>
          </form>
        </div>
      )}

      {selectedF && (
        <div className="card mb-4 border-2 border-orange-200">
          <h3 className="font-semibold text-gray-700 mb-2">💳 Paiement — {selectedF.nom}</h3>
          <p className="text-sm text-orange-600 mb-2">Dette : {selectedF.dette.toLocaleString()} {boutique.devise}</p>
          <div className="flex gap-2">
            <input type="number" className="input flex-1" placeholder="Montant" value={paiementF} onChange={e => setPaiementF(e.target.value)} />
            <button onClick={() => handlePaiementF(selectedF)} className="btn-primary px-4">Valider</button>
            <button onClick={() => setSelectedF(null)} className="btn-secondary px-4">Annuler</button>
          </div>
        </div>
      )}

      {tab === 'fournisseurs' && (
        <div className="space-y-2">
          {fournisseurs.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">👨‍💼</div>
              <p>Aucun fournisseur</p>
            </div>
          ) : fournisseurs.map((f: any) => (
            <div key={f.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{f.nom}</h3>
                    {f.dette > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Dette: {f.dette.toLocaleString()}</span>}
                  </div>
                  {f.telephone && <p className="text-sm text-gray-400">📞 {f.telephone}</p>}
                  {f.adresse && <p className="text-sm text-gray-400">📍 {f.adresse}</p>}
                </div>
                <div className="flex gap-2">
                  {f.dette > 0 && <button onClick={() => setSelectedF(f)} className="btn-secondary px-3 py-1 text-xs">💳 Payer</button>}
                  <button onClick={() => handleDelete(f.id)} className="text-gray-300 hover:text-red-500 text-xl">×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reappros' && (
        <div className="space-y-2">
          {reappros.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">Aucun reappro</div>
          ) : reappros.map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{r.montant_total.toLocaleString()} {boutique.devise}</p>
                  <p className="text-xs text-gray-400">{r.date} {r.fournisseurs?.nom ? "— " + r.fournisseurs.nom : ""}</p>
                  {r.note && <p className="text-xs text-gray-500">{r.note}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Paye: {r.montant_paye.toLocaleString()}</p>
                  {r.montant_total - r.montant_paye > 0 && (
                    <p className="text-xs text-red-500">Reste: {(r.montant_total - r.montant_paye).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
