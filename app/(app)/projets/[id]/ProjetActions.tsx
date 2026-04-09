'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ProjetActions({ projetId }: { projetId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Supprimer ce projet et toutes ses donnees ?')) return
    const supabase = createClient()
    await supabase.from('projets').delete().eq('id', projetId)
    router.push('/projets')
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded-xl hover:bg-red-50 transition">
      🗑️ Supprimer
    </button>
  )
}
