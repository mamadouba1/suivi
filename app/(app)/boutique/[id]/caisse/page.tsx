import { createServerSupabaseClient } from '@/lib/supabase-server'
import CaisseClient from './CaisseClient'
import { notFound } from 'next/navigation'

export default async function CaissePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()

  const today = new Date().toISOString().split('T')[0]
  const { data: ventes } = await supabase
    .from('ventes')
    .select('*, vente_items(*)')
    .eq('boutique_id', params.id)
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59')
    .order('created_at', { ascending: false })

  const { data: depenses } = await supabase
    .from('depenses_boutique')
    .select('*')
    .eq('boutique_id', params.id)
    .eq('date', today)

  return <CaisseClient boutique={boutique} ventes={ventes || []} depenses={depenses || []} />
}
