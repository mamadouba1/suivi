"use client"
interface VenteItem { produit: string; quantite: number; prix_unitaire: number }
interface FactureProps {
  vente: { id: string; created_at: string; montant_total: number; client_nom?: string }
  items: VenteItem[]
  boutique: { nom: string; adresse?: string; telephone?: string }
  onClose: () => void
}
export default function FacturePDF({ vente, items, boutique, onClose }: FactureProps) {
  const handlePrint = () => window.print()
  const handleWhatsApp = () => {
    const lines = items.map(i => `• ${i.produit} x${i.quantite} = ${(i.quantite * i.prix_unitaire).toLocaleString()} GNF`)
    const msg = `🧾 *FACTURE - ${boutique.nom}*\nDate: ${new Date(vente.created_at).toLocaleDateString('fr-FR')}\nClient: ${vente.client_nom || 'Client'}\n\n${lines.join('\n')}\n\n*TOTAL: ${vente.montant_total.toLocaleString()} GNF*`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`)
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md print:shadow-none print:rounded-none">
        <div className="p-6 print:p-4">
          <div className="text-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{boutique.nom}</h1>
            {boutique.adresse && <p className="text-sm text-gray-500">{boutique.adresse}</p>}
            {boutique.telephone && <p className="text-sm text-gray-500">📞 {boutique.telephone}</p>}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>Facture #{vente.id.slice(0,8).toUpperCase()}</span>
            <span>{new Date(vente.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          {vente.client_nom && <p className="text-sm font-medium mb-4">Client : <span className="text-gray-700">{vente.client_nom}</span></p>}
          <table className="w-full text-sm mb-4">
            <thead><tr className="border-b text-gray-500"><th className="text-left py-1">Article</th><th className="text-center py-1">Qté</th><th className="text-right py-1">Montant</th></tr></thead>
            <tbody>{items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100"><td className="py-1">{item.produit}</td><td className="text-center py-1">{item.quantite}</td><td className="text-right py-1">{(item.quantite * item.prix_unitaire).toLocaleString()} GNF</td></tr>
            ))}</tbody>
          </table>
          <div className="flex justify-between font-bold text-lg border-t pt-3">
            <span>TOTAL</span><span className="text-green-600">{vente.montant_total.toLocaleString()} GNF</span>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Merci pour votre achat !</p>
        </div>
        <div className="flex gap-2 p-4 border-t print:hidden">
          <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700">🖨️ Imprimer</button>
          <button onClick={handleWhatsApp} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-medium hover:bg-green-600">📲 WhatsApp</button>
          <button onClick={onClose} className="px-4 bg-gray-100 text-gray-600 py-2 rounded-xl font-medium hover:bg-gray-200">✕</button>
        </div>
      </div>
    </div>
  )
}
