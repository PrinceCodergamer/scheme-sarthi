import { useState } from 'react'
import { useApp, AVAILABLE_LANGS, LANG_NAMES } from '../store/appStore'
import { Globe } from 'lucide-react'

export default function LanguageToggle() {
  const { lang, setLang, t } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-surface-light transition-all"
      >
        <Globe size={16} className="text-text-secondary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 bg-surface border border-border rounded-2xl shadow-glass py-1.5 z-20 min-w-[150px] overflow-hidden">
            {AVAILABLE_LANGS.map((code) => (
              <button
                key={code}
                onClick={() => { setLang(code); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                  code === lang
                    ? 'bg-blue-500/10 text-blue-400 font-semibold'
                    : 'text-text-secondary hover:bg-surface-light/50 hover:text-white'
                }`}
              >
                {LANG_NAMES[code]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
