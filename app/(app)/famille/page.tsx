import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import RejoindreForm from './RejoindreForm'

export default async function FamillePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membres } = await supabase
    .from('famille_membres')
    .select('famille_id, role, familles(*)')
    .eq('user_id', user!.id)

  const familles = (membres || []).map((m: any) => ({ ...m.familles, monRole: m.role })).filter(Boolean)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-800 dark:text-brand-200" style={{ fontFamily: 'Georgia, serif' }}>
            👨‍👩‍👧‍👦 Mes Familles
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gérez vos finances familiales</p>
        </div>
        <Link href="/famille/nouvelle"
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition">
          + Nouvelle
        </Link>
      </div>

      {familles.length === 0 ? (
        <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-14">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucune famille</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Créez ou rejoignez une famille pour commencer</p>
          <Link href="/famille/nouvelle" className="inline-block px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition">
            Créer une famille
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {familles.map((f: any) => (
            <Link key={f.id} href={'/famille/' + f.id}>
              <div className="card dark:bg-gray-800 dark:border-gray-700 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center text-2xl">👨‍👩‍👧‍👦</div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{f.nom}</h3>
                      {f.description && <p className="text-gray-500 dark:text-gray-400 text-xs">{f.description}</p>}
                      <span className={'text-xs mt-0.5 inline-block ' + (f.monRole === 'admin' ? 'text-amber-500' : 'text-gray-400')}>
                        {f.monRole === 'admin' ? '👑 Admin' : '👁 Membre'}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 text-xl">›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Rejoindre avec un code */}
      <RejoindreForm userId={user!.id} />
    </div>
  )
}
