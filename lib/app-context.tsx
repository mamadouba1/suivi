'use client'
import { createContext, useContext, useState, useEffect } from 'react'

export type Langue = 'fr' | 'en' | 'wo'
export type Theme = 'light' | 'dark' | 'system'

const TRADUCTIONS: Record<Langue, Record<string, string>> = {
  fr: {
    famille: 'Famille', boutique: 'Boutiques', projets: 'Projets',
    parametres: 'Paramètres', parrainage: 'Parrainer', soutien: 'Soutenir',
    dashboard: 'Tableau de bord', depenses: 'Dépenses', entrees: 'Revenus',
    historique: 'Historique', profil: 'Profil', langue: 'Langue',
    theme: 'Thème', deconnexion: 'Déconnexion', ajouter: 'Ajouter',
    modifier: 'Modifier', supprimer: 'Supprimer', enregistrer: 'Enregistrer',
    annuler: 'Annuler', total: 'Total', a_propos: 'À propos',
    vider_cache: 'Vider le cache', mode_sombre: 'Mode sombre',
    mode_clair: 'Mode clair', mode_systeme: 'Système',
    nouvelle_famille: 'Nouvelle famille', mes_familles: 'Mes familles',
    membres: 'Membres', inviter: 'Inviter un membre',
    bienvenue: 'Bienvenue', version: 'Version',
  },
  en: {
    famille: 'Family', boutique: 'Shops', projets: 'Projects',
    parametres: 'Settings', parrainage: 'Refer', soutien: 'Support',
    dashboard: 'Dashboard', depenses: 'Expenses', entrees: 'Income',
    historique: 'History', profil: 'Profile', langue: 'Language',
    theme: 'Theme', deconnexion: 'Logout', ajouter: 'Add',
    modifier: 'Edit', supprimer: 'Delete', enregistrer: 'Save',
    annuler: 'Cancel', total: 'Total', a_propos: 'About',
    vider_cache: 'Clear cache', mode_sombre: 'Dark mode',
    mode_clair: 'Light mode', mode_systeme: 'System',
    nouvelle_famille: 'New family', mes_familles: 'My families',
    membres: 'Members', inviter: 'Invite member',
    bienvenue: 'Welcome', version: 'Version',
  },
  wo: {
    famille: 'Mbokk', boutique: 'Bitik', projets: 'Liggey',
    parametres: 'Sett yi', parrainage: 'Woo xarit', soutien: 'Dëgg',
    dashboard: 'Xam-xam', depenses: 'Jëfandikoo', entrees: 'Xaalis',
    historique: 'Waxtu', profil: 'Sa yoon', langue: 'Lakk',
    theme: 'Rëdd', deconnexion: 'Dem fi', ajouter: 'Yokk',
    modifier: 'Soppiku', supprimer: 'Dëj', enregistrer: 'Bind',
    annuler: 'Anu', total: 'Tëdd', a_propos: 'Ci kanam',
    vider_cache: 'Dëj cache', mode_sombre: 'Guddi',
    mode_clair: 'Ceebu', mode_systeme: 'Telefon bi',
    nouvelle_famille: 'Mbokk bu bees', mes_familles: 'Sunu mbokk yi',
    membres: 'Nit yi', inviter: 'Woo nit',
    bienvenue: 'Dalal ak jamm', version: 'Version',
  }
}

interface AppContextType {
  langue: Langue
  setLangue: (l: Langue) => void
  theme: Theme
  setTheme: (t: Theme) => void
  isDark: boolean
  tr: (key: string) => string
}

const AppContext = createContext<AppContextType>({
  langue: 'fr', setLangue: () => {},
  theme: 'system', setTheme: () => {},
  isDark: false,
  tr: (k) => k,
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [langue, setLangueState] = useState<Langue>('fr')
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedLangue = localStorage.getItem('langue') as Langue
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedLangue && ['fr','en','wo'].includes(savedLangue)) setLangueState(savedLangue)
    if (savedTheme && ['light','dark','system'].includes(savedTheme)) setThemeState(savedTheme)
  }, [])

  useEffect(() => {
    const updateDark = () => {
      if (theme === 'dark') setIsDark(true)
      else if (theme === 'light') setIsDark(false)
      else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    updateDark()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', updateDark)
    return () => mq.removeEventListener('change', updateDark)
  }, [theme])

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDark])

  function setLangue(l: Langue) {
    setLangueState(l)
    localStorage.setItem('langue', l)
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('theme', t)
  }

  function tr(key: string) {
    return TRADUCTIONS[langue]?.[key] || TRADUCTIONS['fr'][key] || key
  }

  return (
    <AppContext.Provider value={{ langue, setLangue, theme, setTheme, isDark, tr }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
