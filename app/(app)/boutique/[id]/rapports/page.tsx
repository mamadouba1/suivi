import { createServerSupabaseClient } from '@/lib/supabase-server'
import RapportClient from './RapportClient'
import { notFound } from 'next/navigation'

export default async function RapportPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const { data: ventes } = await supabase
    .from('ventes').select('*, vente_items(*)')
    .eq('boutique_id', params.id)
    .gte('created_at', firstDay).lte('created_at', lastDay)
    .order('created_at')

  const { data: depenses } = await supabase
    .from('depenses_boutique').select('*')
    .eq('boutique_id', params.id)
    .gte('date', firstDay.split('T')[0]).lte('date', lastDay.split('T')[0])

  return <RapportClient boutique={boutique} ventes={ventes || []} depenses={depenses || []} />
}
