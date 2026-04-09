import { createServerSupabaseClient } from '@/lib/supabase-server'
import ClientsClient from './ClientsClient'
import { notFound } from 'next/navigation'

export default async function ClientsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()
  const { data: clients } = await supabase
    .from('clients').select('*').eq('boutique_id', params.id).order('nom')
  return <ClientsClient boutique={boutique} clients={clients || []} />
}
