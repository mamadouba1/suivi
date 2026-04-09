import { createServerSupabaseClient } from '@/lib/supabase-server'
import DepensesClient from './DepensesClient'
import { notFound } from 'next/navigation'

export default async function DepensesBoutiquePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()
  const { data: depenses } = await supabase
    .from('depenses_boutique').select('*').eq('boutique_id', params.id)
    .order('date', { ascending: false })
  return <DepensesClient boutique={boutique} depenses={depenses || []} />
}
