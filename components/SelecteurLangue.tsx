'use client'
import { useState, useEffect } from 'react'
import { Langue } from '@/lib/i18n'

const LANGUES = [
  { code: 'fr', label: 'Francais', flag: 'FR' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'wo', label: 'Wolof', flag: 'WO' },
]

export default function SelecteurLangue() {
  const [langue, setLangue] = useState<Langue>('fr')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('langue') as Langue
    if (saved) setLangue(saved)
  }, [])

  function changer(code: Langue) {
    setLangue(code)
    localStorage.setItem('langue', code)
    setOpen(false)
    window.location.reload()
  }

  const current = LANGUES.find(l => l.code === langue)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
      >
        <span className="text-xs font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">
          {current?.flag}
        </span>
        <span className="hidden sm:block">{current?.label}</span>
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white border rounded-xl shadow-lg z-50 overflow-hidden w-36">
          {LANGUES.map(l => (
            <button
              key={l.code}
              onClick={() => changer(l.code as Langue)}
              className={"w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-50 transition " + (langue === l.code ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600')}
            >
              <span className="text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
