import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function FamillePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membres } = await supabase
    .from('famille_membres')
    .select('*, familles(*)')
    .eq('user_id', user!.id)

  const familles = (membres || []).map((m: any) => m.familles).filter(Boolean)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-800 dark:text-brand-200" style={{ fontFamily: "Georgia, serif" }}>
            👨‍👩‍👧‍👦 Mes Familles
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suivez les finances de vos familles</p>
        </div>
        <Link href="/famille/nouvelle" className="btn-primary px-4 py-2 text-sm">+ Nouvelle</Link>
      </div>

      {familles.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="font-semibold text-gray-700 mb-2">Aucune famille</h3>
          <p className="text-gray-500 text-sm mb-6">Créez votre première famille pour commencer le suivi</p>
          <Link href="/famille/nouvelle" className="btn-primary inline-block">Créer une famille</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {familles.map((f: any) => (
            <Link key={f.id} href={"/famille/" + f.id}>
              <div className="card hover:shadow-md transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">👨‍👩‍👧‍👦</div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{f.nom}</h3>
                      {f.description && <p className="text-gray-500 text-sm">{f.description}</p>}
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
