import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function BoutiquePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: boutiques } = await supabase
    .from('boutiques')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>
            Mes Boutiques
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gerez vos boutiques et commerces</p>
        </div>
        <Link href="/boutique/nouvelle" className="btn-primary px-4 py-2 text-sm">+ Nouvelle</Link>
      </div>

      {(!boutiques || boutiques.length === 0) ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="font-semibold text-gray-700 mb-2">Aucune boutique</h3>
          <p className="text-gray-500 text-sm mb-6">Creez votre premiere boutique pour commencer</p>
          <Link href="/boutique/nouvelle" className="btn-primary inline-block">Creer une boutique</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {boutiques.map((b: any) => (
            <Link key={b.id} href={"/boutique/" + b.id}>
              <div className="card hover:shadow-md transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">🏪</div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{b.nom}</h3>
                      {b.adresse && <p className="text-gray-500 text-sm">📍 {b.adresse}</p>}
                      {b.telephone && <p className="text-gray-500 text-sm">📞 {b.telephone}</p>}
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
