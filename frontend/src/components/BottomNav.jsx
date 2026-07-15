import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Home, LayoutGrid, Sparkles, Bookmark, User } from 'lucide-react'

const items = [
  { key: 'results', icon: Home, labelKey: 'nav.home' },
  { key: 'schemes', icon: LayoutGrid, labelKey: 'nav.schemes' },
  { key: 'ai', icon: Sparkles, labelKey: 'AI Assistant', special: true },
  { key: 'applications', icon: Bookmark, labelKey: 'nav.applications' },
  { key: 'profile', icon: User, labelKey: 'Profile' },
]

export default function BottomNav() {
  const { page, setPage, t } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="glass-strong rounded-t-3xl px-3 pt-3 pb-[env(safe-area-inset-bottom, 12px)]">
        <div className="flex items-center justify-around">
          {items.map((item, i) => {
            const active = page === item.key || (item.key === 'schemes' && page === 'results')
            const Icon = item.icon

            if (item.special) {
              return (
                <div key={i} className="relative -mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const event = new CustomEvent('open-ai-copilot')
                      window.dispatchEvent(event)
                    }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
                  >
                    <Sparkles size={22} className="text-white" />
                  </motion.button>
                </div>
              )
            }

            return (
              <motion.button
                key={item.key}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (item.key === 'profile') {
                    setPage('welcome')
                  } else {
                    setPage(item.key)
                  }
                }}
                className="flex flex-col items-center gap-1 py-1 px-3 min-w-[56px]"
              >
                <div className="relative">
                  <Icon
                    size={20}
                    className={active ? 'text-blue-400' : 'text-text-muted'}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-tight ${active ? 'text-blue-400' : 'text-text-muted'}`}>
                  {item.labelKey === 'nav.home' ? t('nav.home') :
                   item.labelKey === 'nav.schemes' ? t('nav.schemes') :
                   item.labelKey === 'nav.applications' ? t('nav.applications') :
                   item.labelKey}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
