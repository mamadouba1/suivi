import { createServerSupabaseClient } from '@/lib/supabase-server'
import ObjectifsClient from './ObjectifsClient'
import { notFound } from 'next/navigation'

export default async function ObjectifsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: boutique } = await supabase
    .from('boutiques').select('*').eq('id', params.id).eq('user_id', user!.id).single()
  if (!boutique) return notFound()

  const now = new Date()
  const mois = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0")
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const { data: objectif } = await supabase
    .from('objectifs').select('*').eq('boutique_id', params.id).eq('mois', mois).single()
  const { data: ventes } = await supabase
    .from('ventes').select('montant_paye')
    .eq('boutique_id', params.id)
    .gte('created_at', firstDay).lte('created_at', lastDay)
  const { data: depenses } = await supabase
    .from('depenses_boutique').select('montant')
    .eq('boutique_id', params.id)
    .gte('date', firstDay.split("T")[0]).lte('date', lastDay.split("T")[0])

  const totalVentes = (ventes || []).reduce((s: number, v: any) => s + v.montant_paye, 0)
  const totalDepenses = (depenses || []).reduce((s: number, d: any) => s + d.montant, 0)
  const benefice = totalVentes - totalDepenses

  return <ObjectifsClient boutique={boutique} objectif={objectif} mois={mois}
    totalVentes={totalVentes} benefice={benefice} />
}
