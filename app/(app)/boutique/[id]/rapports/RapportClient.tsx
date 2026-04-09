'use client'
import Link from 'next/link'

export default function RapportClient({ boutique, ventes, depenses }: {
  boutique: any, ventes: any[], depenses: any[]
}) {
  const devise = boutique.devise || 'FCFA'
  const now = new Date()
  const mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const totalVentes = ventes.reduce((s, v) => s + v.montant_paye, 0)
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0)
  const benefice = totalVentes - totalDepenses

  const parJour: Record<string, number> = {}
  ventes.forEach(v => {
    const jour = new Date(v.created_at).getDate().toString()
    parJour[jour] = (parJour[jour] || 0) + v.montant_paye
  })

  const parProduit: Record<string, { nom: string, qte: number, total: number }> = {}
  ventes.forEach(v => {
    (v.vente_items || []).forEach((i: any) => {
      if (!parProduit[i.nom_produit]) parProduit[i.nom_produit] = { nom: i.nom_produit, qte: 0, total: 0 }
      parProduit[i.nom_produit].qte += i.quantite
      parProduit[i.nom_produit].total += i.sous_total
    })
  })
  const topProduits = Object.values(parProduit).sort((a, b) => b.total - a.total).slice(0, 5)

  const parMode: Record<string, number> = {}
  ventes.forEach(v => {
    parMode[v.mode_paiement] = (parMode[v.mode_paiement] || 0) + v.montant_paye
  })

  const maxJour = Math.max(...Object.values(parJour), 1)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>
      <h1 className="text-xl font-bold text-brand-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>
        📊 Rapport mensuel
      </h1>
      <p className="text-gray-500 text-sm mb-6 capitalize">{mois}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Ventes</p>
          <p className="font-bold text-green-600">{totalVentes.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{devise}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Depenses</p>
          <p className="font-bold text-red-600">{totalDepenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{devise}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Benefice</p>
          <p className={"font-bold " + (benefice >= 0 ? "text-brand-600" : "text-red-600")}>{benefice.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{devise}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">📈 Ventes par jour</h3>
        <div className="flex items-end gap-1 h-32">
          {Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }, (_, i) => {
            const jour = (i + 1).toString()
            const val = parJour[jour] || 0
            const h = maxJour > 0 ? (val / maxJour) * 100 : 0
            return (
              <div key={jour} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-brand-200 rounded-t" style={{ height: h + "%" }} title={val.toLocaleString() + " " + devise} />
                {(i + 1) % 5 === 0 && <span className="text-xs text-gray-400">{i + 1}</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">🏆 Top produits</h3>
        {topProduits.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Aucune vente ce mois</p>
        ) : (
          <div className="space-y-2">
            {topProduits.map((p, i) => (
              <div key={p.nom} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.nom}</p>
                    <p className="text-xs text-gray-400">{p.qte} vendus</p>
                  </div>
                </div>
                <span className="font-semibold text-brand-600 text-sm">{p.total.toLocaleString()} {devise}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">💳 Par mode de paiement</h3>
        <div className="space-y-2">
          {Object.entries(parMode).map(([mode, total]) => (
            <div key={mode} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600 capitalize">{mode.replace('_', ' ')}</span>
              <span className="font-semibold text-gray-800">{total.toLocaleString()} {devise}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
