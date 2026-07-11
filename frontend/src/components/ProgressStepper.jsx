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
    <div className="progress-stepper">
      {stages.map((stage, i) => {
        const completed = i < currentStage
        const current = i === currentStage
        const isLast = i === stages.length - 1

        return (
          <div key={stage.key} className="progress-step">
            <div className={`step-dot ${completed ? 'completed' : ''} ${current ? 'current' : ''}`}>
              {completed ? <Check size={12} color="white" /> : <span style={{ fontSize: 10 }}>{stage.icon}</span>}
            </div>
            {!isLast && <div className={`step-line ${completed ? 'completed' : ''}`} />}
            <p className={`text-sm font-medium ${completed ? 'text-green' : current ? 'text-primary' : 'text-text-secondary'}`}>
              {labels[i]}
            </p>
          </div>
        )
      })}
    </div>
  )
}
