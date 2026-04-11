'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/app-context'

export default function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const { tr } = useApp()

  const LINKS = [
    { href: '/accueil', label: 'Accueil', icon: '🏠' },
    { href: '/famille', label: tr('famille'), icon: '👨‍👩‍👧‍👦' },
    { href: '/boutique', label: tr('boutique'), icon: '🏪' },
    { href: '/projets', label: tr('projets'), icon: '🏗️' },
    { href: '/parrainage', label: tr('parrainage'), icon: '🤝' },
    { href: '/soutien', label: tr('soutien'), icon: '❤️' },
    { href: '/parametres', label: tr('parametres'), icon: '⚙️' },
  ]

  const MOBILE_LINKS = [
    { href: '/accueil', label: 'Accueil', icon: '🏠' },
    { href: '/famille', label: tr('famille'), icon: '👨‍👩‍👧‍👦' },
    { href: '/boutique', label: tr('boutique'), icon: '🏪' },
    { href: '/projets', label: tr('projets'), icon: '🏗️' },
    { href: '/parametres', label: tr('parametres'), icon: '⚙️' },
  ]

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col bg-white dark:bg-gray-800 border-r border-brand-100 dark:border-gray-700 shadow-sm z-20">
        <div className="p-5 border-b border-brand-100 dark:border-gray-700">
          <img src="/logo.jpg" alt="Suivi" className="w-12 h-12 rounded-full object-cover object-center mb-1 bg-transparent" />
          <h1 className="font-bold text-brand-800 dark:text-brand-200 text-lg leading-tight" style={{ fontFamily: "Georgia, serif" }}>
            Suivi Dépenses
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{userName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " +
                (pathname === link.href || (link.href !== '/accueil' && pathname.startsWith(link.href))
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-700 hover:text-brand-700')}>
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-brand-100 dark:border-gray-700 z-20 flex items-center justify-around px-1 py-2">
        {MOBILE_LINKS.map((link) => (
          <Link key={link.href} href={link.href}
            className={"flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-medium transition-all flex-shrink-0 " +
              (pathname === link.href || (link.href !== '/accueil' && pathname.startsWith(link.href))
                ? 'text-brand-600' : 'text-gray-400 dark:text-gray-500')}>
            <span className="text-xl">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
