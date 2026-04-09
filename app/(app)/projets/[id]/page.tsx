import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProjetDetailClient from './ProjetDetailClient'
import { notFound } from 'next/navigation'

export default async function ProjetDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projet } = await supabase
    .from('projets')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!projet) return notFound()

  const { data: transactions } = await supabase
    .from('projet_transactions')
    .select('*')
    .eq('projet_id', params.id)
    .order('date', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('devise')
    .eq('id', user!.id)
    .single()

  return (
    <ProjetDetailClient
      projet={projet}
      transactions={transactions || []}
      devise={profile?.devise || 'FCFA'}
    />
  )
}
