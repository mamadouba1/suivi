import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMoisActuel } from '@/lib/utils'
import EntreesClient from './EntreesClient'

export default async function EntreesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const mois = getMoisActuel()

  const { data: entrees } = await supabase
    .from('entrees')
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
    <EntreesClient
      entreesInitiales={entrees || []}
      mois={mois}
      devise={profile?.devise || 'FCFA'}
      userId={user!.id}
    />
  )
}
