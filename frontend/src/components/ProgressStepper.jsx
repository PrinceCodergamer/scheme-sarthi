import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Check } from 'lucide-react'

const stages = [
  { key: 'submitted', icon: '📄' },
  { key: 'verified', icon: '✅' },
  { key: 'block_office', icon: '🏢' },
  { key: 'sanctioned', icon: '📜' },
  { key: 'restored', icon: '🎉' },
]

export default function ProgressStepper({ currentStage = 0, lang: langProp }) {
  const { t, lang } = useApp()
  const l = langProp || lang

  const stageKeys = ['submitted', 'verified', 'block_office', 'sanctioned', 'restored']
  const labels = stageKeys.map(k => t(`tracker.${k}`))

  return (
    <div className="flex items-start justify-between gap-2 py-4">
      {stages.map((stage, i) => {
        const completed = i < currentStage
        const current = i === currentStage
        const isLast = i === stages.length - 1

        return (
          <div key={stage.key} className="flex flex-col items-center flex-1 relative gap-2">
            <motion.div
              initial={false}
              animate={{
                scale: current ? 1.15 : 1,
                backgroundColor: completed ? '#22C55E' : current ? '#2563EB' : 'rgba(51, 65, 85, 0.5)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${
                completed ? 'border-green-500/30' : current ? 'border-blue-500/30 shadow-glow' : 'border-border'
              }`}
            >
              {completed ? <Check size={14} className="text-white" /> : <span className="text-[11px]">{stage.icon}</span>}
            </motion.div>
            {!isLast && (
              <div className={`absolute top-[18px] left-[calc(50%+18px)] right-[calc(-50%+18px)] h-[2px] z-0 transition-all duration-500 ${
                completed ? 'bg-green-500/50' : 'bg-border'
              }`} />
            )}
            <p className={`text-[10px] font-medium text-center leading-tight ${
              completed ? 'text-green-400' : current ? 'text-blue-400' : 'text-text-muted'
            }`}>
              {labels[i]}
            </p>
          </div>
        )
      })}
    </div>
  )
}
