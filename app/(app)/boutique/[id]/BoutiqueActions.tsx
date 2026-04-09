'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function BoutiqueActions({ boutiqueId }: { boutiqueId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Supprimer cette boutique et toutes ses donnees ?')) return
    const supabase = createClient()
    await supabase.from('boutiques').delete().eq('id', boutiqueId)
    router.push('/boutique')
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded-xl hover:bg-red-50 transition">
      🗑️ Supprimer
    </button>
  )
}
