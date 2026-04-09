import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function ProjetsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projets } = await supabase
    .from('projets')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('devise')
    .eq('id', user!.id)
    .single()

  const devise = profile?.devise || 'FCFA'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>
            Mes Projets
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suivez vos projets et leur evolution financiere</p>
        </div>
        <Link href="/projets/nouveau" className="btn-primary px-4 py-2 text-sm">
          + Nouveau
        </Link>
      </div>

      {(!projets || projets.length === 0) ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🏗️</div>
          <h3 className="font-semibold text-gray-700 mb-2">Aucun projet pour le moment</h3>
          <p className="text-gray-500 text-sm mb-6">Creez votre premier projet pour commencer le suivi</p>
          <Link href="/projets/nouveau" className="btn-primary inline-block">
            Creer un projet
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projets.map((projet: any) => {
            const statut = projet.statut === 'termine' ? '✅' : projet.statut === 'pause' ? '⏸️' : '🔄'
            return (
              <Link key={projet.id} href={"/projets/" + projet.id}>
                <div className="card hover:shadow-md transition cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{statut}</span>
                        <h3 className="font-semibold text-gray-800">{projet.nom}</h3>
                      </div>
                      {projet.description && (
                        <p className="text-gray-500 text-sm mb-2">{projet.description}</p>
                      )}
                      {projet.objectif_montant > 0 && (
                        <p className="text-xs text-brand-600 font-medium">
                          Objectif : {projet.objectif_montant.toLocaleString()} {devise}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-400 text-xl">›</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
