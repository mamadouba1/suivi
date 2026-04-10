import { AppProvider } from '@/lib/app-context'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suivi Dépenses',
  description: 'Gérez vos finances familiales et votre boutique',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
