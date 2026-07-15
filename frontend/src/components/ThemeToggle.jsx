import { useApp } from '../store/appStore'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp()

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-surface-light transition-all"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun size={16} className="text-amber-400" />
      ) : (
        <Moon size={16} className="text-blue-400" />
      )}
    </button>
  )
}
