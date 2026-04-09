import { LangueProvider } from '@/lib/langue-context'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suivi Dépenses Familiales',
  description: 'Gérez vos dépenses familiales simplement',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body><LangueProvider>{children}</LangueProvider></body>
    </html>
  )
}
