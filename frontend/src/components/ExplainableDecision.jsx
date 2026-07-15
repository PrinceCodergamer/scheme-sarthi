import { useState } from 'react'
import { useApp } from '../store/appStore'
import { ChevronDown, ChevronUp, Check, X, BarChart3, ListChecks } from 'lucide-react'

export default function ExplainableDecision({ scheme }) {
  const { t } = useApp()
  const [expanded, setExpanded] = useState(false)

  if (!scheme) return null

  const matched = scheme.matched_rules || []
  const failed = scheme.failed_rules || []
  const confidence = scheme.confidence || 0
  const totalRules = matched.length + failed.length

  const renderRuleRow = (rule, matched) => {
    const operatorMap = {
      gte: '≥', lte: '≤', gt: '>', lt: '<', eq: '=', neq: '≠', in: '∈',
    }
    const op = operatorMap[rule.operator] || rule.operator || '='
    return (
      <div key={rule.field || Math.random()} className="flex items-center gap-2 py-2 px-3 rounded-xl bg-surface/50 text-[12px]">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${matched ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {matched ? <Check size={12} className="text-green-400" /> : <X size={12} className="text-red-400" />}
        </div>
        <span className="font-medium text-text-primary min-w-[80px]">{rule.field}</span>
        <span className="text-text-muted">{op}</span>
        <span className="font-medium text-text-primary">{String(rule.expected)}</span>
        <span className="text-text-muted mx-1">→</span>
        <span className={`font-medium ${matched ? 'text-green-400' : 'text-red-400'}`}>{String(rule.actual)}</span>
      </div>
    )
  }

  const confidencePercent = typeof confidence === 'number'
    ? confidence
    : confidence === 'High' ? 85
    : confidence === 'Medium' ? 60
    : confidence === 'Low' ? 30
    : 50

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[48px]"
      >
        <span className="text-[14px] font-semibold text-text-primary">
          {scheme.status === 'eligible_unclaimed' ? t('explain.title') : t('explain.title_alt')}
        </span>
        {expanded ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {matched.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-green-400 flex items-center gap-1.5 mb-2">
                <Check size={14} /> {t('explain.you_match')}
                <span className="text-text-muted font-normal">({matched.length})</span>
              </h4>
              <div className="space-y-1">
                {matched.map(r => renderRuleRow(r, true))}
              </div>
            </div>
          )}

          {failed.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-red-400 flex items-center gap-1.5 mb-2">
                <X size={14} /> {t('explain.you_dont_match')}
                <span className="text-text-muted font-normal">({failed.length})</span>
              </h4>
              <div className="space-y-1">
                {failed.map(r => renderRuleRow(r, false))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5 mb-2">
              <BarChart3 size={14} /> {t('explain.confidence')}{typeof confidence === 'number' ? `${confidence}%` : confidence}
            </h4>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  confidencePercent >= 70 ? 'bg-green-500' : confidencePercent >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <ListChecks size={14} />
            {t('explain.rules_evaluated')}{matched.length} of {totalRules}
          </div>
        </div>
      )}
    </div>
  )
}
