"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Fournisseur { id: string; nom: string; telephone?: string; email?: string; adresse?: string; dette: number }

export default function FournisseursClient() {
  const supabase = createClient()
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [form, setForm] = useState({ nom:"", telephone:"", email:"", adresse:"" })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("fournisseurs").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    setFournisseurs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!form.nom.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: boutique } = await supabase.from("boutiques").select("id").eq("user_id", user.id).single()
    await supabase.from("fournisseurs").insert({ ...form, user_id: user.id, boutique_id: boutique?.id, dette: 0 })
    setForm({ nom:"", telephone:"", email:"", adresse:"" })
    setShowForm(false)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from("fournisseurs").delete().eq("id", id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🚚 Fournisseurs</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Ajouter</button>
      </div>
      {showForm && (
        <div className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
          <input placeholder="Nom du fournisseur *" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
          <input placeholder="Telephone" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
          <input placeholder="Adresse" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
          <button onClick={handleAdd} className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium">Enregistrer</button>
        </div>
      )}
      {fournisseurs.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-4xl mb-2">🚚</p><p>Aucun fournisseur</p></div>
      ) : (
        <div className="space-y-3">
          {fournisseurs.map(f => (
            <div key={f.id} className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{f.nom}</p>
                  {f.telephone && <p className="text-sm text-gray-500">📞 {f.telephone}</p>}
                  {f.email && <p className="text-sm text-gray-500">✉️ {f.email}</p>}
                  {f.adresse && <p className="text-sm text-gray-500">📍 {f.adresse}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${f.dette > 0 ? "text-red-500" : "text-green-500"}`}>Dette : {f.dette.toLocaleString()} GNF</p>
                  <button onClick={() => handleDelete(f.id)} className="text-xs text-red-400 mt-2 hover:text-red-600">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
