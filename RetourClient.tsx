'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useVocal } from '@/lib/useVocal'

interface VenteItem {
  id: string
  produit_id: string | null
  nom_produit: string
  quantite: number
  prix_unitaire: number
  sous_total: number
}

interface Vente {
  id: string
  montant_total: number
  montant_paye: number
  mode_paiement: string
  statut: string
  created_at: string
  vente_items: VenteItem[]
}

interface RetourItem {
  item: VenteItem
  quantiteRetour: number
  selectionne: boolean
}

export default function RetourClient({ boutique, ventes }: {
  boutique: any
  ventes: Vente[]
}) {
  const router = useRouter()
  const devise = boutique.devise || 'FCFA'
  const { lire, annoncerRetour, parle } = useVocal({ langue: 'fr-FR' })

  // ── États ──────────────────────────────────────────────────────────────────
  const [venteSelectionnee, setVenteSelectionnee] = useState<Vente | null>(null)
  const [typeRetour, setTypeRetour] = useState<'total' | 'partiel'>('total')
  const [retourItems, setRetourItems] = useState<RetourItem[]>([])
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [montantRembourse, setMontantRembourse] = useState(0)
  const [searchVente, setSearchVente] = useState('')

  // ── Sélection d'une vente ─────────────────────────────────────────────────
  function selectionnerVente(vente: Vente) {
    setVenteSelectionnee(vente)
    setTypeRetour('total')
    setRetourItems(
      vente.vente_items.map(item => ({
        item,
        quantiteRetour: item.quantite,
        selectionne: true,
      }))
    )
    setMotif('')
  }

  function changerTypeRetour(type: 'total' | 'partiel') {
    setTypeRetour(type)
    if (!venteSelectionnee) return
    setRetourItems(
      venteSelectionnee.vente_items.map(item => ({
        item,
        quantiteRetour: type === 'total' ? item.quantite : 0,
        selectionne: type === 'total',
      }))
    )
  }

  function toggleItem(index: number) {
    setRetourItems(prev => prev.map((ri, i) =>
      i === index
        ? { ...ri, selectionne: !ri.selectionne, quantiteRetour: !ri.selectionne ? ri.item.quantite : 0 }
        : ri
    ))
  }

  function setQty(index: number, qty: number) {
    setRetourItems(prev => prev.map((ri, i) =>
      i === index
        ? { ...ri, quantiteRetour: Math.min(Math.max(0, qty), ri.item.quantite), selectionne: qty > 0 }
        : ri
    ))
  }

  // ── Calcul montant à rembourser ───────────────────────────────────────────
  const montantCalcule = typeRetour === 'total'
    ? (venteSelectionnee?.montant_paye || 0)
    : retourItems
        .filter(ri => ri.selectionne && ri.quantiteRetour > 0)
        .reduce((s, ri) => s + ri.quantiteRetour * ri.item.prix_unitaire, 0)

  const itemsARetourner = retourItems.filter(ri => ri.selectionne && ri.quantiteRetour > 0)

  // ── Soumission ────────────────────────────────────────────────────────────
  async function handleRetour() {
    if (!venteSelectionnee) return
    if (typeRetour === 'partiel' && itemsARetourner.length === 0) {
      alert('Sélectionnez au moins un article à retourner')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Créer le retour
    const { data: retour, error } = await supabase
      .from('retours')
      .insert({
        vente_id: venteSelectionnee.id,
        boutique_id: boutique.id,
        user_id: user!.id,
        type: typeRetour,
        motif: motif || null,
        montant_rembourse: montantCalcule,
      })
      .select()
      .single()

    if (error || !retour) {
      alert('Erreur lors du retour : ' + (error?.message || 'inconnue'))
      setLoading(false)
      return
    }

    // 2. Créer les retour_items (partiel) ou tous les items (total)
    const itemsInsert = typeRetour === 'total'
      ? venteSelectionnee.vente_items.map(item => ({
          retour_id: retour.id,
          produit_id: item.produit_id,
          nom_produit: item.nom_produit,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          sous_total: item.sous_total,
        }))
      : itemsARetourner.map(ri => ({
          retour_id: retour.id,
          produit_id: ri.item.produit_id,
          nom_produit: ri.item.nom_produit,
          quantite: ri.quantiteRetour,
          prix_unitaire: ri.item.prix_unitaire,
          sous_total: ri.quantiteRetour * ri.item.prix_unitaire,
        }))

    if (itemsInsert.length > 0) {
      await supabase.from('retour_items').insert(itemsInsert)
    }

    // 3. Ré-incrémenter le stock pour chaque produit retourné
    for (const ins of itemsInsert) {
      if (ins.produit_id) {
        await supabase.rpc('increment_stock', {
          p_id: ins.produit_id,
          qty: ins.quantite,
        })
      }
    }

    // 4. Si retour total → mettre la vente en statut "retournee"
    if (typeRetour === 'total') {
      await supabase
        .from('ventes')
        .update({ statut: 'retournee' })
        .eq('id', venteSelectionnee.id)
    }

    // 5. Vocal de confirmation
    annoncerRetour(montantCalcule, devise)

    setMontantRembourse(montantCalcule)
    setSucces(true)
    setLoading(false)
    router.refresh()
  }

  // ── Écran succès ──────────────────────────────────────────────────────────
  if (succes) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <div className="card py-12">
          <div className="text-6xl mb-4">↩️</div>
          <h2 className="text-2xl font-bold text-brand-800 mb-2">Retour enregistré !</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-6 py-4 mb-4 inline-block">
            <p className="text-orange-700 font-bold text-xl">
              À rembourser : {montantRembourse.toLocaleString()} {devise}
            </p>
          </div>
          {parle && <p className="text-xs text-gray-400 mb-2">🔊 Lecture en cours…</p>}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => { setSucces(false); setVenteSelectionnee(null) }}
              className="btn-primary px-6">
              Nouveau retour
            </button>
            <Link href={'/boutique/' + boutique.id} className="btn-secondary px-6">
              Tableau de bord
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Filtrage ventes ───────────────────────────────────────────────────────
  const ventesFiltrees = ventes.filter(v =>
    v.statut !== 'retournee' &&
    (searchVente === '' ||
      v.id.slice(0, 8).includes(searchVente) ||
      v.montant_total.toString().includes(searchVente))
  )

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* En-tête */}
      <div className="mb-4">
        <Link href={'/boutique/' + boutique.id} className="text-brand-600 text-sm hover:underline">
          ← {boutique.nom}
        </Link>
      </div>
      <h1 className="text-xl font-bold text-brand-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
        ↩️ Retours & Remboursements
      </h1>

      {/* ÉTAPE 1 — Sélection vente */}
      {!venteSelectionnee && (
        <div className="space-y-3">
          <div className="card">
            <p className="text-sm text-gray-500 mb-3">
              Sélectionnez la vente à retourner (partiellement ou totalement)
            </p>
            <input
              type="text"
              className="input mb-3"
              placeholder="🔍 Filtrer par montant ou référence..."
              value={searchVente}
              onChange={e => setSearchVente(e.target.value)}
            />
          </div>

          {ventesFiltrees.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              Aucune vente disponible pour un retour
            </div>
          ) : (
            ventesFiltrees.map(v => (
              <button
                key={v.id}
                onClick={() => selectionnerVente(v)}
                className="w-full card text-left hover:shadow-md transition hover:border-brand-300 border border-transparent"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">
                      {v.montant_total.toLocaleString()} {devise}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(v.created_at).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400">Réf : {v.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <span className={
                      'text-xs px-2 py-0.5 rounded-full ' +
                      (v.statut === 'payee' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                    }>
                      {v.statut === 'payee' ? '✅ Payée' : '📝 Crédit'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {v.vente_items.length} article(s)
                    </p>
                  </div>
                </div>
                {/* Articles résumés */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  {v.vente_items.slice(0, 3).map(item => (
                    <p key={item.id} className="text-xs text-gray-500">
                      • {item.nom_produit} × {item.quantite}
                    </p>
                  ))}
                  {v.vente_items.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{v.vente_items.length - 3} autre(s)…
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* ÉTAPE 2 — Configuration du retour */}
      {venteSelectionnee && (
        <div className="space-y-4">
          {/* Résumé vente sélectionnée */}
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-brand-800">
                  Vente du {new Date(venteSelectionnee.created_at).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm text-brand-600">
                  {venteSelectionnee.montant_total.toLocaleString()} {devise} — {venteSelectionnee.mode_paiement}
                </p>
              </div>
              <button
                onClick={() => setVenteSelectionnee(null)}
                className="text-gray-400 hover:text-red-500 text-lg"
              >
                ×
              </button>
            </div>
          </div>

          {/* Type de retour */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">Type de retour</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['total', '↩️ Retour total', 'Toute la vente annulée'],
                ['partiel', '🔀 Retour partiel', 'Certains articles seulement'],
              ].map(([val, label, desc]) => (
                <button
                  key={val}
                  onClick={() => changerTypeRetour(val as 'total' | 'partiel')}
                  className={
                    'p-3 rounded-xl border text-left transition ' +
                    (typeRetour === val
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'border-gray-200 text-gray-600 bg-white hover:border-brand-300')
                  }
                >
                  <p className="font-medium text-sm">{label}</p>
                  <p className={
                    'text-xs mt-0.5 ' +
                    (typeRetour === val ? 'text-brand-100' : 'text-gray-400')
                  }>
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Articles — retour partiel */}
          {typeRetour === 'partiel' && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">
                Articles à retourner
              </h3>
              <div className="space-y-3">
                {retourItems.map((ri, index) => (
                  <div
                    key={ri.item.id}
                    className={
                      'p-3 rounded-xl border transition ' +
                      (ri.selectionne
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-gray-200 bg-white')
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={ri.selectionne}
                          onChange={() => toggleItem(index)}
                          className="w-4 h-4 accent-brand-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {ri.item.nom_produit}
                          </p>
                          <p className="text-xs text-gray-400">
                            {ri.item.prix_unitaire.toLocaleString()} {devise} × max {ri.item.quantite}
                          </p>
                        </div>
                      </div>
                      {ri.selectionne && (
                        <span className="text-sm font-bold text-brand-600">
                          {(ri.quantiteRetour * ri.item.prix_unitaire).toLocaleString()} {devise}
                        </span>
                      )}
                    </div>

                    {ri.selectionne && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Qté à retourner :</span>
                        <button
                          onClick={() => setQty(index, ri.quantiteRetour - 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold text-sm"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold w-6 text-center">
                          {ri.quantiteRetour}
                        </span>
                        <button
                          onClick={() => setQty(index, ri.quantiteRetour + 1)}
                          className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 font-bold text-sm"
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-400">/ {ri.item.quantite}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles — retour total (lecture seule) */}
          {typeRetour === 'total' && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">
                Articles concernés (tous)
              </h3>
              <div className="space-y-2">
                {venteSelectionnee.vente_items.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-700">{item.nom_produit}</p>
                      <p className="text-xs text-gray-400">× {item.quantite}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {item.sous_total.toLocaleString()} {devise}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motif */}
          <div className="card">
            <label className="label">Motif du retour (optionnel)</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: produit défectueux, erreur de commande..."
              value={motif}
              onChange={e => setMotif(e.target.value)}
            />
          </div>

          {/* Résumé remboursement */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-orange-600 font-medium">Montant à rembourser</p>
                {typeRetour === 'partiel' && itemsARetourner.length === 0 && (
                  <p className="text-xs text-orange-400 mt-0.5">
                    Sélectionnez des articles ci-dessus
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {montantCalcule.toLocaleString()} {devise}
              </p>
            </div>
          </div>

          {/* Bouton confirmer */}
          <button
            onClick={handleRetour}
            disabled={
              loading ||
              (typeRetour === 'partiel' && itemsARetourner.length === 0) ||
              montantCalcule === 0
            }
            className="btn-primary w-full py-4 text-lg disabled:opacity-50"
          >
            {loading
              ? 'Enregistrement...'
              : `Confirmer le retour — ${montantCalcule.toLocaleString()} ${devise}`}
          </button>

          <button
            onClick={() => setVenteSelectionnee(null)}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Changer de vente
          </button>
        </div>
      )}
    </div>
  )
}
