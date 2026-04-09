import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProduitsClient from './ProduitsClient'
import { notFound } from 'next/navigation'

export default async function ProduitsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()

  const { data: produits } = await supabase
    .from('produits').select('*').eq('boutique_id', params.id).order('nom')

  return <ProduitsClient boutique={boutique} produits={produits || []} />
}
