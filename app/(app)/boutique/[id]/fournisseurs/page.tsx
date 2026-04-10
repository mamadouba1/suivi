import { createServerSupabaseClient } from '@/lib/supabase-server'
import FournisseursClient from './FournisseursClient'
import { notFound } from 'next/navigation'

export default async function FournisseursPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()
  const { data: fournisseurs } = await supabase
    .from('fournisseurs').select('*').eq('boutique_id', params.id).order('nom')
  const { data: produits } = await supabase
    .from('produits').select('*').eq('boutique_id', params.id).order('nom')
  const { data: reappros } = await supabase
    .from('reappros').select('*, fournisseurs(nom)').eq('boutique_id', params.id)
    .order('date', { ascending: false }).limit(20)
  return <FournisseursClient boutique={boutique} fournisseurs={fournisseurs || []} produits={produits || []} reappros={reappros || []} />
}
