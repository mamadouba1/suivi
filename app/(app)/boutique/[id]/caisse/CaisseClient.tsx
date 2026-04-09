'use client'
import Link from 'next/link'
import { genererFacture, genererTicket } from '@/lib/pdf'

export default function CaisseClient({ boutique, ventes, depenses }: {
  boutique: any, ventes: any[], depenses: any[]
}) {
  const devise = boutique.devise || 'FCFA'

  const totalEspeces = ventes.filter(v => v.mode_paiement === 'especes').reduce((s, v) => s + v.montant_paye, 0)
  const totalWave = ventes.filter(v => v.mode_paiement === 'wave').reduce((s, v) => s + v.montant_paye, 0)
  const totalOrange = ventes.filter(v => v.mode_paiement === 'orange_money').reduce((s, v) => s + v.montant_paye, 0)
  const totalFree = ventes.filter(v => v.mode_paiement === 'free_money').reduce((s, v) => s + v.montant_paye, 0)
  const totalCredit = ventes.filter(v => v.mode_paiement === 'credit').reduce((s, v) => s + v.montant_total, 0)
  const totalVentes = ventes.reduce((s, v) => s + v.montant_paye, 0)
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0)
  const benefice = totalVentes - totalDepenses

  function downloadFacture(vente: any) {
    const doc = genererFacture(boutique, vente, vente.vente_items || [])
    doc.save('facture-' + vente.id.slice(0, 8) + '.pdf')
  }

  function downloadTicket(vente: any) {
    const doc = genererTicket(boutique, vente, vente.vente_items || [])
    doc.save('ticket-' + vente.id.slice(0, 8) + '.pdf')
  }

  function partagerWhatsApp(vente: any) {
    const items = (vente.vente_items || []).map((i: any) =>
      i.nom_produit + ' x' + i.quantite + ' = ' + i.sous_total.toLocaleString() + ' ' + devise
    ).join('\n')
    const msg = encodeURIComponent(
      '🧾 *Recu - ' + boutique.nom + '*\n' +
      '---\n' + items + '\n---\n' +
      '*Total: ' + vente.montant_total.toLocaleString() + ' ' + devise + '*\n' +
      'Paye: ' + vente.montant_paye.toLocaleString() + ' ' + devise + '\n' +
      (vente.montant_rendu > 0 ? 'Rendu: ' + vente.montant_rendu.toLocaleString() + ' ' + devise + '\n' : '') +
      'Mode: ' + vente.mode_paiement + '\n' +
      '\nMerci pour votre achat ! 🙏'
    )
    window.open('https://wa.me/?text=' + msg, '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>

      <h1 className="text-xl font-bold text-brand-800 mb-4" style={{ fontFamily: "Georgia, serif" }}>
        💰 Caisse du jour — {new Date().toLocaleDateString('fr-FR')}
      </h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total ventes</p>
          <p className="font-bold text-green-600 text-lg">{totalVentes.toLocaleString()} {devise}</p>
          <p className="text-xs text-gray-400">{ventes.length} vente(s)</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Benefice net</p>
          <p className={"font-bold text-lg " + (benefice >= 0 ? "text-brand-600" : "text-red-600")}>
            {benefice.toLocaleString()} {devise}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Ventilation par mode de paiement</h3>
        <div className="space-y-2">
          {[
            ['💵 Especes', totalEspeces],
            ['💙 Wave', totalWave],
            ['🟠 Orange Money', totalOrange],
            ['🟣 Free Money', totalFree],
            ['📝 Credit', totalCredit],
          ].map(([label, val]: any) => val > 0 && (
            <div key={label as string} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="font-semibold text-gray-800">{val.toLocaleString()} {devise}</span>
            </div>
          ))}
          {totalDepenses > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-red-500">💸 Depenses</span>
              <span className="font-semibold text-red-500">-{totalDepenses.toLocaleString()} {devise}</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="font-semibold text-gray-700 mb-3">Ventes du jour</h2>
      <div className="space-y-3">
        {ventes.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">Aucune vente aujourd&apos;hui</div>
        ) : (
          ventes.map((v: any) => (
            <div key={v.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-800">{v.montant_total.toLocaleString()} {devise}</p>
                  <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleTimeString('fr-FR')}</p>
                  <span className={"text-xs px-2 py-0.5 rounded-full " + (v.statut === 'payee' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                    {v.statut === 'payee' ? '✅ Payee' : '📝 Credit'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{v.mode_paiement}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadFacture(v)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition">
                  📄 Facture PDF
                </button>
                <button onClick={() => downloadTicket(v)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition">
                  🖨️ Ticket
                </button>
                <button onClick={() => partagerWhatsApp(v)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition">
                  💬 WhatsApp
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
