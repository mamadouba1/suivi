import { createServerSupabaseClient } from '@/lib/supabase-server'
import VenteClient from './VenteClient'
import { notFound } from 'next/navigation'

export default async function VentePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()

  const { data: produits } = await supabase
    .from('produits').select('*').eq('boutique_id', params.id).eq('actif', true).order('nom')

  const { data: clients } = await supabase
    .from('clients').select('*').eq('boutique_id', params.id).order('nom')

  const { data: ventes } = await supabase
    .from('ventes').select('*, vente_items(*)').eq('boutique_id', params.id)
    .order('created_at', { ascending: false }).limit(20)

  return <VenteClient boutique={boutique} produits={produits || []} clients={clients || []} ventes={ventes || []} />
}
