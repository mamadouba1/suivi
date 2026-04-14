import { createServerSupabaseClient } from '@/lib/supabase-server'
import RetourClient from './RetourClient'
import { notFound } from 'next/navigation'

export default async function RetoursPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()

  const { data: ventes } = await supabase
    .from('ventes')
    .select('*, vente_items(*), clients(nom)')
    .eq('boutique_id', params.id)
    .neq('statut', 'retournee')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: clients } = await supabase
    .from('clients').select('*').eq('boutique_id', params.id).order('nom')

  return <RetourClient boutique={boutique} ventes={ventes || []} clients={clients || []} />
}
