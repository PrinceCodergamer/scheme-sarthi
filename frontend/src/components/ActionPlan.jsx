import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, IndianRupee, ArrowRight, Sparkles, ListTodo } from 'lucide-react'
import { useApp } from '../store/appStore'

function buildAutoTasks(scanResults) {
  const { lapsed = [], at_risk = [], eligible_unclaimed = [] } = scanResults
  const all = [
    ...lapsed.map(s => ({ ...s, category: 'lapsed' })),
    ...at_risk.map(s => ({ ...s, category: 'at_risk' })),
    ...eligible_unclaimed.map(s => ({ ...s, category: 'eligible_unclaimed' })),
  ]

  const priorityOrder = { lapsed: 0, at_risk: 1, eligible_unclaimed: 2 }
  all.sort((a, b) => {
    const pa = priorityOrder[a.category] ?? 99
    const pb = priorityOrder[b.category] ?? 99
    if (pa !== pb) return pa - pb
    const benefitA = parseInt(String(a.benefit_amount || '0').replace(/[^0-9]/g, '')) || 0
    const benefitB = parseInt(String(b.benefit_amount || '0').replace(/[^0-9]/g, '')) || 0
    return benefitB - benefitA
  })

  return all.slice(0, 10).map((item, i) => ({
    id: `task-${i}`,
    priority: i + 1,
    title: item.name_en || item.name_hi || `Scheme ${i + 1}`,
    schemeName: item.name_hi || item.name_en || '',
    benefit: parseInt(String(item.benefit_amount || '0').replace(/[^0-9]/g, '')) || 0,
    timeEstimate: item.recovery?.estimated_minutes || 5,
    category: item.category,
  }))
}

export default function ActionPlan({ scanResults }) {
  const { profileId, t, lang } = useApp()
  const [mode, setMode] = useState('auto')
  const [aiPlan, setAiPlan] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const tasks = buildAutoTasks(scanResults)
  const totalBenefit = tasks.reduce((sum, t) => sum + t.benefit, 0)
  const totalTime = tasks.reduce((sum, t) => sum + t.timeEstimate, 0)

  const visibleTasks = showAll ? tasks : tasks.slice(0, 3)
  const hasMore = tasks.length > 3

  useEffect(() => {
    if (mode !== 'ai') return
    if (!profileId) return
    setLoadingAi(true)
    fetch(`/api/ai/action-plan?profile_id=${profileId}`)
      .then(r => r.json())
      .then(data => setAiPlan(data))
      .catch(() => setAiPlan({ error: 'Failed to load AI plan' }))
      .finally(() => setLoadingAi(false))
  }, [mode, profileId])

  if (mode === 'ai') {
    return (
      <div className="mb-6 stagger-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-[18px] font-semibold text-primary">AI Action Plan</h2>
          </div>
          <button
            onClick={() => setMode('auto')}
            className="text-[13px] text-text-secondary hover:text-primary"
          >
            {lang === 'hi' ? 'स्वचालित देखें' : 'View auto'}
          </button>
        </div>

        {loadingAi ? (
          <div className="bg-white rounded-2xl p-6 shadow-card text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[14px] text-text-secondary">Generating your AI action plan...</p>
          </div>
        ) : aiPlan?.error ? (
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <p className="text-[14px] text-danger">{aiPlan.error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aiPlan?.response && (
              <div className="bg-white rounded-2xl p-4 shadow-card">
                <p className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
                  {aiPlan.response}
                </p>
              </div>
            )}
            {aiPlan?.actions?.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{action.title || action.action}</p>
                    {action.steps?.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {action.steps.map((step, j) => (
                          <li key={j} className="text-[13px] text-text-secondary flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6 stagger-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-primary" />
          <h2 className="text-[18px] font-semibold text-primary">
            {lang === 'hi' ? 'आज के कार्य' : "Today's Tasks"}
          </h2>
        </div>
        <button
          onClick={() => setMode('ai')}
          className="flex items-center gap-1 text-[13px] text-primary font-medium"
        >
          <Sparkles size={14} />
          {lang === 'hi' ? 'AI योजना' : 'AI plan'}
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-primary to-[#2563AC] rounded-2xl p-4 text-white mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] opacity-80 font-medium">
              {lang === 'hi' ? 'कुल वसूली योग्य राशि' : 'Total recoverable'}
            </p>
            <p className="text-[22px] font-bold mt-0.5">
              ₹{totalBenefit.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] opacity-80 font-medium">
              {lang === 'hi' ? 'अनुमानित समय' : 'Est. time'}
            </p>
            <div className="flex items-center gap-1 mt-0.5 justify-end">
              <Clock size={14} />
              <span className="text-[16px] font-semibold">{totalTime} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-2.5">
        {visibleTasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-4 shadow-card flex items-start gap-3"
          >
            {/* Priority number */}
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[13px] font-bold text-primary">{task.priority}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-text-primary">{task.title}</p>
              {task.schemeName && (
                <p className="text-[12px] text-text-secondary mt-0.5">{task.schemeName}</p>
              )}

              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[12px] text-text-secondary">
                  <Clock size={12} />
                  {task.timeEstimate} min
                </span>
                <span className="flex items-center gap-1 text-[12px] font-medium text-green">
                  <IndianRupee size={12} />
                  {task.benefit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className={`w-5 h-5 rounded-full border-2 ${
                task.category === 'lapsed' ? 'border-danger' :
                task.category === 'at_risk' ? 'border-warning' :
                'border-green'
              } flex items-center justify-center`}>
                <CheckCircle size={14} className={
                  task.category === 'lapsed' ? 'text-danger' :
                  task.category === 'at_risk' ? 'text-warning' :
                  'text-green'
                } />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show more / Complete All */}
      <div className="flex items-center gap-2 mt-3">
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex-1 text-[13px] font-medium text-primary py-2.5 rounded-xl border border-primary/20 hover:bg-primary-light/30 transition-colors"
          >
            {showAll
              ? (lang === 'hi' ? 'कम दिखाएँ' : 'Show less')
              : (lang === 'hi' ? `${tasks.length - 3} और कार्य देखें` : `Show ${tasks.length - 3} more tasks`)}
          </button>
        )}
        <button
          onClick={() => {}}
          className="btn-primary flex-1 text-[13px]"
          style={{ height: '44px' }}
        >
          <CheckCircle size={16} />
          {lang === 'hi' ? 'सभी पूर्ण करें' : 'Complete All'}
        </button>
      </div>
    </div>
  )
}
