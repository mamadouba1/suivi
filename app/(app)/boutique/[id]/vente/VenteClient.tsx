'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Produit {
  id: string
  nom: string
  prix_vente: number
  stock: number
  code_barre: string
  unite: string
}

interface CartItem {
  produit_id: string
  nom: string
  prix_unitaire: number
  quantite: number
  sous_total: number
}

export default function VenteClient({ boutique, produits, clients, ventes }: {
  boutique: any
  produits: Produit[]
  clients: any[]
  ventes: any[]
}) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [clientId, setClientId] = useState('')
  const [modePaiement, setModePaiement] = useState('especes')
  const [montantPaye, setMontantPaye] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [rendu, setRendu] = useState(0)
  const [tab, setTab] = useState('vente')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)

  const total = cart.reduce((s, i) => s + i.sous_total, 0)
  const paye = parseFloat(montantPaye) || 0
  const monnaieRendue = paye - total

  function addToCart(produit: Produit) {
    const existing = cart.find(i => i.produit_id === produit.id)
    if (existing) {
      setCart(cart.map(i => i.produit_id === produit.id
        ? { ...i, quantite: i.quantite + 1, sous_total: (i.quantite + 1) * i.prix_unitaire }
        : i
      ))
    } else {
      setCart([...cart, {
        produit_id: produit.id,
        nom: produit.nom,
        prix_unitaire: produit.prix_vente,
        quantite: 1,
        sous_total: produit.prix_vente,
      }])
    }
    setSearch('')
  }

  function removeFromCart(id: string) {
    setCart(cart.filter(i => i.produit_id !== id))
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(cart.map(i => i.produit_id === id
      ? { ...i, quantite: qty, sous_total: qty * i.prix_unitaire }
      : i
    ))
  }

  async function startScanner() {
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      alert('Camera non disponible')
      setScanning(false)
    }
  }

  function stopScanner() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(t => t.stop())
    }
    setScanning(false)
  }

  async function handleVente() {
    if (cart.length === 0) return
    if (!montantPaye) { alert('Entrez le montant recu'); return }
    if (modePaiement === 'especes' && paye < total) { alert('Montant insuffisant'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const statut = modePaiement === 'credit' ? 'credit' : paye >= total ? 'payee' : 'partiel'

    const { data: vente, error } = await supabase.from('ventes').insert({
      boutique_id: boutique.id,
      user_id: user!.id,
      client_id: clientId || null,
      montant_total: total,
      montant_paye: paye,
      montant_rendu: Math.max(0, monnaieRendue),
      mode_paiement: modePaiement,
      statut,
    }).select().single()

    if (error || !vente) { alert('Erreur vente'); setLoading(false); return }

    await supabase.from('vente_items').insert(
      cart.map(i => ({
        vente_id: vente.id,
        produit_id: i.produit_id,
        nom_produit: i.nom,
        prix_unitaire: i.prix_unitaire,
        quantite: i.quantite,
        sous_total: i.sous_total,
      }))
    )

    for (const item of cart) {
      await supabase.rpc('decrement_stock', { p_id: item.produit_id, qty: item.quantite }).catch(() => {})
    }

    if (clientId && modePaiement === 'credit') {
      const client = clients.find(c => c.id === clientId)
      if (client) {
        await supabase.from('clients').update({ dette: (client.dette || 0) + total }).eq('id', clientId)
      }
    }

    setRendu(Math.max(0, monnaieRendue))
    setSuccess(true)
    setCart([])
    setMontantPaye('')
    setClientId('')
    setLoading(false)
    router.refresh()
  }

  const filteredProduits = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    (p.code_barre && p.code_barre.includes(search))
  )

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <div className="card py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-brand-800 mb-2">Vente enregistree !</h2>
          {rendu > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 mb-4 inline-block">
              <p className="text-green-700 font-bold text-xl">Monnaie a rendre : {rendu.toLocaleString()} {boutique.devise}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => setSuccess(false)} className="btn-primary px-6">Nouvelle vente</button>
            <Link href={"/boutique/" + boutique.id} className="btn-secondary px-6">Tableau de bord</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('vente')} className={"flex-1 py-2 rounded-xl text-sm font-medium " + (tab === 'vente' ? 'bg-brand-500 text-white' : 'bg-white border text-gray-600')}>
          🛒 Vente
        </button>
        <button onClick={() => setTab('historique')} className={"flex-1 py-2 rounded-xl text-sm font-medium " + (tab === 'historique' ? 'bg-brand-500 text-white' : 'bg-white border text-gray-600')}>
          📋 Historique
        </button>
      </div>

      {tab === 'vente' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex gap-2 mb-3">
              <input type="text" className="input flex-1" placeholder="🔍 Rechercher produit ou code barre..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <button onClick={scanning ? stopScanner : startScanner} className="btn-secondary px-3 text-sm">
                {scanning ? '⏹' : '📷'}
              </button>
            </div>
            {scanning && (
              <div className="mb-3 rounded-xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" style={{ maxHeight: '150px', objectFit: 'cover' }} />
              </div>
            )}
            {search && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredProduits.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-brand-50 transition text-left">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{p.nom}</p>
                      <p className="text-xs text-gray-400">Stock: {p.stock} {p.unite}</p>
                    </div>
                    <span className="text-brand-600 font-bold text-sm">{p.prix_vente.toLocaleString()} {boutique.devise}</span>
                  </button>
                ))}
                {filteredProduits.length === 0 && <p className="text-gray-400 text-sm text-center py-2">Aucun produit trouve</p>}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">🛒 Panier</h3>
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.produit_id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{item.nom}</p>
                      <p className="text-xs text-gray-400">{item.prix_unitaire.toLocaleString()} x {item.quantite}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.produit_id, item.quantite - 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold">-</button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantite}</span>
                      <button onClick={() => updateQty(item.produit_id, item.quantite + 1)} className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 font-bold">+</button>
                      <span className="text-sm font-bold text-brand-600 w-20 text-right">{item.sous_total.toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.produit_id)} className="text-gray-300 hover:text-red-500 text-lg">×</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-brand-50 rounded-xl px-4 py-3 mb-4">
                <div className="flex justify-between font-bold text-brand-800">
                  <span>TOTAL</span>
                  <span>{total.toLocaleString()} {boutique.devise}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="label">Mode de paiement</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[['especes','💵 Especes'],['wave','💙 Wave'],['orange_money','🟠 Orange'],['free_money','🟣 Free'],['credit','📝 Credit']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setModePaiement(val)}
                        className={"py-2 rounded-xl text-xs font-medium border transition " + (modePaiement === val ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 bg-white')}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {clients.length > 0 && (
                  <div>
                    <label className="label">Client (optionnel)</label>
                    <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
                      <option value="">Client anonyme</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.dette > 0 ? "(dette: " + c.dette.toLocaleString() + ")" : ""}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Montant recu</label>
                  <input type="number" className="input text-xl font-bold" placeholder={"Ex: " + total}
                    value={montantPaye} onChange={e => setMontantPaye(e.target.value)} />
                </div>

                {paye >= total && paye > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                    <p className="text-green-700 font-bold">Monnaie a rendre : {Math.max(0, monnaieRendue).toLocaleString()} {boutique.devise}</p>
                  </div>
                )}

                <button onClick={handleVente} className="btn-primary w-full py-4 text-lg" disabled={loading || cart.length === 0}>
                  {loading ? 'Enregistrement...' : 'Valider la vente — ' + total.toLocaleString() + ' ' + boutique.devise}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'historique' && (
        <div className="space-y-2">
          {ventes.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">Aucune vente enregistree</div>
          ) : (
            ventes.map((v: any) => (
              <div key={v.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{v.montant_total.toLocaleString()} {boutique.devise}</p>
                    <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleString('fr-FR')}</p>
                    <span className={"text-xs px-2 py-0.5 rounded-full " + (v.statut === 'payee' ? 'bg-green-100 text-green-700' : v.statut === 'credit' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                      {v.statut === 'payee' ? '✅ Payee' : v.statut === 'credit' ? '📝 Credit' : '⚠️ Partiel'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{v.mode_paiement}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
