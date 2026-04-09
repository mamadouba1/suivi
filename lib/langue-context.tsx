'use client'
import { createContext, useContext, useState, useEffect } from 'react'

export type Langue = 'fr' | 'en' | 'wo'

const TRADUCTIONS: Record<Langue, Record<string, string>> = {
  fr: {
    dashboard: 'Tableau de bord', depenses: 'Depenses', entrees: 'Revenus',
    historique: 'Historique', profil: 'Mon profil', boutique: 'Boutique',
    projets: 'Projets', parrainage: 'Parrainer', soutien: 'Soutenir',
    deconnexion: 'Deconnexion', langue: 'Langue',
  },
  en: {
    dashboard: 'Dashboard', depenses: 'Expenses', entrees: 'Income',
    historique: 'History', profil: 'My Profile', boutique: 'Shop',
    projets: 'Projects', parrainage: 'Refer', soutien: 'Support',
    deconnexion: 'Logout', langue: 'Language',
  },
  wo: {
    dashboard: 'Xam-xam', depenses: 'Jëfandikoo', entrees: 'Xaalis bi',
    historique: 'Waxtu ji', profil: 'Sa yoon', boutique: 'Bitik',
    projets: 'Liggey', parrainage: 'Woo xarit', soutien: 'Dëgg',
    deconnexion: 'Dem fi', langue: 'Lakk',
  }
}

interface LangueContextType {
  langue: Langue
  setLangue: (l: Langue) => void
  tr: (key: string) => string
}

const LangueContext = createContext<LangueContextType>({
  langue: 'fr',
  setLangue: () => {},
  tr: (k) => k,
})

export function LangueProvider({ children }: { children: React.ReactNode }) {
  const [langue, setLangueState] = useState<Langue>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('langue') as Langue
    if (saved && ['fr', 'en', 'wo'].includes(saved)) setLangueState(saved)
  }, [])

  function setLangue(l: Langue) {
    setLangueState(l)
    localStorage.setItem('langue', l)
  }

  function tr(key: string) {
    return TRADUCTIONS[langue]?.[key] || TRADUCTIONS['fr'][key] || key
  }

  return (
    <LangueContext.Provider value={{ langue, setLangue, tr }}>
      {children}
    </LangueContext.Provider>
  )
}

export function useLangue() {
  return useContext(LangueContext)
}
