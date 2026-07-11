import { Shield, Lock, FileCheck, Server } from 'lucide-react'

const badges = [
  { icon: Shield, label: '✓ Demo Mode', color: 'text-primary', bg: 'bg-primary-light/70' },
  { icon: Lock, label: 'Privacy First | Your Data Stays With You', color: 'text-green', bg: 'bg-green/5' },
  { icon: FileCheck, label: '✓ Rule-based Engine', color: 'text-primary', bg: 'bg-primary-light/70' },
  { icon: Server, label: '✓ DPDP Friendly', color: 'text-green', bg: 'bg-green/5' },
]

export default function TrustBar({ compact = false }) {
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
