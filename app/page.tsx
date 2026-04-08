import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #f9e8d0 100%)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-4xl font-bold text-brand-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Suivi Dépenses
        </h1>
        <p className="text-gray-600 text-lg mb-2">Gérez les finances de votre famille</p>
        <p className="text-brand-600 text-sm mb-8">Conçu pour les familles sénégalaises 🇸🇳</p>

        <div className="flex flex-col gap-3">
          <Link href="/auth/register" className="btn-primary text-center block text-lg py-3">
            Créer mon compte
          </Link>
          <Link href="/auth/login" className="btn-secondary text-center block">
            J&apos;ai déjà un compte
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
          <div>
            <div className="text-2xl mb-1">📊</div>
            <p>Tableau de bord</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📅</div>
            <p>Suivi mensuel</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📧</div>
            <p>Récap par email</p>
          </div>
        </div>
      </div>
    </main>
  )
}
