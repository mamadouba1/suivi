import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMoisActuel, formatMontant, formatMois } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const mois = getMoisActuel()

  const [{ data: depenses }, { data: entrees }, { data: profile }] = await Promise.all([
    supabase.from('depenses').select('*').eq('user_id', user!.id).eq('mois', mois),
    supabase.from('entrees').select('*').eq('user_id', user!.id).eq('mois', mois),
    supabase.from('profiles').select('full_name, devise').eq('id', user!.id).single(),
  ])

  const totalDepenses = (depenses || []).reduce((s, d) => s + (d.montant_depense || 0), 0)
  const totalEntrees = (entrees || []).reduce((s, e) => s + (e.montant || 0), 0)
  const solde = totalEntrees - totalDepenses
  const devise = profile?.devise || 'FCFA'

  // Grouper dépenses par type pour le graphique
  const parType: Record<string, number> = {}
  for (const d of depenses || []) {
    parType[d.type] = (parType[d.type] || 0) + (d.montant_depense || 0)
  }
  const chartData = Object.entries(parType)
    .map(([type, montant]) => ({ type, montant }))
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 7)

  return (
    <DashboardClient
      mois={mois}
      totalDepenses={totalDepenses}
      totalEntrees={totalEntrees}
      solde={solde}
      devise={devise}
      chartData={chartData}
      depenses={depenses || []}
      entrees={entrees || []}
      userName={profile?.full_name || ''}
    />
  )
}
