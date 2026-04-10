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
  const [showInvite, setShowInvite] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  function copyCode() {
    navigator.clipboard.writeText(codeInvitation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function promouvoir(membreId: string, userId: string, newRole: 'admin' | 'membre') {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('famille_membres').update({ role: newRole }).eq('id', membreId)
    setLoading(false)
    router.refresh()
  }

  async function exclure(membreId: string, userId: string) {
    if (!confirm('Exclure ce membre ?')) return
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
          👥 Membres <span className="text-brand-500 font-bold">({membres.length})</span>
        </h3>
        {isAdmin && (
          <button onClick={() => setShowInvite(!showInvite)}
            className="text-sm px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition">
            + Inviter
          </button>
        )}
      </div>

      {/* Panel invitation */}
      {showInvite && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">🔗 Partager le code d'invitation</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Partage ce code à tes proches. Ils pourront rejoindre la famille depuis leur compte via <strong>Famille → Rejoindre avec un code</strong>.
          </p>
          <div className="flex items-center gap-2">
            <span className="flex-1 bg-white dark:bg-gray-700 border border-brand-200 dark:border-gray-600 rounded-xl px-4 py-2.5 font-mono text-brand-700 dark:text-brand-300 text-lg font-bold tracking-widest text-center">
              {codeInvitation}
            </span>
            <button onClick={copyCode}
              className={'px-4 py-2.5 rounded-xl font-medium text-sm transition ' + (copied ? 'bg-green-500 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white')}>
              {copied ? '✅ Copié !' : '📋 Copier'}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Les membres invités peuvent consulter les données. Seuls les admins peuvent modifier.
          </p>
        </div>
      )}

      {msg && <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">{msg}</p>}

      {/* Liste membres */}
      <div className="space-y-2">
        {membres.map((m) => {
          const nom = m.profile?.full_name || 'Membre'
          const initiale = nom[0].toUpperCase()
          const isSelf = m.user_id === currentUserId
          const isMembreAdmin = m.role === 'admin'

          return (
            <div key={m.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <div className="flex items-center gap-3">
                <div className={'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ' +
                  (isMembreAdmin ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300')}>
                  {initiale}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {nom} {isSelf && <span className="text-xs text-gray-400">(vous)</span>}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {isMembreAdmin ? '👑 Administrateur' : '👁 Membre (lecture seule)'}
                  </p>
                </div>
              </div>

              {/* Actions admin sur les autres membres */}
              {isAdmin && !isSelf && (
                <div className="flex items-center gap-1">
                  {isMembreAdmin ? (
                    <button onClick={() => promouvoir(m.id, m.user_id, 'membre')} disabled={loading}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 transition">
                      → Membre
                    </button>
                  ) : (
                    <button onClick={() => promouvoir(m.id, m.user_id, 'admin')} disabled={loading}
                      className="text-xs px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition">
                      → Admin
                    </button>
                  )}
                  <button onClick={() => exclure(m.id, m.user_id)} disabled={loading}
                    className="text-xs px-2 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
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
