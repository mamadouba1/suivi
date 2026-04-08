import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getListeMois, formatMontant, formatMois } from '@/lib/utils'
import Link from 'next/link'

export default async function HistoriquePage({ searchParams }: { searchParams: { mois?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const moisList = getListeMois(12)
  const moisSelectionne = searchParams.mois || moisList[0].key

  const [{ data: depenses }, { data: entrees }, { data: profile }] = await Promise.all([
    supabase.from('depenses').select('*').eq('user_id', user!.id).eq('mois', moisSelectionne).order('date', { ascending: false }),
    supabase.from('entrees').select('*').eq('user_id', user!.id).eq('mois', moisSelectionne).order('date', { ascending: false }),
    supabase.from('profiles').select('devise').eq('id', user!.id).single(),
  ])

  const devise = profile?.devise || 'FCFA'
  const totalD = (depenses || []).reduce((s, d) => s + d.montant_depense, 0)
  const totalE = (entrees || []).reduce((s, e) => s + e.montant, 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>Historique</h2>
        <p className="text-sm text-gray-500">Consultez vos données mois par mois</p>
      </div>

      {/* Sélecteur de mois */}
      <div className="flex gap-2 flex-wrap">
        {moisList.map(({ key, label }) => (
          <Link key={key} href={`/historique?mois=${key}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              moisSelectionne === key
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            }`}>
            {label}
          </Link>
        ))}
      </div>

      {/* Résumé du mois */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Revenus</p>
          <p className="font-bold text-sage-600 text-sm">{formatMontant(totalE, devise)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Dépenses</p>
          <p className="font-bold text-brand-600 text-sm">{formatMontant(totalD, devise)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Solde</p>
          <p className={`font-bold text-sm ${totalE - totalD >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatMontant(totalE - totalD, devise)}
          </p>
        </div>
      </div>

      {/* Dépenses */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">💸 Dépenses ({(depenses || []).length})</h3>
        {(depenses || []).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Aucune dépense ce mois</p>
        ) : (
          <div className="space-y-2">
            {(depenses || []).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{d.libelle}</p>
                  <p className="text-xs text-gray-400">{d.type} · {d.date}</p>
                </div>
                <span className="text-sm font-bold text-brand-600">{formatMontant(d.montant_depense, devise)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entrées */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">💰 Revenus ({(entrees || []).length})</h3>
        {(entrees || []).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Aucun revenu ce mois</p>
        ) : (
          <div className="space-y-2">
            {(entrees || []).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{e.personne}</p>
                  <p className="text-xs text-gray-400">{e.date}</p>
                </div>
                <span className="text-sm font-bold text-sage-600">{formatMontant(e.montant, devise)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
