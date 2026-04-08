import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getMoisActuel, formatMontant, formatMois } from '@/lib/utils'

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const mois = getMoisActuel()

    const [{ data: depenses }, { data: entrees }, { data: profile }] = await Promise.all([
      supabase.from('depenses').select('*').eq('user_id', user.id).eq('mois', mois),
      supabase.from('entrees').select('*').eq('user_id', user.id).eq('mois', mois),
      supabase.from('profiles').select('full_name, devise').eq('id', user.id).single(),
    ])

    const devise = profile?.devise || 'FCFA'
    const totalD = (depenses || []).reduce((s, d) => s + d.montant_depense, 0)
    const totalE = (entrees || []).reduce((s, e) => s + e.montant, 0)
    const solde = totalE - totalD

    // Grouper par catégorie
    const parType: Record<string, number> = {}
    for (const d of depenses || []) {
      parType[d.type] = (parType[d.type] || 0) + d.montant_depense
    }
    const lignesDepenses = Object.entries(parType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, montant]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3e8d8">${type}</td><td style="padding:6px 12px;border-bottom:1px solid #f3e8d8;text-align:right;font-weight:600;color:#dc6f1d">${formatMontant(montant, devise)}</td></tr>`)
      .join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family:system-ui,sans-serif;background:#fdf6ee;margin:0;padding:20px">
        <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <div style="background:#dc6f1d;padding:24px;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">💰 Récapitulatif mensuel</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0">${formatMois(mois)}</p>
          </div>
          <div style="padding:24px">
            <p style="color:#555;margin-bottom:20px">Bonjour <strong>${profile?.full_name || 'cher(e) utilisateur(rice)'}</strong>,</p>
            <p style="color:#555;margin-bottom:20px">Voici le résumé de vos finances pour ${formatMois(mois)} :</p>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
              <div style="background:#f4f7f4;border-radius:12px;padding:16px;text-align:center">
                <p style="color:#5a8360;font-size:12px;margin:0 0 4px;text-transform:uppercase;font-weight:600">Revenus</p>
                <p style="color:#5a8360;font-size:18px;font-weight:700;margin:0">${formatMontant(totalE, devise)}</p>
              </div>
              <div style="background:#fdf6ee;border-radius:12px;padding:16px;text-align:center">
                <p style="color:#dc6f1d;font-size:12px;margin:0 0 4px;text-transform:uppercase;font-weight:600">Dépenses</p>
                <p style="color:#dc6f1d;font-size:18px;font-weight:700;margin:0">${formatMontant(totalD, devise)}</p>
              </div>
            </div>

            <div style="background:${solde >= 0 ? '#f0fdf4' : '#fff5f5'};border-radius:12px;padding:16px;text-align:center;margin-bottom:24px">
              <p style="color:#6b7280;font-size:12px;margin:0 0 4px">Solde du mois</p>
              <p style="color:${solde >= 0 ? '#16a34a' : '#dc2626'};font-size:24px;font-weight:700;margin:0">${formatMontant(solde, devise)}</p>
              <p style="color:#9ca3af;font-size:12px;margin:4px 0 0">${solde >= 0 ? '✅ Budget maîtrisé' : '⚠️ Dépassement de budget'}</p>
            </div>

            ${lignesDepenses ? `
            <h3 style="color:#374151;font-size:14px;margin:0 0 12px">Dépenses par catégorie</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              ${lignesDepenses}
            </table>
            ` : ''}
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center">
            <p style="color:#9ca3af;font-size:12px;margin:0">🇸🇳 Suivi Dépenses Familiales</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Envoi via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY manquant' }, { status: 500 })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Suivi Dépenses <onboarding@resend.dev>',
        to: [user.email!],
        subject: `📊 Récap ${formatMois(mois)} — ${formatMontant(totalD, devise)} dépensés`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
