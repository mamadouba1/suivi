'use client'
import { formatMontant, formatMois, getCouleurCategorie } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

interface Props {
  mois: string
  totalDepenses: number
  totalEntrees: number
  solde: number
  devise: string
  chartData: { type: string; montant: number }[]
  depenses: Record<string, unknown>[]
  entrees: Record<string, unknown>[]
  userName: string
}

export default function DashboardClient({
  mois, totalDepenses, totalEntrees, solde, devise, chartData, depenses, entrees, userName
}: Props) {
  const dernierDepenses = [...depenses]
    .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-brand-800" style={{ fontFamily: 'Georgia, serif' }}>
          Bonjour{userName ? `, ${userName.split(' ')[0]}` : ''} 👋
        </h2>
        <p className="text-gray-500 text-sm">{formatMois(mois)}</p>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-sage-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Revenus</p>
          <p className="text-2xl font-bold text-sage-600">{formatMontant(totalEntrees, devise)}</p>
          <p className="text-xs text-gray-400 mt-1">{entrees.length} entrée(s)</p>
        </div>
        <div className="card border-l-4 border-l-brand-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dépenses</p>
          <p className="text-2xl font-bold text-brand-600">{formatMontant(totalDepenses, devise)}</p>
          <p className="text-xs text-gray-400 mt-1">{depenses.length} dépense(s)</p>
        </div>
        <div className={`card border-l-4 ${solde >= 0 ? 'border-l-green-500' : 'border-l-red-400'}`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Solde</p>
          <p className={`text-2xl font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatMontant(solde, devise)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{solde >= 0 ? '✅ Budget positif' : '⚠️ Dépassement'}</p>
        </div>
      </div>

      {/* Graphiques */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Dépenses par catégorie</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v: number) => formatMontant(v, devise)} />
                <Bar dataKey="montant" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={getCouleurCategorie(entry.type)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Répartition</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="montant"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={getCouleurCategorie(entry.type)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMontant(v, devise)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dernières dépenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Dernières dépenses</h3>
          <a href="/depenses" className="text-brand-600 text-sm font-medium hover:underline">Voir tout →</a>
        </div>
        {dernierDepenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm">Aucune dépense ce mois-ci</p>
            <a href="/depenses" className="btn-primary inline-block mt-4 text-sm">Ajouter une dépense</a>
          </div>
        ) : (
          <div className="space-y-2">
            {dernierDepenses.map((d: Record<string, unknown>) => (
              <div key={d.id as string} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{d.libelle as string}</p>
                  <p className="text-xs text-gray-400">{d.type as string} · {d.date as string}</p>
                </div>
                <span className="text-sm font-bold text-brand-600">
                  {formatMontant(d.montant_depense as number, devise)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
