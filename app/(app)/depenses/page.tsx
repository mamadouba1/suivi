import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMoisActuel } from '@/lib/utils'
import DepensesClient from './DepensesClient'
import Link from 'next/link'

export default async function DepensesPage({ searchParams }: { searchParams: { famille?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const mois = getMoisActuel()
  const familleId = searchParams.famille || null

  const { data: depenses } = await supabase
    .from('depenses').select('*')
    .eq('user_id', user!.id).eq('mois', mois)
    .order('date', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles').select('devise').eq('id', user!.id).single()

  let familleNom = ''
  if (familleId) {
    const { data: f } = await supabase.from('familles').select('nom').eq('id', familleId).single()
    familleNom = f?.nom || ''
  }

  return (
    <div>
      {familleId && (
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <Link href={'/famille/' + familleId}
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">
            ← Retour à {familleNom || 'la famille'}
          </Link>
        </div>
      )}
      <DepensesClient
        depensesInitiales={depenses || []}
        mois={mois}
        devise={profile?.devise || 'FCFA'}
        userId={user!.id}
      />
    </div>
  )
}
