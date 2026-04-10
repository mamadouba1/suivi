import { createServerSupabaseClient } from '@/lib/supabase-server'

const MODULES = [
  { href: '/famille', icon: '👨‍👩‍👧‍👦', label: 'Famille', description: 'Gérez vos dépenses en famille' },
  { href: '/boutique', icon: '🛍️', label: 'Boutiques', description: 'Suivi de vos boutiques' },
  { href: '/projets', icon: '📋', label: 'Projets', description: 'Vos projets en cours' },
  { href: '/parrainage', icon: '🤝', label: 'Parrainer', description: 'Parrainez vos proches' },
  { href: '/soutien', icon: '❤️', label: 'Soutenir', description: 'Soutenez l\'application' },
  { href: '/parametres', icon: '⚙️', label: 'Paramètres', description: 'Gérez votre compte' },
]

export default async function AccueilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single()
  const prenom = profile?.full_name?.split(' ')[0] || ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>
          Bonjour{prenom ? `, ${prenom}` : ''} 👋
        </h2>
        <p className="text-sm text-gray-500">Que souhaitez-vous faire ?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {MODULES.map(({ href, icon, label, description }) => (
          <a key={href} href={href}
            className="card flex flex-col items-start gap-2 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer border border-transparent">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
