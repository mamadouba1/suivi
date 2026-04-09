"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Objectif { id: string; titre: string; montant_cible: number; periode: string; created_at: string }

export default function ObjectifsClient() {
  const supabase = createClient()
  const [objectifs, setObjectifs] = useState<Objectif[]>([])
  const [ventesMois, setVentesMois] = useState(0)
  const [form, setForm] = useState({ titre:"", montant_cible:"", periode:"mois" })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("objectifs_vente").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    setObjectifs(data || [])
    const debut = new Date(); debut.setDate(1); debut.setHours(0,0,0,0)
    const { data: ventes } = await supabase.from("ventes").select("montant_total").eq("user_id", user.id).gte("created_at", debut.toISOString())
    setVentesMois((ventes || []).reduce((s,v) => s + v.montant_total, 0))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!form.titre.trim() || !form.montant_cible) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: boutique } = await supabase.from("boutiques").select("id").eq("user_id", user.id).single()
    await supabase.from("objectifs_vente").insert({ titre: form.titre, montant_cible: parseFloat(form.montant_cible), periode: form.periode, user_id: user.id, boutique_id: boutique?.id })
    setForm({ titre:"", montant_cible:"", periode:"mois" })
    setShowForm(false)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🎯 Objectifs de vente</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Ajouter</button>
      </div>
      {showForm && (
        <div className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
          <input placeholder="Titre de l'objectif *" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
          <input type="number" placeholder="Montant cible (GNF) *" value={form.montant_cible} onChange={e => setForm({...form, montant_cible: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
          <select value={form.periode} onChange={e => setForm({...form, periode: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
            <option value="jour">Par jour</option>
            <option value="semaine">Par semaine</option>
            <option value="mois">Par mois</option>
          </select>
          <button onClick={handleAdd} className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium">Enregistrer</button>
        </div>
      )}
      {objectifs.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-4xl mb-2">🎯</p><p>Aucun objectif defini</p></div>
      ) : (
        <div className="space-y-4">
          {objectifs.map(o => {
            const pct = Math.min(100, Math.round((ventesMois / o.montant_cible) * 100))
            return (
              <div key={o.id} className="bg-white border rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{o.titre}</p>
                    <p className="text-xs text-gray-500 capitalize">Periode : {o.periode}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{pct}%</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-orange-400"}`} style={{width: `${pct}%`}}/>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{ventesMois.toLocaleString()} GNF</span>
                  <span>{o.montant_cible.toLocaleString()} GNF</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
