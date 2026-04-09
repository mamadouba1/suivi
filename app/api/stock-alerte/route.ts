import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  const { data: produits } = await supabase
    .from('produits')
    .select('*, boutiques(nom, user_id, profiles:user_id(full_name))')
    .lte('stock', supabase.rpc)

  const { data: alertes } = await supabase
    .from('produits')
    .select('id, nom, stock, stock_alerte, boutique_id, boutiques(nom, user_id)')
    .filter('stock', 'lte', 'stock_alerte')

  if (!alertes || alertes.length === 0) {
    return NextResponse.json({ message: 'Aucune alerte', count: 0 })
  }

  const parUser: Record<string, { boutique: string, produits: any[] }[]> = {}
  for (const p of alertes) {
    const b = p.boutiques as any
    const uid = b?.user_id
    if (!uid) continue
    if (!parUser[uid]) parUser[uid] = []
    let entry = parUser[uid].find(e => e.boutique === b.nom)
    if (!entry) { entry = { boutique: b.nom, produits: [] }; parUser[uid].push(entry) }
    entry.produits.push(p)
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', Object.keys(parUser))

  const emails = []
  for (const [uid, boutiques] of Object.entries(parUser)) {
    const { data: userData } = await supabase.auth.admin.getUserById(uid)
    const email = userData?.user?.email
    const profile = profiles?.find(p => p.id === uid)
    if (!email) continue

    const lignes = boutiques.map(b =>
      b.produits.map(p =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${b.boutique}</td><td style="padding:8px;border-bottom:1px solid #eee">${p.nom}</td><td style="padding:8px;border-bottom:1px solid #eee;color:red"><strong>${p.stock}</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${p.stock_alerte}</td></tr>`
      ).join('')
    ).join('')

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#c2410c;color:white;padding:20px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;font-size:20px">⚠️ Alerte Stock Bas</h1>
          <p style="margin:5px 0 0;opacity:0.9">Bonjour ${profile?.full_name || ''} !</p>
        </div>
        <div style="background:#fff8f5;padding:20px;border:1px solid #fed7aa">
          <p style="color:#92400e">Les produits suivants sont en stock bas et necessitent un reapprovisionnement :</p>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden">
            <thead><tr style="background:#fef3c7">
              <th style="padding:10px;text-align:left">Boutique</th>
              <th style="padding:10px;text-align:left">Produit</th>
              <th style="padding:10px;text-align:left">Stock actuel</th>
              <th style="padding:10px;text-align:left">Seuil alerte</th>
            </tr></thead>
            <tbody>${lignes}</tbody>
          </table>
          <div style="margin-top:20px;text-align:center">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://votre-app.vercel.app'}/boutique"
              style="background:#c2410c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
              Voir mes boutiques
            </a>
          </div>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:12px;padding:10px">Suivi Depenses — Gestion de boutique</p>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Suivi Depenses <onboarding@resend.dev>',
        to: email,
        subject: '⚠️ ' + alertes.length + ' produit(s) en stock bas',
        html,
      }),
    })
    emails.push({ email, sent: res.ok })
  }

  return NextResponse.json({ message: 'Alertes envoyees', count: alertes.length, emails })
}
