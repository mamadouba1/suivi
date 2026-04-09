import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import BoutiqueActions from './BoutiqueActions'

export default async function BoutiqueDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()

  const { data: produits } = await supabase.from('produits').select('*').eq('boutique_id', params.id)
  const { data: ventes } = await supabase.from('ventes').select('*').eq('boutique_id', params.id)
  const { data: depenses } = await supabase.from('depenses_boutique').select('*').eq('boutique_id', params.id)
  const { data: clients } = await supabase.from('clients').select('*').eq('boutique_id', params.id)

  const totalVentes = (ventes || []).reduce((s: number, v: any) => s + v.montant_paye, 0)
  const totalDepenses = (depenses || []).reduce((s: number, d: any) => s + d.montant, 0)
  const benefice = totalVentes - totalDepenses
  const stockAlerte = (produits || []).filter((p: any) => p.stock <= p.stock_alerte)
  const dettes = (clients || []).reduce((s: number, c: any) => s + c.dette, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/boutique" className="text-brand-600 text-sm hover:underline">← Mes boutiques</Link>
        <BoutiqueActions boutiqueId={params.id} />
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🏪</span>
          <div>
            <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>{boutique.nom}</h1>
            {boutique.adresse && <p className="text-gray-500 text-sm">📍 {boutique.adresse}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Ventes totales</p>
          <p className="font-bold text-green-600">{totalVentes.toLocaleString()} {boutique.devise}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Depenses</p>
          <p className="font-bold text-red-600">{totalDepenses.toLocaleString()} {boutique.devise}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Benefice net</p>
          <p className={"font-bold " + (benefice >= 0 ? "text-brand-600" : "text-red-600")}>{benefice.toLocaleString()} {boutique.devise}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Dettes clients</p>
          <p className="font-bold text-orange-500">{dettes.toLocaleString()} {boutique.devise}</p>
        </div>
      </div>

      {stockAlerte.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-orange-700 font-medium text-sm">⚠️ {stockAlerte.length} produit(s) en stock faible !</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href={"/boutique/" + params.id + "/vente"} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">🛒</div>
          <p className="font-semibold text-gray-700">Nouvelle vente</p>
          <p className="text-xs text-gray-400 mt-1">{(ventes || []).length} ventes</p>
        </Link>
        <Link href={"/boutique/" + params.id + "/produits"} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">📦</div>
          <p className="font-semibold text-gray-700">Produits</p>
          <p className="text-xs text-gray-400 mt-1">{(produits || []).length} articles</p>
        </Link>
        <Link href={"/boutique/" + params.id + "/clients"} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">👥</div>
          <p className="font-semibold text-gray-700">Clients</p>
          <p className="text-xs text-gray-400 mt-1">{(clients || []).length} clients</p>
        </Link>
        <Link href={"/boutique/" + params.id + "/depenses"} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">💸</div>
          <p className="font-semibold text-gray-700">Depenses</p>
          <p className="text-xs text-gray-400 mt-1">{(depenses || []).length} depenses</p>
        </Link>
        <Link href={"/boutique/" + params.id + "/rapports"} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">📊</div>
          <p className="font-semibold text-gray-700">Rapports</p>
          <p className="text-xs text-gray-400 mt-1">Analyse mensuelle</p>
        </Link>
        <Link href={"/boutique/" + params.id + "/caisse"} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">💰</div>
          <p className="font-semibold text-gray-700">Caisse du jour</p>
          <p className="text-xs text-gray-400 mt-1">Rapport journalier</p>
        </Link>
      </div>
    </div>
  )
}
