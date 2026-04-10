import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMoisActuel } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({ searchParams }: { searchParams: { famille?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const mois = getMoisActuel()
  const familleId = searchParams.famille

  let depenses, entrees, profile, familleName

  if (familleId) {
    // Mode famille : filtrer par famille_id
    const [{ data: d }, { data: e }, { data: p }, { data: f }] = await Promise.all([
      supabase.from('depenses').select('*').eq('famille_id', familleId).eq('mois', mois),
      supabase.from('entrees').select('*').eq('famille_id', familleId).eq('mois', mois),
      supabase.from('profiles').select('full_name, devise').eq('id', user!.id).single(),
      supabase.from('familles').select('nom').eq('id', familleId).single(),
    ])
    depenses = d; entrees = e; profile = p; familleName = f?.nom
  } else {
    // Mode personnel : filtrer par user_id
    const [{ data: d }, { data: e }, { data: p }] = await Promise.all([
      supabase.from('depenses').select('*').eq('user_id', user!.id).eq('mois', mois),
      supabase.from('entrees').select('*').eq('user_id', user!.id).eq('mois', mois),
      supabase.from('profiles').select('full_name, devise').eq('id', user!.id).single(),
    ])
    depenses = d; entrees = e; profile = p
  }

  const totalDepenses = (depenses || []).reduce((s, d) => s + (d.montant_depense || 0), 0)
  const totalEntrees = (entrees || []).reduce((s, e) => s + (e.montant || 0), 0)
  const solde = totalEntrees - totalDepenses
  const devise = profile?.devise || 'FCFA'

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
      familleId={familleId}
      familleName={familleName}
    />
  )
}
