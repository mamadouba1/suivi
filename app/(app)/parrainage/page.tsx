"use client"
import { useState } from 'react'

export default function ParrainagePage() {
  const [copied, setCopied] = useState(false)
  const appUrl = 'https://suivi-des-depenses-blond.vercel.app'

  function copyLink() {
    navigator.clipboard.writeText(appUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappMsg = encodeURIComponent('Rejoins Suivi Depenses : ' + appUrl)
  const smsMsg = encodeURIComponent('Suivi Depenses : ' + appUrl)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🤝</div>
        <h1 className="text-2xl font-bold text-brand-800">Parrainer un ami</h1>
        <p className="text-gray-500 text-sm mt-2">Partagez l&apos;app avec vos proches.</p>
      </div>
      <div className="card mb-4">
        <p className="text-sm text-gray-500 mb-2 font-medium">Lien de l&apos;application</p>
        <div className="flex items-center gap-2">
          <input type="text" readOnly value={appUrl} className="input text-sm flex-1" />
          <button onClick={copyLink} className="btn-primary px-4 py-2 text-sm whitespace-nowrap">
            {copied ? "Copie !" : "Copier"}
          </button>
        </div>
      </div>
      <div className="card mb-4">
        <p className="text-sm text-gray-500 mb-3 font-medium">Partager via</p>
        <div className="flex flex-col gap-3">
          <a href={"https://wa.me/?text=" + whatsappMsg} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 font-medium">
            <span className="text-2xl">💬</span>
            Partager sur WhatsApp
          </a>
          <a href={"sms:?body=" + smsMsg}
            className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-700 font-medium">
            <span className="text-2xl">📱</span>
            Envoyer par SMS
          </a>
        </div>
      </div>
      <div className="card text-center">
        <p className="text-gray-600 text-sm">C&apos;est gratuit pour tout le monde !</p>
      </div>
    </div>
  )
}
