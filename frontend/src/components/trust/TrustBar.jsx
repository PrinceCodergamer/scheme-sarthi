import { useApp } from '../../store/appStore'
import { Shield, Lock, FileCheck, Server } from 'lucide-react'

export default function TrustBar({ compact = false }) {
  const { t } = useApp()
  const badges = [
    { icon: Shield, label: t('trustbar.demo_mode'), color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Lock, label: t('trustbar.privacy'), color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: FileCheck, label: t('trustbar.rule_engine'), color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Server, label: t('trustbar.dpdp'), color: 'text-green-400', bg: 'bg-green-500/10' },
  ]
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-none ${compact ? 'mb-3' : 'mb-5'}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {badges.map((badge, i) => (
        <div key={i}
          className={`flex items-center gap-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${badge.bg} ${badge.color} ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'}`}>
          <badge.icon size={compact ? 11 : 13} />
          <span className="font-medium">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}
