import { useApp } from '../store/appStore'

export default function LanguageToggle() {
  const { lang, toggleLang } = useApp()
  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary/30 text-sm font-semibold text-primary bg-white hover:bg-primary-light transition-colors"
      aria-label={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
    >
      <span className={lang === 'hi' ? 'text-primary' : 'text-text-secondary'}>{'हिंदी'}</span>
      <span className="text-text-secondary/50">|</span>
      <span className={lang === 'en' ? 'text-primary' : 'text-text-secondary'}>{'EN'}</span>
    </button>
  )
}
