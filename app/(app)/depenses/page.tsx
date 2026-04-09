import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMoisActuel } from '@/lib/utils'
import DepensesClient from './DepensesClient'

export default async function DepensesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const mois = getMoisActuel()

  const { data: depenses } = await supabase
    .from('depenses')
    .select('*')
    .eq('user_id', user!.id)
    .eq('mois', mois)
    .order('date', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('devise')
    .eq('id', user!.id)
    .single()

  return (
    <DepensesClient
      depensesInitiales={depenses || []}
      mois={mois}
      devise={profile?.devise || 'FCFA'}
      userId={user!.id}
    />
  )
}
