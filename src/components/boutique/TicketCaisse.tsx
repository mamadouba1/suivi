"use client"
interface TicketProps {
  vente: { id: string; created_at: string; montant_total: number; client_nom?: string }
  items: { produit: string; quantite: number; prix_unitaire: number }[]
  boutique: { nom: string; telephone?: string }
  onClose: () => void
}
export default function TicketCaisse({ vente, items, boutique, onClose }: TicketProps) {
  const handlePrint = () => window.print()
  const handleWhatsApp = () => {
    const lines = items.map(i => `${i.produit} x${i.quantite}: ${(i.quantite * i.prix_unitaire).toLocaleString()}`)
    const msg = `🧾 ${boutique.nom}\n${new Date(vente.created_at).toLocaleDateString('fr-FR')}\n---\n${lines.join('\n')}\n---\nTOTAL: ${vente.montant_total.toLocaleString()} GNF\nMerci !`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`)
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-72 print:shadow-none">
        <div className="p-4 font-mono text-xs">
          <div className="text-center border-b border-dashed pb-2 mb-2">
            <p className="font-bold text-base">{boutique.nom}</p>
            {boutique.telephone && <p>{boutique.telephone}</p>}
            <p>{new Date(vente.created_at).toLocaleString('fr-FR')}</p>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span>{item.produit} x{item.quantite}</span>
              <span>{(item.quantite * item.prix_unitaire).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-dashed mt-2 pt-2 flex justify-between font-bold text-sm">
            <span>TOTAL</span><span>{vente.montant_total.toLocaleString()} GNF</span>
          </div>
          <p className="text-center mt-2">★ Merci ★</p>
        </div>
        <div className="flex gap-2 p-3 border-t print:hidden">
          <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm">🖨️ Print</button>
          <button onClick={handleWhatsApp} className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-sm">📲 WA</button>
          <button onClick={onClose} className="px-3 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-sm">✕</button>
        </div>
      </div>
    </div>
  )
}
