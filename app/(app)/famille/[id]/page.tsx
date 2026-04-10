import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function FamilleDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membre } = await supabase
    .from('famille_membres')
    .select('*, familles(*)')
    .eq('famille_id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!membre) return notFound()
  const famille = membre.familles as any

  const { data: membres } = await supabase
    .from('famille_membres')
    .select('*, profiles:user_id(full_name)')
    .eq('famille_id', params.id)

  const now = new Date()
  const mois = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0")

  const { data: depenses } = await supabase
    .from('depenses').select('montant_depense')
    .eq('famille_id', params.id).eq('mois', mois)
  const { data: entrees } = await supabase
    .from('entrees').select('montant')
    .eq('famille_id', params.id).eq('mois', mois)

  const totalDepenses = (depenses || []).reduce((s: number, d: any) => s + (d.montant_depense || 0), 0)
  const totalEntrees = (entrees || []).reduce((s: number, e: any) => s + (e.montant || 0), 0)
  const solde = totalEntrees - totalDepenses

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/famille" className="text-brand-600 text-sm hover:underline">← Mes familles</Link>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">👨‍👩‍👧‍👦</span>
          <div>
            <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>{famille.nom}</h1>
            {famille.description && <p className="text-gray-500 text-sm">{famille.description}</p>}
          </div>
        </div>
        <p className="text-xs text-gray-400">{(membres || []).length} membre(s)</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Revenus</p>
          <p className="font-bold text-green-600 text-sm">{totalEntrees.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Dépenses</p>
          <p className="font-bold text-red-600 text-sm">{totalDepenses.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Solde</p>
          <p className={"font-bold text-sm " + (solde >= 0 ? "text-brand-600" : "text-red-600")}>{solde.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href={"/dashboard?famille=" + params.id} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">📊</div>
          <p className="font-semibold text-gray-700">Tableau de bord</p>
        </Link>
        <Link href={"/depenses?famille=" + params.id} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">💸</div>
          <p className="font-semibold text-gray-700">Dépenses</p>
        </Link>
        <Link href={"/entrees?famille=" + params.id} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">💰</div>
          <p className="font-semibold text-gray-700">Revenus</p>
        </Link>
        <Link href={"/historique?famille=" + params.id} className="card text-center hover:shadow-md transition cursor-pointer">
          <div className="text-3xl mb-2">📅</div>
          <p className="font-semibold text-gray-700">Historique</p>
        </Link>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">👥 Membres</h3>
        <div className="space-y-2">
          {(membres || []).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
                  {(m.profiles?.full_name || 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">{m.profiles?.full_name || 'Membre'}</span>
              </div>
              <span className={"text-xs px-2 py-0.5 rounded-full " + (m.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600')}>
                {m.role === 'admin' ? 'Admin' : 'Membre'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
