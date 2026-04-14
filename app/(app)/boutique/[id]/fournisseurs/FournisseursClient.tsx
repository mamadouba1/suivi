'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const MODES_PAIEMENT = [
  { val: 'especes', label: '💵 Espèces' },
  { val: 'wave', label: '💙 Wave' },
  { val: 'orange_money', label: '🟠 Orange Money' },
  { val: 'free_money', label: '🟣 Free Money' },
  { val: 'virement', label: '🏦 Virement' },
]

export default function FournisseursClient({ boutique, fournisseurs, produits, reappros }: {
  boutique: any, fournisseurs: any[], produits: any[], reappros: any[]
}) {
  const router = useRouter()
  const devise = boutique.devise || 'FCFA'
  const [tab, setTab] = useState('fournisseurs')
  const [loading, setLoading] = useState(false)

  // Formulaires visibilité
  const [showForm, setShowForm] = useState(false)
  const [showReappro, setShowReappro] = useState(false)
  const [showRetourF, setShowRetourF] = useState(false)
  const [showPaiement, setShowPaiement] = useState(false)

  // Fournisseur sélectionné
  const [selectedF, setSelectedF] = useState<any>(null)

  // Nouveau fournisseur
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [email, setEmail] = useState('')

  // Réappro (réception livraison)
  const [reapproFournisseurId, setReapproFournisseurId] = useState('')
  const [reapproDate, setReapproDate] = useState(new Date().toISOString().split('T')[0])
  const [reapproNote, setReapproNote] = useState('')
  const [reapproMontantPaye, setReapproMontantPaye] = useState('')
  const [reapproModePaiement, setReapproModePaiement] = useState('especes')
  const [reapproItems, setReapproItems] = useState([{ produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
  const totalReappro = reapproItems.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0)

  // Retour fournisseur
  const [retourFId, setRetourFId] = useState('')
  const [retourFMotif, setRetourFMotif] = useState('')
  const [retourFItems, setRetourFItems] = useState([{ produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
  const totalRetourF = retourFItems.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0)

  // Paiement fournisseur
  const [paiementMontant, setPaiementMontant] = useState('')
  const [paiementMode, setPaiementMode] = useState('especes')
  const [paiementNote, setPaiementNote] = useState('')

  const totalDettes = fournisseurs.reduce((s, f) => s + (f.dette || 0), 0)

  // --- Helpers items ---
  function addItem(setter: any) {
    setter((prev: any[]) => [...prev, { produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
  }

  function removeItem(setter: any, idx: number) {
    setter((prev: any[]) => prev.filter((_: any, i: number) => i !== idx))
  }

  function updateItem(setter: any, idx: number, field: string, value: any) {
    setter((prev: any[]) => prev.map((it, i) => {
      if (i !== idx) return it
      if (field === 'produit_id') {
        const p = produits.find(p => p.id === value)
        return { ...it, produit_id: value, nom_produit: p ? p.nom : '', prix_unitaire: p ? (p.prix_achat || 0) : 0 }
      }
      return { ...it, [field]: value }
    }))
  }

  // --- Handlers ---
  async function handleAddFournisseur(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('fournisseurs').insert({
      boutique_id: boutique.id, user_id: user!.id,
      nom: nom.trim(), telephone: telephone || null,
      adresse: adresse || null, email: email || null,
    })
    setNom(''); setTelephone(''); setAdresse(''); setEmail('')
    setShowForm(false); setLoading(false)
    router.refresh()
  }

  async function handleReappro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const montantPaye2 = parseFloat(reapproMontantPaye) || 0
    const dette = totalReappro - montantPaye2

    const { data: reappro } = await supabase.from('reappros').insert({
      boutique_id: boutique.id, user_id: user!.id,
      fournisseur_id: reapproFournisseurId || null,
      montant_total: totalReappro, montant_paye: montantPaye2,
      note: reapproNote || null, date: reapproDate,
    }).select().single()

    if (reappro) {
      const validItems = reapproItems.filter(i => i.nom_produit)
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
      if (reapproFournisseurId && dette > 0) {
        const f = fournisseurs.find(f => f.id === reapproFournisseurId)
        if (f) await supabase.from('fournisseurs').update({ dette: (f.dette || 0) + dette }).eq('id', reapproFournisseurId)
      }
      // Enregistrer paiement si montant payé
      if (montantPaye2 > 0 && reapproFournisseurId) {
        const { data: { user: u } } = await supabase.auth.getUser()
        await supabase.from('paiements_fournisseur').insert({
          boutique_id: boutique.id, user_id: u!.id,
          fournisseur_id: reapproFournisseurId,
          montant: montantPaye2, mode_paiement: reapproModePaiement,
          note: 'Paiement lors réappro',
        })
      }
    }
    setReapproItems([{ produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
    setReapproFournisseurId(''); setReapproNote(''); setReapproMontantPaye('')
    setShowReappro(false); setLoading(false)
    router.refresh()
  }

  async function handleRetourFournisseur(e: React.FormEvent) {
    e.preventDefault()
    if (!retourFId) { alert('Sélectionnez un fournisseur'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const validItems = retourFItems.filter(i => i.nom_produit)

    const { data: retour } = await supabase.from('retours_fournisseur').insert({
      boutique_id: boutique.id, user_id: user!.id,
      fournisseur_id: retourFId,
      motif: retourFMotif || null,
      montant_total: totalRetourF,
    }).select().single()

    if (retour) {
      if (validItems.length > 0) {
        await supabase.from('retour_fournisseur_items').insert(
          validItems.map(i => ({
            retour_fournisseur_id: retour.id,
            produit_id: i.produit_id || null,
            nom_produit: i.nom_produit,
            quantite: i.quantite,
            prix_unitaire: i.prix_unitaire,
            sous_total: i.quantite * i.prix_unitaire,
          }))
        )
        // Décrémenter stock
        for (const item of validItems.filter(i => i.produit_id)) {
          await supabase.rpc('decrement_stock', { p_id: item.produit_id, qty: item.quantite })
        }
      }
      // Réduire la dette fournisseur si retour compense
      if (totalRetourF > 0) {
        const f = fournisseurs.find(f => f.id === retourFId)
        if (f && f.dette > 0) {
          const nouvelleDette = Math.max(0, f.dette - totalRetourF)
          await supabase.from('fournisseurs').update({ dette: nouvelleDette }).eq('id', retourFId)
        }
      }
    }
    setRetourFItems([{ produit_id: '', nom_produit: '', quantite: 1, prix_unitaire: 0 }])
    setRetourFId(''); setRetourFMotif('')
    setShowRetourF(false); setLoading(false)
    router.refresh()
  }

  async function handlePaiementFournisseur() {
    if (!selectedF || !paiementMontant || parseFloat(paiementMontant) <= 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const montant = parseFloat(paiementMontant)
    const nouvelleDette = Math.max(0, selectedF.dette - montant)

    await supabase.from('fournisseurs').update({ dette: nouvelleDette }).eq('id', selectedF.id)
    await supabase.from('paiements_fournisseur').insert({
      boutique_id: boutique.id, user_id: user!.id,
      fournisseur_id: selectedF.id,
      montant, mode_paiement: paiementMode,
      note: paiementNote || null,
    })
    setPaiementMontant(''); setPaiementNote(''); setPaiementMode('especes')
    setSelectedF(null); setShowPaiement(false); setLoading(false)
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
        <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>👨‍💼 Fournisseurs</h1>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => { setShowReappro(!showReappro); setShowRetourF(false); setShowForm(false) }}
            className="btn-secondary px-3 py-2 text-xs">📦 Réappro</button>
          <button onClick={() => { setShowRetourF(!showRetourF); setShowReappro(false); setShowForm(false) }}
            className="btn-secondary px-3 py-2 text-xs">↩️ Retour</button>
          <button onClick={() => { setShowForm(!showForm); setShowReappro(false); setShowRetourF(false) }}
            className="btn-primary px-3 py-2 text-xs">+ Fournisseur</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'fournisseurs', label: '👨‍💼 Fournisseurs' },
          { key: 'reappros', label: '📦 Réappros' },
          { key: 'retours', label: '↩️ Retours' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"flex-1 py-2 rounded-xl text-xs font-medium whitespace-nowrap " +
              (tab === t.key ? 'bg-brand-500 text-white' : 'bg-white border text-gray-600')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Total dettes */}
      {totalDettes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-orange-700 font-medium">💰 Total dettes fournisseurs : {totalDettes.toLocaleString()} {devise}</p>
        </div>
      )}

      {/* === FORMULAIRE NOUVEAU FOURNISSEUR === */}
      {showForm && (
        <div className="card mb-4 border-2 border-brand-200">
          <h3 className="font-semibold text-gray-700 mb-3">Nouveau fournisseur</h3>
          <form onSubmit={handleAddFournisseur} className="space-y-3">
            <div>
              <label className="label">Nom *</label>
              <input type="text" className="input" placeholder="Nom du fournisseur" value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Téléphone</label>
                <input type="tel" className="input" placeholder="+224..." value={telephone} onChange={e => setTelephone(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="email@..." value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Adresse</label>
              <input type="text" className="input" placeholder="Quartier, ville..." value={adresse} onChange={e => setAdresse(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>Ajouter</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* === FORMULAIRE RÉAPPRO === */}
      {showReappro && (
        <div className="card mb-4 border-2 border-green-200">
          <h3 className="font-semibold text-gray-700 mb-3">📦 Réception livraison</h3>
          <form onSubmit={handleReappro} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fournisseur</label>
                <select className="input" value={reapproFournisseurId} onChange={e => setReapproFournisseurId(e.target.value)}>
                  <option value="">Sans fournisseur</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={reapproDate} onChange={e => setReapproDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Produits reçus</label>
              {reapproItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2 items-center">
                  <select className="input col-span-2" value={item.produit_id} onChange={e => updateItem(setReapproItems, idx, 'produit_id', e.target.value)}>
                    <option value="">Produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                  <input type="number" className="input" placeholder="Qté" value={item.quantite}
                    onChange={e => updateItem(setReapproItems, idx, 'quantite', parseInt(e.target.value) || 1)} min="1" />
                  <div className="flex gap-1">
                    <input type="number" className="input flex-1" placeholder="Prix" value={item.prix_unitaire}
                      onChange={e => updateItem(setReapproItems, idx, 'prix_unitaire', parseFloat(e.target.value) || 0)} min="0" />
                    {reapproItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(setReapproItems, idx)} className="text-red-400 hover:text-red-600 text-lg px-1">×</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setReapproItems)} className="text-brand-600 text-sm hover:underline">+ Ajouter produit</button>
            </div>

            {totalReappro > 0 && (
              <div className="bg-brand-50 rounded-xl px-4 py-2 text-center">
                <p className="font-bold text-brand-700">Total : {totalReappro.toLocaleString()} {devise}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Montant payé</label>
                <input type="number" className="input" placeholder="0" value={reapproMontantPaye} onChange={e => setReapproMontantPaye(e.target.value)} />
              </div>
              <div>
                <label className="label">Mode paiement</label>
                <select className="input" value={reapproModePaiement} onChange={e => setReapproModePaiement(e.target.value)}>
                  {MODES_PAIEMENT.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
              </div>
            </div>

            {totalReappro > 0 && parseFloat(reapproMontantPaye) < totalReappro && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-sm text-orange-700">
                ⚠️ Reste dû : {(totalReappro - (parseFloat(reapproMontantPaye) || 0)).toLocaleString()} {devise} → ajouté à la dette
              </div>
            )}

            <div>
              <label className="label">Note</label>
              <input type="text" className="input" placeholder="Référence BL, note..." value={reapproNote} onChange={e => setReapproNote(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Enregistrement...' : '✅ Valider réception'}
              </button>
              <button type="button" onClick={() => setShowReappro(false)} className="btn-secondary px-4">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* === FORMULAIRE RETOUR FOURNISSEUR === */}
      {showRetourF && (
        <div className="card mb-4 border-2 border-orange-200">
          <h3 className="font-semibold text-gray-700 mb-3">↩️ Retour au fournisseur</h3>
          <form onSubmit={handleRetourFournisseur} className="space-y-3">
            <div>
              <label className="label">Fournisseur *</label>
              <select className="input" value={retourFId} onChange={e => setRetourFId(e.target.value)} required>
                <option value="">Choisir...</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Produits retournés</label>
              {retourFItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2 items-center">
                  <select className="input col-span-2" value={item.produit_id} onChange={e => updateItem(setRetourFItems, idx, 'produit_id', e.target.value)}>
                    <option value="">Produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (stock: {p.stock})</option>)}
                  </select>
                  <input type="number" className="input" placeholder="Qté" value={item.quantite}
                    onChange={e => updateItem(setRetourFItems, idx, 'quantite', parseInt(e.target.value) || 1)} min="1" />
                  <div className="flex gap-1">
                    <input type="number" className="input flex-1" placeholder="Prix" value={item.prix_unitaire}
                      onChange={e => updateItem(setRetourFItems, idx, 'prix_unitaire', parseFloat(e.target.value) || 0)} min="0" />
                    {retourFItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(setRetourFItems, idx)} className="text-red-400 hover:text-red-600 text-lg px-1">×</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setRetourFItems)} className="text-brand-600 text-sm hover:underline">+ Ajouter produit</button>
            </div>

            {totalRetourF > 0 && (
              <div className="bg-orange-50 rounded-xl px-4 py-2 text-center">
                <p className="font-bold text-orange-700">Valeur retournée : {totalRetourF.toLocaleString()} {devise}</p>
                <p className="text-xs text-orange-500 mt-0.5">Le stock sera décrémenté + la dette fournisseur réduite</p>
              </div>
            )}

            <div>
              <label className="label">Motif</label>
              <input type="text" className="input" placeholder="Produit avarié, erreur commande..." value={retourFMotif} onChange={e => setRetourFMotif(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Enregistrement...' : '✅ Valider retour'}
              </button>
              <button type="button" onClick={() => setShowRetourF(false)} className="btn-secondary px-4">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* === PAIEMENT FOURNISSEUR === */}
      {showPaiement && selectedF && (
        <div className="card mb-4 border-2 border-blue-200">
          <h3 className="font-semibold text-gray-700 mb-2">💳 Paiement — {selectedF.nom}</h3>
          <p className="text-sm text-orange-600 mb-3">Dette actuelle : <strong>{selectedF.dette.toLocaleString()} {devise}</strong></p>
          <div className="space-y-3">
            <div>
              <label className="label">Montant payé</label>
              <div className="flex gap-2">
                <input type="number" className="input flex-1 text-lg font-bold" placeholder="Montant"
                  value={paiementMontant} onChange={e => setPaiementMontant(e.target.value)} />
                <button onClick={() => setPaiementMontant(String(selectedF.dette))}
                  className="btn-secondary px-3 text-xs">Tout</button>
              </div>
            </div>
            <div>
              <label className="label">Mode de paiement</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES_PAIEMENT.map(m => (
                  <button key={m.val} type="button" onClick={() => setPaiementMode(m.val)}
                    className={"py-1.5 rounded-xl text-xs font-medium border transition " +
                      (paiementMode === m.val ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600')}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Note (optionnel)</label>
              <input type="text" className="input" placeholder="Référence virement..." value={paiementNote} onChange={e => setPaiementNote(e.target.value)} />
            </div>
            {paiementMontant && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-blue-700">
                Nouvelle dette : {Math.max(0, selectedF.dette - parseFloat(paiementMontant)).toLocaleString()} {devise}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handlePaiementFournisseur} className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Enregistrement...' : '✅ Valider paiement'}
              </button>
              <button onClick={() => { setShowPaiement(false); setSelectedF(null) }} className="btn-secondary px-4">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* === TAB FOURNISSEURS === */}
      {tab === 'fournisseurs' && (
        <div className="space-y-2">
          {fournisseurs.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">👨‍💼</div>
              <p>Aucun fournisseur — ajoutez-en un !</p>
            </div>
          ) : fournisseurs.map((f: any) => (
            <div key={f.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{f.nom}</h3>
                    {f.dette > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                        Dette: {f.dette.toLocaleString()} {devise}
                      </span>
                    )}
                    {f.dette === 0 && <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">✅ Soldé</span>}
                  </div>
                  {f.telephone && <p className="text-sm text-gray-400 mt-0.5">📞 {f.telephone}</p>}
                  {f.email && <p className="text-sm text-gray-400">✉️ {f.email}</p>}
                  {f.adresse && <p className="text-sm text-gray-400">📍 {f.adresse}</p>}
                </div>
                <div className="flex gap-2 ml-2 flex-shrink-0">
                  {f.dette > 0 && (
                    <button onClick={() => { setSelectedF(f); setShowPaiement(true); setShowReappro(false); setShowRetourF(false); setShowForm(false) }}
                      className="btn-secondary px-3 py-1 text-xs">💳 Payer</button>
                  )}
                  <button onClick={() => handleDelete(f.id)} className="text-gray-300 hover:text-red-500 text-xl leading-none">×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === TAB RÉAPPROS === */}
      {tab === 'reappros' && (
        <div className="space-y-2">
          {reappros.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">Aucun réappro enregistré</div>
          ) : reappros.map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{r.montant_total.toLocaleString()} {devise}</p>
                  <p className="text-xs text-gray-400">{r.date}{r.fournisseurs?.nom ? ' — ' + r.fournisseurs.nom : ''}</p>
                  {r.note && <p className="text-xs text-gray-500 mt-0.5">📝 {r.note}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Payé: {r.montant_paye.toLocaleString()}</p>
                  {r.montant_total - r.montant_paye > 0 && (
                    <p className="text-xs text-red-500">Reste: {(r.montant_total - r.montant_paye).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === TAB RETOURS FOURNISSEUR === */}
      {tab === 'retours' && (
        <div className="space-y-2">
          <div className="card text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">↩️</p>
            <p className="text-sm">Les retours fournisseurs apparaîtront ici</p>
            <button onClick={() => { setShowRetourF(true); setTab('fournisseurs') }}
              className="btn-primary mt-3 px-4 py-2 text-sm">Enregistrer un retour</button>
          </div>
        </div>
      )}
    </div>
  )
}
