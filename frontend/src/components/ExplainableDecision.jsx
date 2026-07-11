import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, X, BarChart3, ListChecks } from 'lucide-react'

export default function ExplainableDecision({ scheme }) {
  const [expanded, setExpanded] = useState(false)

  if (!scheme) return null

  const matched = scheme.matched_rules || []
  const failed = scheme.failed_rules || []
  const confidence = scheme.confidence || 0
  const totalRules = matched.length + failed.length

  const renderRuleRow = (rule, matched) => {
    const operatorMap = {
      gte: '≥',
      lte: '≤',
      gt: '>',
      lt: '<',
      eq: '=',
      neq: '≠',
      in: '∈',
    }
    const op = operatorMap[rule.operator] || rule.operator || '='
    return (
      <div key={rule.field || Math.random()} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white text-[12px]">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${matched ? 'bg-green/10' : 'bg-danger/10'}`}>
          {matched ? <Check size={12} className="text-green" /> : <X size={12} className="text-danger" />}
        </div>
        <span className="font-medium text-text-primary min-w-[80px]">{rule.field}</span>
        <span className="text-text-secondary">{op}</span>
        <span className="font-medium text-text-primary">{String(rule.expected)}</span>
        <span className="text-text-secondary mx-1">→</span>
        <span className={`font-medium ${matched ? 'text-green' : 'text-danger'}`}>{String(rule.actual)}</span>
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
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ minHeight: '48px' }}
      >
        <span className="text-[14px] font-semibold text-text-primary">
          {scheme.status === 'eligible_unclaimed' ? '📋 Decision Details' : '🔍 Explain Decision'}
        </span>
        {expanded ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {matched.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-green flex items-center gap-1.5 mb-2">
                <Check size={14} /> You Match
                <span className="text-text-secondary font-normal">({matched.length})</span>
              </h4>
              <div className="space-y-1">
                {matched.map(r => renderRuleRow(r, true))}
              </div>
            </div>
          )}

          {failed.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-danger flex items-center gap-1.5 mb-2">
                <X size={14} /> You Don't Match
                <span className="text-text-secondary font-normal">({failed.length})</span>
              </h4>
              <div className="space-y-1">
                {failed.map(r => renderRuleRow(r, false))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[13px] font-semibold text-text-primary flex items-center gap-1.5 mb-2">
              <BarChart3 size={14} /> Confidence: {typeof confidence === 'number' ? `${confidence}%` : confidence}
            </h4>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  confidencePercent >= 70 ? 'bg-green' : confidencePercent >= 40 ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-text-secondary">
            <ListChecks size={14} />
            Rules Evaluated: {totalRules === 0 ? `${matched.length} of ${totalRules}` : `${matched.length} of ${totalRules}`}
          </div>
        </div>
      )}
    </div>
  )
}
