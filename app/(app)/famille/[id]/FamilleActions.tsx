'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Membre {
  id: string
  role: string
  user_id: string
  profile?: { full_name?: string }
}

interface Props {
  familleId: string
  familleNom: string
  codeInvitation: string
  membres: Membre[]
  currentUserId: string
  isAdmin: boolean
}

export default function FamilleActions({ familleId, familleNom, codeInvitation, membres, currentUserId, isAdmin }: Props) {
  const router = useRouter()
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const appUrl = 'https://suivi-des-depenses-blond.vercel.app'
  const message = `Salut ! Je t'invite à rejoindre ma famille "${familleNom}" sur Suivi Dépenses.\n\n1️⃣ Crée un compte ici : ${appUrl}/auth/login\n2️⃣ Va dans Famille → Rejoindre avec un code\n3️⃣ Entre le code : *${codeInvitation}*`

  function copyCode() {
    navigator.clipboard.writeText(codeInvitation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  function shareMail() {
    const subject = encodeURIComponent(`Invitation famille "${familleNom}" — Suivi Dépenses`)
    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(message)}`, '_blank')
  }

  function shareSMS() {
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
  }

  function shareNatif() {
    if (navigator.share) {
      navigator.share({ title: `Rejoins ma famille sur Suivi Dépenses`, text: message })
    }
  }

  async function promouvoir(membreId: string, newRole: 'admin' | 'membre') {
    if (!confirm(newRole === 'admin' ? 'Nommer ce membre administrateur ?' : 'Rétrograder en membre simple ?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('famille_membres').update({ role: newRole }).eq('id', membreId)
    setLoading(false)
    router.refresh()
  }

  async function exclure(membreId: string) {
    if (!confirm('Exclure ce membre de la famille ?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('famille_membres').delete().eq('id', membreId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700 space-y-4">

      {/* Header membres */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">
          👥 Membres <span className="text-brand-500 font-bold ml-1">({membres.length})</span>
        </h3>
        <button onClick={() => setShowCode(!showCode)}
          className="text-sm px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-medium transition">
          🔑 Code famille
        </button>
      </div>

      {/* Code invitation */}
      {showCode && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">🔗 Code d'invitation</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Partage ce code à tes proches. Ils devront créer un compte puis rejoindre via <strong>Famille → Rejoindre avec un code</strong>.
            </p>
          </div>

          {/* Code + copier */}
          <div className="flex items-center gap-2">
            <span className="flex-1 bg-white dark:bg-gray-700 border border-brand-200 dark:border-gray-600 rounded-xl px-4 py-3 font-mono text-brand-700 dark:text-brand-300 text-2xl font-bold tracking-widest text-center">
              {codeInvitation}
            </span>
            <button onClick={copyCode}
              className={'px-4 py-3 rounded-xl font-medium text-sm transition min-w-[90px] ' + (copied ? 'bg-green-500 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white')}>
              {copied ? '✅ Copié !' : '📋 Copier'}
            </button>
          </div>

          {/* Boutons partage */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Partager l'invitation via :</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={shareWhatsapp}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition">
                <span>📱</span> WhatsApp
              </button>
              <button onClick={shareMail}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition">
                <span>✉️</span> E-mail
              </button>
              <button onClick={shareSMS}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium transition">
                <span>💬</span> SMS
              </button>
              <button onClick={shareNatif}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition">
                <span>↗️</span> Autres
              </button>
            </div>
          </div>

          {isAdmin && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              👑 En tant qu'admin, tu peux nommer d'autres membres administrateurs ci-dessous.
            </p>
          )}
        </div>
      )}

      {/* Liste membres */}
      <div className="space-y-2">
        {membres.map((m) => {
          const nom = m.profile?.full_name || 'Membre'
          const initiale = nom[0].toUpperCase()
          const isSelf = m.user_id === currentUserId
          const isMembreAdmin = m.role === 'admin'

          return (
            <div key={m.id} className="flex items-center justify-between py-3 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className={'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ' +
                  (isMembreAdmin ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300')}>
                  {initiale}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    {nom}
                    {isSelf && <span className="text-xs text-gray-400 font-normal">(vous)</span>}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {isMembreAdmin ? '👑 Administrateur' : '👁️ Membre — lecture seule'}
                  </p>
                </div>
              </div>

              {isAdmin && !isSelf && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isMembreAdmin ? (
                    <button onClick={() => promouvoir(m.id, 'membre')} disabled={loading}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition whitespace-nowrap">
                      → Membre
                    </button>
                  ) : (
                    <button onClick={() => promouvoir(m.id, 'admin')} disabled={loading}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition whitespace-nowrap">
                      → Admin
                    </button>
                  )}
                  <button onClick={() => exclure(m.id)} disabled={loading}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    ✕
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
