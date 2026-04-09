import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProfilClient from './ProfilClient'

export default async function ProfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <ProfilClient
      userId={user!.id}
      email={user!.email || ''}
      fullName={profile?.full_name || ''}
      devise={profile?.devise || 'FCFA'}
    />
  )
}
