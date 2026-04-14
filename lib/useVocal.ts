'use client'
import { useCallback, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type VocalOptions = {
  langue?: string        // 'fr-FR' | 'en-US' | 'wo' (wolof non officiel)
  vitesse?: number       // 0.5 – 2.0, défaut 1.0
  volume?: number        // 0 – 1, défaut 1
}

type EcouteOptions = {
  langue?: string
  onResult: (texte: string) => void
  onFin?: () => void
  onErreur?: (err: string) => void
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useVocal(opts: VocalOptions = {}) {
  const { langue = 'fr-FR', vitesse = 1.0, volume = 1 } = opts
  const [parle, setParle] = useState(false)
  const [ecoute, setEcoute] = useState(false)
  const recognitionRef = useRef<any>(null)

  // ── Text-to-Speech ────────────────────────────────────────────────────────
  const lire = useCallback((texte: string, optsOverride: Partial<VocalOptions> = {}) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(texte)
    utterance.lang = optsOverride.langue || langue
    utterance.rate = optsOverride.vitesse || vitesse
    utterance.volume = optsOverride.volume ?? volume

    // Préférer une voix française si dispo
    const voix = window.speechSynthesis.getVoices()
    const voixFr = voix.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)))
    if (voixFr) utterance.voice = voixFr

    utterance.onstart = () => setParle(true)
    utterance.onend = () => setParle(false)
    utterance.onerror = () => setParle(false)
    window.speechSynthesis.speak(utterance)
  }, [langue, vitesse, volume])

  const arreterLecture = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setParle(false)
    }
  }, [])

  // ── Speech-to-Text ────────────────────────────────────────────────────────
  const commencerEcoute = useCallback((ecouteOpts: EcouteOptions) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      ecouteOpts.onErreur?.('Reconnaissance vocale non supportée sur ce navigateur')
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = ecouteOpts.langue || langue
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onstart = () => setEcoute(true)
    rec.onend = () => { setEcoute(false); ecouteOpts.onFin?.() }
    rec.onerror = (e: any) => {
      setEcoute(false)
      ecouteOpts.onErreur?.(e.error || 'Erreur micro')
    }
    rec.onresult = (e: any) => {
      const texte = e.results[0][0].transcript.trim()
      ecouteOpts.onResult(texte)
    }

    recognitionRef.current = rec
    rec.start()
  }, [langue])

  const arreterEcoute = useCallback(() => {
    recognitionRef.current?.stop()
    setEcoute(false)
  }, [])

  // ── Raccourcis métier boutique ────────────────────────────────────────────

  /** Annonce le total du panier */
  const annoncerTotal = useCallback((total: number, devise: string) => {
    lire(`Total : ${total.toLocaleString('fr-FR')} ${devise}`)
  }, [lire])

  /** Confirme une vente enregistrée */
  const confirmerVente = useCallback((montant: number, monnaie: number, devise: string) => {
    let msg = `Vente de ${montant.toLocaleString('fr-FR')} ${devise} enregistrée.`
    if (monnaie > 0) msg += ` Monnaie à rendre : ${monnaie.toLocaleString('fr-FR')} ${devise}.`
    lire(msg)
  }, [lire])

  /** Alerte stock bas */
  const alerteStock = useCallback((nomProduit: string) => {
    lire(`Attention, stock bas pour ${nomProduit}.`)
  }, [lire])

  /** Annonce un retour/remboursement */
  const annoncerRetour = useCallback((montant: number, devise: string) => {
    lire(`Retour effectué. Remboursement de ${montant.toLocaleString('fr-FR')} ${devise}.`)
  }, [lire])

  return {
    // États
    parle,
    ecoute,
    // Primitives
    lire,
    arreterLecture,
    commencerEcoute,
    arreterEcoute,
    // Raccourcis métier
    annoncerTotal,
    confirmerVente,
    alerteStock,
    annoncerRetour,
    // Support
    supportTTS: typeof window !== 'undefined' && 'speechSynthesis' in window,
    supportSTT: typeof window !== 'undefined' && (
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    ),
  }
}
