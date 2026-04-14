'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const MOTIFS = [
  'Produit défectueux',
  'Erreur de produit',
  'Produit avarié',
  'Insatisfaction client',
  'Doublon commande',
  'Autre',
]

const MODES_REMBOURSEMENT = [
  { val: 'especes', label: '💵 Espèces' },
  { val: 'wave', label: '💙 Wave' },
  { val: 'orange_money', label: '🟠 Orange Money' },
  { val: 'free_money', label: '🟣 Free Money' },
  { val: 'avoir', label: '🎫 Avoir (crédit)' },
]

export default function RetourClient({ boutique, ventes, clients }: {
  boutique: any, ventes: any[], clients: any[]
}) {
  const router = useRouter()
  const devise = boutique.devise || 'FCFA'

  // Étapes : 1=choix vente, 2=choix articles, 3=confirmation
  const [step, setStep] = useState(1)
  const [venteId, setVenteId] = useState('')
  const [venteSelectionnee, setVenteSelectionnee] = useState<any>(null)
  const [typeRetour, setTypeRetour] = useState<'total' | 'partiel'>('total')
  const [itemsRetour, setItemsRetour] = useState<any[]>([])
  const [motif, setMotif] = useState('')
  const [modeRemboursement, setModeRemboursement] = useState('especes')
  const [montantLibre, setMontantLibre] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchVente, setSearchVente] = useState('')

  // Retours sans vente (remboursement libre)
  const [modeLibre, setModeLibre] = useState(false)
  const [nomClient, setNomClient] = useState('')
  const [clientId, setClientId] = useState('')

  const ventesFiltrees = ventes.filter(v =>
    !searchVente ||
    v.id.slice(0, 8).includes(searchVente) ||
    (v.clients?.nom && v.clients.nom.toLowerCase().includes(searchVente.toLowerCase()))
  )

  function selectionnerVente(v: any) {
    setVenteSelectionnee(v)
    setVenteId(v.id)
    const items = (v.vente_items || []).map((i: any) => ({
      ...i,
      quantite_retour: i.quantite,
      selectionne: true,
    }))
    setItemsRetour(items)
    setStep(2)
  }

  function toggleItem(idx: number) {
    setItemsRetour(items => items.map((it, i) => i === idx ? { ...it, selectionne: !it.selectionne } : it))
  }

  function updateQteRetour(idx: number, qty: number) {
    setItemsRetour(items => items.map((it, i) => i === idx
      ? { ...it, quantite_retour: Math.min(Math.max(1, qty), it.quantite) }
      : it
    ))
  }

  const itemsSelectionnes = itemsRetour.filter(i => i.selectionne)
  const montantCalcule = itemsSelectionnes.reduce((s, i) => s + i.prix_unitaire * i.quantite_retour, 0)
  const montantFinal = montantLibre ? parseFloat(montantLibre) : montantCalcule

  async function handleRetour() {
    if (!motif) { alert('Sélectionnez un motif'); return }
    if (montantFinal <= 0) { alert('Montant invalide'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: retour, error } = await supabase.from('retours').insert({
      boutique_id: boutique.id,
      vente_id: venteId || null,
      user_id: user!.id,
      type: modeLibre ? 'partiel' : (itemsSelectionnes.length === venteSelectionnee?.vente_items?.length && !montantLibre ? 'total' : 'partiel'),
      motif,
      montant_rembourse: montantFinal,
      mode_remboursement: modeRemboursement,
      montant_libre: montantLibre ? parseFloat(montantLibre) : 0,
      avoir: modeRemboursement === 'avoir',
    }).select().single()

    if (error || !retour) { alert('Erreur: ' + error?.message); setLoading(false); return }

    if (!modeLibre && itemsSelectionnes.length > 0) {
      await supabase.from('retour_items').insert(
        itemsSelectionnes.map(i => ({
          retour_id: retour.id,
          produit_id: i.produit_id,
          nom_produit: i.nom_produit,
          quantite: i.quantite_retour,
          prix_unitaire: i.prix_unitaire,
          sous_total: i.prix_unitaire * i.quantite_retour,
        }))
      )
      // Remettre en stock
      for (const item of itemsSelectionnes) {
        if (item.produit_id) {
          await supabase.rpc('increment_stock', { p_id: item.produit_id, qty: item.quantite_retour })
        }
      }
    }

    // Marquer vente comme retournée si total
    if (venteId && itemsSelectionnes.length === venteSelectionnee?.vente_items?.length && !montantLibre) {
      await supabase.from('ventes').update({ statut: 'retournee' }).eq('id', venteId)
    }

    // Créer avoir si mode avoir
    if (modeRemboursement === 'avoir') {
      const cid = clientId || venteSelectionnee?.client_id || null
      if (cid) {
        await supabase.from('avoirs_client').insert({
          boutique_id: boutique.id,
          client_id: cid,
          retour_id: retour.id,
          montant: montantFinal,
        })
      }
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  function imprimerRecu() {
    const w = window.open('', '_blank')
    if (!w) return
    const items = modeLibre ? [] : itemsSelectionnes
    w.document.write(`
      <html><head><title>Reçu Retour</title>
      <style>
        body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; font-size: 13px; }
        h2 { text-align: center; }
        .ligne { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0; }
        .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
        .centre { text-align: center; color: #666; margin-top: 10px; font-size: 11px; }
      </style></head><body>
      <h2>↩️ REÇU RETOUR</h2>
      <p style="text-align:center">${boutique.nom}</p>
      <p style="text-align:center">${new Date().toLocaleString('fr-FR')}</p>
      <hr/>
      <p><b>Motif :</b> ${motif}</p>
      <p><b>Mode remboursement :</b> ${MODES_REMBOURSEMENT.find(m => m.val === modeRemboursement)?.label}</p>
      <hr/>
      ${items.map(i => `
        <div class="ligne">
          <span>${i.nom_produit} x${i.quantite_retour}</span>
          <span>${(i.prix_unitaire * i.quantite_retour).toLocaleString()} ${devise}</span>
        </div>`).join('')}
      <div class="ligne total">
        <span>REMBOURSÉ</span>
        <span>${montantFinal.toLocaleString()} ${devise}</span>
      </div>
      <p class="centre">Merci de votre confiance 🙏</p>
      </body></html>
    `)
    w.print()
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <div className="card py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-brand-800 mb-2">Retour enregistré !</h2>
          <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 mb-4 inline-block">
            <p className="text-green-700 font-bold text-xl">
              {modeRemboursement === 'avoir' ? '🎫 Avoir créé :' : '💰 Remboursé :'} {montantFinal.toLocaleString()} {devise}
            </p>
            <p className="text-green-600 text-sm mt-1">{MODES_REMBOURSEMENT.find(m => m.val === modeRemboursement)?.label}</p>
          </div>
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <button onClick={imprimerRecu} className="btn-secondary px-5">🖨️ Reçu</button>
            <button onClick={() => { setSuccess(false); setStep(1); setVenteSelectionnee(null); setVenteId(''); setMontantLibre(''); setMotif(''); setModeLibre(false) }} className="btn-primary px-5">
              Nouveau retour
            </button>
            <Link href={"/boutique/" + boutique.id} className="btn-secondary px-5">← Boutique</Link>
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
      <h1 className="text-xl font-bold text-brand-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>↩️ Retours & Remboursements</h1>

      {/* Mode libre ou via vente */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setModeLibre(false); setStep(1) }}
          className={"flex-1 py-2 rounded-xl text-sm font-medium " + (!modeLibre ? 'bg-brand-500 text-white' : 'bg-white border text-gray-600')}>
          📋 Via une vente
        </button>
        <button onClick={() => { setModeLibre(true); setStep(2) }}
          className={"flex-1 py-2 rounded-xl text-sm font-medium " + (modeLibre ? 'bg-brand-500 text-white' : 'bg-white border text-gray-600')}>
          ✏️ Montant libre
        </button>
      </div>

      {/* ÉTAPE 1 — Choisir une vente */}
      {!modeLibre && step === 1 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">Rechercher la vente</h3>
          <input type="text" className="input mb-3" placeholder="🔍 N° vente ou nom client..."
            value={searchVente} onChange={e => setSearchVente(e.target.value)} />
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {ventesFiltrees.slice(0, 20).map((v: any) => (
              <button key={v.id} onClick={() => selectionnerVente(v)}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:bg-brand-50 transition">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{v.montant_total?.toLocaleString()} {devise}</p>
                    <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleString('fr-FR')}</p>
                    {v.clients?.nom && <p className="text-xs text-brand-600">👤 {v.clients.nom}</p>}
                  </div>
                  <div className="text-right">
                    <span className={"text-xs px-2 py-0.5 rounded-full " + (v.statut === 'payee' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                      {v.statut}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{(v.vente_items || []).length} article(s)</p>
                  </div>
                </div>
              </button>
            ))}
            {ventesFiltrees.length === 0 && <p className="text-center text-gray-400 py-4">Aucune vente trouvée</p>}
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — Articles + montant */}
      {(step === 2 || modeLibre) && (
        <div className="space-y-4">
          {/* Résumé vente sélectionnée */}
          {venteSelectionnee && (
            <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-brand-800">{venteSelectionnee.montant_total?.toLocaleString()} {devise}</p>
                <p className="text-xs text-gray-500">{new Date(venteSelectionnee.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <button onClick={() => { setStep(1); setVenteSelectionnee(null) }} className="text-xs text-brand-600 hover:underline">Changer</button>
            </div>
          )}

          {/* Articles (si vente) */}
          {!modeLibre && itemsRetour.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">Articles à retourner</h3>
              <div className="space-y-3">
                {itemsRetour.map((item, idx) => (
                  <div key={idx} className={"flex items-center gap-3 py-2 border-b border-gray-100 " + (!item.selectionne ? 'opacity-40' : '')}>
                    <input type="checkbox" checked={item.selectionne} onChange={() => toggleItem(idx)}
                      className="w-4 h-4 accent-brand-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{item.nom_produit}</p>
                      <p className="text-xs text-gray-400">{item.prix_unitaire?.toLocaleString()} {devise} / unité</p>
                    </div>
                    {item.selectionne && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQteRetour(idx, item.quantite_retour - 1)}
                          className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm font-bold">-</button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantite_retour}</span>
                        <button onClick={() => updateQteRetour(idx, item.quantite_retour + 1)}
                          className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-sm font-bold">+</button>
                        <span className="text-xs text-gray-500 ml-1">/{item.quantite}</span>
                      </div>
                    )}
                    <span className="text-sm font-bold text-brand-600 w-20 text-right">
                      {item.selectionne ? (item.prix_unitaire * item.quantite_retour).toLocaleString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
              {itemsSelectionnes.length > 0 && (
                <div className="mt-3 bg-brand-50 rounded-xl px-4 py-2 flex justify-between">
                  <span className="text-sm font-semibold text-brand-700">Sous-total calculé</span>
                  <span className="font-bold text-brand-700">{montantCalcule.toLocaleString()} {devise}</span>
                </div>
              )}
            </div>
          )}

          {/* Montant libre */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">
              {modeLibre ? '💵 Montant à rembourser' : '✏️ Ajuster le montant (optionnel)'}
            </h3>
            {modeLibre && clients.length > 0 && (
              <div className="mb-3">
                <label className="label">Client</label>
                <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">Client anonyme</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
            )}
            <input type="number" className="input text-xl font-bold mb-1"
              placeholder={modeLibre ? 'Ex: 5000' : ('Laisser vide = ' + montantCalcule.toLocaleString())}
              value={montantLibre} onChange={e => setMontantLibre(e.target.value)} />
            {!modeLibre && montantLibre && (
              <p className="text-xs text-orange-500">⚠️ Vous remplacez le montant calculé ({montantCalcule.toLocaleString()} {devise})</p>
            )}
            <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
              <p className="font-bold text-green-700 text-lg">À rembourser : {montantFinal.toLocaleString()} {devise}</p>
            </div>
          </div>

          {/* Mode de remboursement */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">Mode de remboursement</h3>
            <div className="grid grid-cols-2 gap-2">
              {MODES_REMBOURSEMENT.map(m => (
                <button key={m.val} onClick={() => setModeRemboursement(m.val)}
                  className={"py-2 px-3 rounded-xl text-sm font-medium border transition " +
                    (modeRemboursement === m.val ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 bg-white')}>
                  {m.label}
                </button>
              ))}
            </div>
            {modeRemboursement === 'avoir' && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-xs text-yellow-700">
                🎫 Un avoir sera créé pour le client — utilisable sur la prochaine vente
              </div>
            )}
          </div>

          {/* Motif */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">Motif du retour *</h3>
            <div className="grid grid-cols-2 gap-2">
              {MOTIFS.map(m => (
                <button key={m} onClick={() => setMotif(m)}
                  className={"py-2 px-3 rounded-xl text-xs font-medium border transition text-left " +
                    (motif === m ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600 bg-white')}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleRetour} disabled={loading || montantFinal <= 0 || !motif}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50">
            {loading ? 'Enregistrement...' : `✅ Valider le retour — ${montantFinal.toLocaleString()} ${devise}`}
          </button>
        </div>
      )}
    </div>
  )
}
