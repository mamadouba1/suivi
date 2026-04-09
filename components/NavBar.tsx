'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const LINKS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { href: '/depenses', label: 'Dépenses', icon: '💸' },
  { href: '/entrees', label: 'Entrées', icon: '💰' },
  { href: '/historique', label: 'Historique', icon: '📅' },
  { href: '/profil', label: 'Mon profil', icon: '👤' },
  { href: '/projets', label: 'Projets', icon: '🏗️' },
  { href: '/parrainage', label: 'Parrainer', icon: '🤝' },
  { href: '/soutien', label: 'Soutenir', icon: '❤️' },
]

const MOBILE_LINKS = [
  { href: '/dashboard', label: 'Accueil', icon: '📊' },
  { href: '/depenses', label: 'Dépenses', icon: '💸' },
  { href: '/entrees', label: 'Entrées', icon: '💰' },
  { href: '/historique', label: 'Historique', icon: '📅' },
  { href: '/projets', label: 'Projets', icon: '🏗️' },
  { href: '/parrainage', label: 'Parrainer', icon: '🤝' },
  { href: '/soutien', label: 'Soutenir', icon: '❤️' },
]

export default function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col bg-white border-r border-brand-100 shadow-sm z-20">
        <div className="p-5 border-b border-brand-100">
          <div className="text-2xl mb-1">💰</div>
          <h1 className="font-bold text-brand-800 text-lg leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Suivi Dépenses
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{userName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-brand-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-100 z-20 flex items-center justify-around px-1 py-2 overflow-x-auto">
        {MOBILE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
              pathname === link.href ? 'text-brand-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{link.icon}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium text-gray-400 flex-shrink-0"
        >
          <span className="text-xl">🚪</span>
        </button>
      </nav>
    </>
  )
}
