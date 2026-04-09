'use client'
import { useState } from 'react'
import { useLangue, Langue } from '@/lib/langue-context'

const LANGUES = [
  { code: 'fr' as Langue, label: 'Francais', flag: 'FR' },
  { code: 'en' as Langue, label: 'English', flag: 'EN' },
  { code: 'wo' as Langue, label: 'Wolof', flag: 'WO' },
]

export default function SelecteurLangue() {
  const { langue, setLangue } = useLangue()
  const [open, setOpen] = useState(false)
  const current = LANGUES.find(l => l.code === langue) || LANGUES[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition w-full"
      >
        <span className="text-xs font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">
          {current.flag}
        </span>
        <span>{current.label}</span>
        <span className="text-gray-400 ml-auto">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-10 bg-white border rounded-xl shadow-lg z-50 overflow-hidden w-40">
            {LANGUES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLangue(l.code); setOpen(false) }}
                className={"w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-50 transition " + (langue === l.code ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600')}
              >
                <span className="text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded">{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
