'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function NouvelleFamillePage() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 transition text-sm"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom est obligatoire'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user }, error: userErr } = await supabase.auth.getUser()

    if (userErr || !user) {
      setError('Non connecté : ' + (userErr?.message || 'session vide'))
      setLoading(false)
      return
    }

    const { data: famille, error: famErr } = await supabase
      .from('familles')
      .insert({ nom: nom.trim(), description: description.trim() || null, created_by: user.id })
      .select()
      .single()

    if (famErr || !famille) {
      setError('[' + (famErr?.code || '?') + '] ' + (famErr?.message || '') + ' — ' + (famErr?.details || ''))
      setLoading(false)
      return
    }

    await supabase.from('famille_membres').insert({
      famille_id: famille.id,
      user_id: user.id,
      role: 'admin',
    })

    router.push('/famille/' + famille.id)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/famille" className="text-brand-600 text-sm hover:underline">← Retour</Link>
        <h1 className="text-2xl font-bold text-brand-800 dark:text-brand-200 mt-2" style={{ fontFamily: 'Georgia, serif' }}>
          Nouvelle famille
        </h1>
      </div>
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-xs font-mono break-all">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nom de la famille *</label>
            <input type="text" className={inputCls} placeholder="Ex: Famille Diallo, Famille BA..."
              value={nom} onChange={e => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea className={inputCls} rows={2} placeholder="Description optionnelle..."
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition disabled:opacity-60">
            {loading ? 'Création...' : 'Créer la famille'}
          </button>
        </form>
      </div>
    </div>
  )
}
