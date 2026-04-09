'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function genCodeBarre() {
  return '2' + Date.now().toString().slice(-11)
}

export default function ProduitsClient({ boutique, produits }: { boutique: any, produits: any[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [search, setSearch] = useState('')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [codeBarre, setCodeBarre] = useState('')
  const [categorie, setCategorie] = useState('general')
  const [prixAchat, setPrixAchat] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [stock, setStock] = useState('')
  const [stockAlerte, setStockAlerte] = useState('5')
  const [unite, setUnite] = useState('piece')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const categories = ['general', 'alimentaire', 'boisson', 'vetement', 'electronique', 'pharmacie', 'cosmetique', 'autre']

  function generateCode() {
    setCodeBarre(genCodeBarre())
  }

  async function startScanner() {
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      alert('Camera non disponible')
      setScanning(false)
    }
  }

  function stopScanner() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(t => t.stop())
    }
    setScanning(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !prixVente) { setError('Nom et prix de vente obligatoires'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('produits').insert({
      boutique_id: boutique.id,
      user_id: user!.id,
      nom: nom.trim(),
      description: description.trim() || null,
      code_barre: codeBarre || genCodeBarre(),
      categorie,
      prix_achat: prixAchat ? parseFloat(prixAchat) : 0,
      prix_vente: parseFloat(prixVente),
      stock: stock ? parseInt(stock) : 0,
      stock_alerte: parseInt(stockAlerte),
      unite,
    })
    if (error) { setError('Erreur. Reessayez.'); setLoading(false) }
    else {
      setShowForm(false)
      setNom(''); setDescription(''); setCodeBarre(''); setPrixAchat(''); setPrixVente(''); setStock('')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    const supabase = createClient()
    await supabase.from('produits').delete().eq('id', id)
    router.refresh()
  }

  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    (p.code_barre && p.code_barre.includes(search))
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={"/boutique/" + boutique.id} className="text-brand-600 text-sm hover:underline">← {boutique.nom}</Link>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-brand-800" style={{ fontFamily: "Georgia, serif" }}>📦 Produits</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
            <div>
              <label className="label">Nom du produit *</label>
              <input type="text" className="input" placeholder="Ex: Riz 25kg, Savon..." value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
            <div>
              <label className="label">Code barre</label>
              <div className="flex gap-2">
                <input type="text" className="input flex-1" placeholder="Code barre" value={codeBarre} onChange={e => setCodeBarre(e.target.value)} />
                <button type="button" onClick={generateCode} className="btn-secondary px-3 py-2 text-xs whitespace-nowrap">🔢 Generer</button>
                <button type="button" onClick={scanning ? stopScanner : startScanner} className="btn-secondary px-3 py-2 text-xs whitespace-nowrap">
                  {scanning ? '⏹ Stop' : '📷 Scanner'}
                </button>
              </div>
              {scanning && (
                <div className="mt-2 rounded-xl overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                  <p className="text-xs text-gray-500 text-center mt-1">Pointez la camera vers le code barre</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prix achat</label>
                <input type="number" className="input" placeholder="0" value={prixAchat} onChange={e => setPrixAchat(e.target.value)} min="0" />
              </div>
              <div>
                <label className="label">Prix vente *</label>
                <input type="number" className="input" placeholder="0" value={prixVente} onChange={e => setPrixVente(e.target.value)} min="0" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Stock actuel</label>
                <input type="number" className="input" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} min="0" />
              </div>
              <div>
                <label className="label">Alerte stock bas</label>
                <input type="number" className="input" placeholder="5" value={stockAlerte} onChange={e => setStockAlerte(e.target.value)} min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Categorie</label>
                <select className="input" value={categorie} onChange={e => setCategorie(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Unite</label>
                <select className="input" value={unite} onChange={e => setUnite(e.target.value)}>
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                  <option value="litre">Litre</option>
                  <option value="carton">Carton</option>
                  <option value="sac">Sac</option>
                  <option value="boite">Boite</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter le produit'}
            </button>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input type="text" className="input" placeholder="🔍 Rechercher par nom ou code barre..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <p>Aucun produit</p>
          </div>
        ) : (
          filtered.map((p: any) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{p.nom}</h3>
                    {p.stock <= p.stock_alerte && (
                      <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">⚠️ Stock bas</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-1">Code: {p.code_barre}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">Vente: {p.prix_vente.toLocaleString()} {boutique.devise}</span>
                    {p.prix_achat > 0 && <span className="text-gray-500">Achat: {p.prix_achat.toLocaleString()}</span>}
                    <span className="text-brand-600">Stock: {p.stock} {p.unite}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500 transition text-xl ml-2">×</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
