'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RejoindreForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function rejoindre(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()
    const { data: famille } = await supabase
      .from('familles')
      .select('id, nom')
      .eq('code_invitation', code.trim().toUpperCase())
      .single()

    if (!famille) {
      setError('Code invalide. Vérifie et réessaie.')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.from('famille_membres').insert({
      famille_id: famille.id,
      user_id: userId,
      role: 'membre',
    })

    if (err?.code === '23505') {
      setError('Tu es déjà membre de cette famille.')
    } else if (err) {
      setError('Erreur : ' + err.message)
    } else {
      setSuccess('✅ Tu as rejoint "' + famille.nom + '" !')
      setCode('')
      setTimeout(() => { router.push('/famille/' + famille.id); router.refresh() }, 1500)
    }
    setLoading(false)
  }

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
        <span>🔑 Rejoindre avec un code</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={rejoindre} className="mt-4 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Demande le code d'invitation à l'admin de la famille.
          </p>
          {error && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">{success}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: A1B2C3D4"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 uppercase"
            />
            <button type="submit" disabled={loading || !code.trim()}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-60">
              {loading ? '...' : 'Rejoindre'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
