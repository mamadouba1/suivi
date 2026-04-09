export default function SoutienPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">❤️</div>
        <h1 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>
          Soutenir le projet
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Suivi Dépenses est une application gratuite développée avec passion. Votre soutien nous aide à continuer.
        </p>
      </div>

      <div className="card mb-4">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">📲</div>
          <p className="font-semibold text-gray-700 mb-1">Envoyer un soutien via mobile money</p>
          <p className="text-gray-500 text-sm">Ce numéro est disponible sur Wave et Orange Money</p>
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-xl px-6 py-4 text-center">
          <p className="text-3xl font-bold text-brand-700 tracking-widest">+221 77 324 49 72</p>
          <div className="flex justify-center gap-3 mt-3">
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">💙 Wave</span>
            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">🟠 Orange Money</span>
          </div>
        </div>
      </div>

      <div className="card mb-4 text-center">
        <div className="text-3xl mb-2">🙏</div>
        <p className="text-gray-600 text-sm leading-relaxed">
          Même un petit geste compte énormément. Votre soutien nous motive à améliorer l'application et à ajouter de nouvelles fonctionnalités.
        </p>
      </div>

      <div className="card text-center">
        <p className="text-gray-500 text-xs">
          Merci de faire confiance à Suivi Dépenses pour la gestion de vos finances familiales. 💰
        </p>
      </div>
    </main>
  )
}
