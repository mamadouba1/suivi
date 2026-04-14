import { createServerSupabaseClient } from '@/lib/supabase-server'
import RetourClient from './RetourClient'
import { notFound } from 'next/navigation'

export default async function RetourPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!boutique) return notFound()

  // Récupérer les ventes avec leurs items, exclure les déjà retournées
  const { data: ventes } = await supabase
    .from('ventes')
    .select('*, vente_items(*)')
    .eq('boutique_id', params.id)
    .neq('statut', 'retournee')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <RetourClient
      boutique={boutique}
      ventes={ventes || []}
    />
  )
}
