import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function genererFacture(boutique: any, vente: any, items: any[], client?: any) {
  const doc = new jsPDF()
  const devise = boutique.devise || 'FCFA'

  // Header
  doc.setFontSize(22)
  doc.setTextColor(194, 65, 12)
  doc.text(boutique.nom, 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100)
  if (boutique.adresse) doc.text('📍 ' + boutique.adresse, 105, 28, { align: 'center' })
  if (boutique.telephone) doc.text('📞 ' + boutique.telephone, 105, 34, { align: 'center' })

  // Ligne separatrice
  doc.setDrawColor(194, 65, 12)
  doc.setLineWidth(0.5)
  doc.line(15, 40, 195, 40)

  // Titre facture
  doc.setFontSize(16)
  doc.setTextColor(0)
  doc.text('FACTURE', 15, 50)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Date: ' + new Date(vente.created_at).toLocaleDateString('fr-FR'), 15, 57)
  doc.text('N°: ' + vente.id.slice(0, 8).toUpperCase(), 15, 63)

  if (client) {
    doc.text('Client: ' + client.nom, 120, 57)
    if (client.telephone) doc.text('Tel: ' + client.telephone, 120, 63)
  }

  // Tableau produits
  autoTable(doc, {
    startY: 70,
    head: [['Produit', 'Prix unit.', 'Qte', 'Sous-total']],
    body: items.map(i => [
      i.nom_produit,
      i.prix_unitaire.toLocaleString() + ' ' + devise,
      i.quantite.toString(),
      i.sous_total.toLocaleString() + ' ' + devise,
    ]),
    headStyles: { fillColor: [194, 65, 12], textColor: 255 },
    alternateRowStyles: { fillColor: [253, 246, 238] },
    styles: { fontSize: 10 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Total
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Total: ' + vente.montant_total.toLocaleString() + ' ' + devise, 150, finalY, { align: 'right' })
  doc.text('Paye: ' + vente.montant_paye.toLocaleString() + ' ' + devise, 150, finalY + 7, { align: 'right' })
  if (vente.montant_rendu > 0) {
    doc.text('Rendu: ' + vente.montant_rendu.toLocaleString() + ' ' + devise, 150, finalY + 14, { align: 'right' })
  }

  doc.setFontSize(10)
  doc.setTextColor(194, 65, 12)
  doc.text('Mode: ' + vente.mode_paiement.toUpperCase(), 15, finalY)

  // Footer
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text('Merci pour votre achat !', 105, finalY + 25, { align: 'center' })
  doc.text('Suivi Depenses — suivi-des-depenses-blond.vercel.app', 105, finalY + 31, { align: 'center' })

  return doc
}

export function genererTicket(boutique: any, vente: any, items: any[], client?: any) {
  const doc = new jsPDF({ format: [80, 200], unit: 'mm' })
  const devise = boutique.devise || 'FCFA'
  let y = 10

  doc.setFontSize(12)
  doc.setTextColor(194, 65, 12)
  doc.text(boutique.nom, 40, y, { align: 'center' })
  y += 7

  doc.setFontSize(8)
  doc.setTextColor(100)
  if (boutique.adresse) { doc.text(boutique.adresse, 40, y, { align: 'center' }); y += 5 }
  if (boutique.telephone) { doc.text(boutique.telephone, 40, y, { align: 'center' }); y += 5 }

  doc.setDrawColor(0)
  doc.line(5, y, 75, y); y += 5

  doc.setTextColor(0)
  doc.text(new Date(vente.created_at).toLocaleString('fr-FR'), 40, y, { align: 'center' }); y += 7

  items.forEach(i => {
    doc.text(i.nom_produit, 5, y)
    doc.text(i.sous_total.toLocaleString() + ' ' + devise, 75, y, { align: 'right' })
    y += 5
    doc.setTextColor(100)
    doc.text('  ' + i.quantite + ' x ' + i.prix_unitaire.toLocaleString(), 5, y)
    doc.setTextColor(0)
    y += 5
  })

  doc.line(5, y, 75, y); y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 5, y)
  doc.text(vente.montant_total.toLocaleString() + ' ' + devise, 75, y, { align: 'right' })
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Paye: ' + vente.montant_paye.toLocaleString() + ' ' + devise, 5, y); y += 5
  if (vente.montant_rendu > 0) {
    doc.text('Rendu: ' + vente.montant_rendu.toLocaleString() + ' ' + devise, 5, y); y += 5
  }
  doc.text('Mode: ' + vente.mode_paiement, 5, y); y += 8

  doc.setTextColor(194, 65, 12)
  doc.text('Merci !', 40, y, { align: 'center' })

  return doc
}
