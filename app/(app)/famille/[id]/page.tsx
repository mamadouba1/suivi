import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FamilleActions from './FamilleActions'

export default async function FamilleDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: famille } = await supabase
    .from('familles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!famille) return notFound()

  const { data: membres } = await supabase
    .from('famille_membres')
    .select('id, role, user_id, created_at')
    .eq('famille_id', params.id)

  const isAdmin = famille.created_by === user.id ||
    (membres || []).some((m: any) => m.user_id === user.id && m.role === 'admin')

  // Récupérer les profils des membres
  const memberIds = (membres || []).map((m: any) => m.user_id)
  const { data: profiles } = memberIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', memberIds)
    : { data: [] }

  const membresAvecProfils = (membres || []).map((m: any) => ({
    ...m,
    profile: (profiles || []).find((p: any) => p.id === m.user_id)
  }))

  const now = new Date()
  const mois = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')

  const { data: depenses } = await supabase.from('depenses').select('montant_depense').eq('famille_id', params.id).eq('mois', mois)
  const { data: entrees } = await supabase.from('entrees').select('montant').eq('famille_id', params.id).eq('mois', mois)

  const totalDepenses = (depenses || []).reduce((s: number, d: any) => s + (d.montant_depense || 0), 0)
  const totalEntrees = (entrees || []).reduce((s: number, e: any) => s + (e.montant || 0), 0)
  const solde = totalEntrees - totalDepenses

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Link href="/famille" className="text-brand-600 dark:text-brand-400 text-sm hover:underline flex items-center gap-1">
        ← Mes familles
      </Link>

      {/* Header famille */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center text-3xl">👨‍👩‍👧‍👦</div>
            <div>
              <h1 className="text-xl font-bold text-brand-800 dark:text-brand-200" style={{ fontFamily: 'Georgia, serif' }}>{famille.nom}</h1>
              {famille.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{famille.description}</p>}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-mono">
                  Code : {famille.code_invitation}
                </span>
                {isAdmin && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">👑 Admin</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats du mois */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Revenus</p>
          <p className="font-bold text-green-600 dark:text-green-400">{totalEntrees.toLocaleString()}</p>
          <p className="text-xs text-gray-400">FCFA</p>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dépenses</p>
          <p className="font-bold text-red-500 dark:text-red-400">{totalDepenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400">FCFA</p>
        </div>
        <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Solde</p>
          <p className={'font-bold ' + (solde >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-500')}>{solde.toLocaleString()}</p>
          <p className="text-xs text-gray-400">FCFA</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: `/dashboard?famille=${params.id}`, icon: '📊', label: 'Tableau de bord' },
          { href: `/depenses?famille=${params.id}`, icon: '💸', label: 'Dépenses' },
          { href: `/entrees?famille=${params.id}`, icon: '💰', label: 'Revenus' },
          { href: `/historique?famille=${params.id}`, icon: '📅', label: 'Historique' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="card dark:bg-gray-800 dark:border-gray-700 flex items-center gap-3 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition cursor-pointer group">
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 text-sm">{item.label}</span>
            <span className="ml-auto text-gray-300 dark:text-gray-600">›</span>
          </Link>
        ))}
      </div>

      {/* Membres + Actions (client component) */}
      <FamilleActions
        familleId={params.id}
        familleNom={famille.nom}
        codeInvitation={famille.code_invitation}
        membres={membresAvecProfils}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
