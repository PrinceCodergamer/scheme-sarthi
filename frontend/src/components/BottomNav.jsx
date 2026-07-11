import { useApp } from '../store/appStore'
import { Home, ClipboardList, FileText, Bell } from 'lucide-react'

export default function BottomNav() {
  const { page, setPage, t, lang } = useApp()

  const items = [
    { key: 'results', icon: Home, label: t('nav.home') },
    { key: 'schemes', icon: ClipboardList, label: t('nav.schemes') },
    { key: 'applications', icon: FileText, label: t('nav.applications') },
    { key: 'reminders', icon: Bell, label: t('nav.reminders') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="flex items-center justify-around bg-white border-t border-gray-100 px-2 pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: '8px' }}>
        {items.map(item => {
          const active = page === item.key
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`flex flex-col items-center gap-1 min-w-[64px] py-1 px-2 rounded-lg transition-colors ${
                active ? 'text-primary' : 'text-text-secondary'
              }`}
              style={{ minHeight: '48px' }}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[11px] font-medium leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
