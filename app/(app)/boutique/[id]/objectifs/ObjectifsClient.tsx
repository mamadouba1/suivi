'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ObjectifsClient({ boutique, objectif, mois, totalVentes, benefice }: {
  boutique: any, objectif: any, mois: string, totalVentes: number, benefice: number
}) {
  const router = useRouter()
  const [objVentes, setObjVentes] = useState(objectif?.objectif_ventes?.toString() || '')
  const [objBenefice, setObjBenefice] = useState(objectif?.objectif_benefice?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const devise = boutique.devise || 'FCFA'

  const progVentes = objVentes ? Math.min((totalVentes / parseFloat(objVentes)) * 100, 100) : 0
  const progBenefice = objBenefice ? Math.min((benefice / parseFloat(objBenefice)) * 100, 100) : 0

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (objectif) {
      await supabase.from('objectifs').update({
        objectif_ventes: parseFloat(objVentes) || 0,
        objectif_benefice: parseFloat(objBenefice) || 0,
      }).eq('id', objectif.id)
    } else {
      await supabase.from('objectifs').insert({
        boutique_id: boutique.id, user_id: user!.id, mois,
        objectif_ventes: parseFloat(objVentes) || 0,
        objectif_benefice: parseFloat(objBenefice) || 0,
      })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
    router.refresh()
  }

  const moisLabel = new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>
      <h1 className="text-xl font-bold text-brand-800 mb-1" style={{ fontFamily: "Georgia, serif" }}>
        🎯 Objectifs de vente
      </h1>
      <p className="text-gray-500 text-sm mb-6 capitalize">{moisLabel}</p>

      <div className="card mb-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Objectif ventes ({devise})</label>
            <input type="number" className="input" placeholder="Ex: 500000" value={objVentes}
              onChange={e => setObjVentes(e.target.value)} min="0" />
          </div>
          <div>
            <label className="label">Objectif benefice ({devise})</label>
            <input type="number" className="input" placeholder="Ex: 100000" value={objBenefice}
              onChange={e => setObjBenefice(e.target.value)} min="0" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {saved ? '✅ Sauvegarde !' : loading ? 'Sauvegarde...' : 'Sauvegarder les objectifs'}
          </button>
        </form>
      </div>

      {objVentes && (
        <div className="card mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">📈 Progression ventes</span>
            <span className="text-brand-600 font-bold">{Math.round(progVentes)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div className={"h-4 rounded-full transition-all " + (progVentes >= 100 ? 'bg-green-500' : 'bg-brand-500')}
              style={{ width: progVentes + "%" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{totalVentes.toLocaleString()} {devise}</span>
            <span>Objectif: {parseFloat(objVentes).toLocaleString()} {devise}</span>
          </div>
          {progVentes >= 100 && <p className="text-green-600 font-semibold text-center mt-2">🎉 Objectif atteint !</p>}
        </div>
      )}

      {objBenefice && (
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">💰 Progression benefice</span>
            <span className="text-brand-600 font-bold">{Math.round(progBenefice)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div className={"h-4 rounded-full transition-all " + (progBenefice >= 100 ? 'bg-green-500' : 'bg-yellow-500')}
              style={{ width: progBenefice + "%" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{benefice.toLocaleString()} {devise}</span>
            <span>Objectif: {parseFloat(objBenefice).toLocaleString()} {devise}</span>
          </div>
          {progBenefice >= 100 && <p className="text-green-600 font-semibold text-center mt-2">🎉 Objectif atteint !</p>}
        </div>
      )}
    </div>
  )
}
