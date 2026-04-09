"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function CaisseClient() {
  const supabase = createClient()
  const [today, setToday] = useState({ total: 0, nb: 0 })
  const [week, setWeek] = useState<{ jour: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const debut = new Date(); debut.setHours(0,0,0,0)
      const { data: ventes } = await supabase.from("ventes").select("montant_total,created_at").eq("user_id", user.id)
      if (!ventes) return setLoading(false)
      const todayVentes = ventes.filter(v => new Date(v.created_at) >= debut)
      setToday({ total: todayVentes.reduce((s,v) => s + v.montant_total, 0), nb: todayVentes.length })
      const days: { jour: string; total: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
        const e = new Date(d); e.setHours(23,59,59,999)
        const total = ventes.filter(v => { const vd = new Date(v.created_at); return vd >= d && vd <= e }).reduce((s,v) => s + v.montant_total, 0)
        days.push({ jour: d.toLocaleDateString('fr-FR',{weekday:'short'}), total })
      }
      setWeek(days)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">💰 Caisse journaliere</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-sm text-green-600 font-medium">Recettes du jour</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{today.total.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">GNF</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <p className="text-sm text-blue-600 font-medium">Ventes du jour</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{today.nb}</p>
          <p className="text-xs text-blue-500 mt-1">transactions</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <h2 className="font-semibold text-gray-700 mb-4">📈 7 derniers jours</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={week}><XAxis dataKey="jour" tick={{fontSize:12}}/><YAxis tick={{fontSize:10}}/><Tooltip formatter={(v:number) => `${v.toLocaleString()} GNF`}/><Bar dataKey="total" fill="#3b82f6" radius={[6,6,0,0]}/></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
