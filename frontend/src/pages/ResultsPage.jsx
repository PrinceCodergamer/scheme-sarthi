import { useEffect, useState } from 'react'
import { useApp } from '../store/appStore'
import SchemeCard from '../components/SchemeCard'
import ExplainableDecision from '../components/ExplainableDecision'
import OfficialSourceCard from '../components/trust/OfficialSourceCard'
import TrustBar from '../components/trust/TrustBar'
import RevivalJourney from '../components/revival/RevivalJourney'
import ActionPlan from '../components/ActionPlan'
import { TrendingUp, AlertTriangle, Clock, CheckCircle, Shield, AlertCircle } from 'lucide-react'

export default function ResultsPage() {
  const { t, lang, scanResults, profile, setPage } = useApp()
  const [countUp, setCountUp] = useState(0)
  const [revivalScheme, setRevivalScheme] = useState(null)

  useEffect(() => {
    if (!scanResults?.total_benefit) return
    const target = scanResults.total_benefit
    const duration = 1500
    const steps = 30
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= target) {
        setCountUp(target)
        clearInterval(interval)
      } else {
        setCountUp(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [scanResults])

  if (!scanResults) return null

  const { results, estimated_time_minutes, smart_recommendations } = scanResults
  const name = profile?.name || 'User'

  const lapsedCount = results.lapsed.length
  const atRiskCount = results.at_risk.length
  const eligibleCount = results.eligible_unclaimed.length
  const totalSchemes = lapsedCount + atRiskCount + eligibleCount
  const urgentCount = lapsedCount + atRiskCount

  const handleAction = (item) => {
    setRevivalScheme(item)
  }

  if (revivalScheme) {
    return (
      <RevivalJourney
        scheme={revivalScheme}
        onClose={() => setRevivalScheme(null)}
        profile={profile}
      />
    )
  }

  const sections = [
    {
      key: 'lapsed',
      icon: AlertTriangle,
      color: '#D93025',
      bg: 'rgba(217,48,37,0.06)',
      items: results.lapsed,
      emptyMsg: t('empty.no_lapsed'),
    },
    {
      key: 'at_risk',
      icon: Clock,
      color: '#F5A623',
      bg: 'rgba(245,166,35,0.06)',
      items: results.at_risk,
      emptyMsg: t('empty.no_at_risk'),
    },
    {
      key: 'eligible_unclaimed',
      icon: CheckCircle,
      color: '#138808',
      bg: 'rgba(19,136,8,0.06)',
      items: results.eligible_unclaimed,
      emptyMsg: t('empty.no_eligible'),
    },
  ]

  return (
    <div className="pb-32 px-4 pt-4">
      <TrustBar compact />

      {/* Impact Summary Dashboard */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white mb-6 stagger-1">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={20} />
          <span className="text-[14px] font-medium opacity-90">
            {name}{lang === 'hi' ? ' जी, आपका सारांश' : ', your summary'}
          </span>
        </div>

        <p className="text-[28px] font-bold">
          ₹{countUp.toLocaleString('en-IN')}
          <span className="text-[14px] font-normal opacity-80 ml-1">
            {lang === 'hi' ? '/वर्ष वसूली योग्य' : '/year recoverable'}
          </span>
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-[20px] font-bold">{totalSchemes}</p>
            <p className="text-[11px] opacity-80">{lang === 'hi' ? 'योजनाएँ' : 'Schemes'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-[20px] font-bold text-[#FF6B6B]">{urgentCount}</p>
            <p className="text-[11px] opacity-80">{lang === 'hi' ? 'तत्काल कार्रवाई' : 'Urgent'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <p className="text-[20px] font-bold">{estimated_time_minutes || 15}</p>
            <p className="text-[11px] opacity-80">{lang === 'hi' ? 'मिनट अनुमानित' : 'Min est.'}</p>
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      {smart_recommendations && smart_recommendations.length > 0 && (
        <div className="mb-6 stagger-1">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} color="#1B4B8F" />
            <h2 className="text-[18px] font-semibold text-primary">Smart Recommendations</h2>
          </div>
          <div className="space-y-2">
            {smart_recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-primary-light/50 rounded-xl p-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{rec.title || rec.action}</p>
                  <p className="text-[12px] text-text-secondary mt-0.5">{rec.description || rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan */}
      <ActionPlan scanResults={{lapsed: results.lapsed, at_risk: results.at_risk, eligible_unclaimed: results.eligible_unclaimed, not_eligible: results.not_eligible || []}} />

      {/* Scheme cards by category */}
      {sections.map((section, si) => (
        <div key={section.key} className={`mb-6 ${si === 0 ? 'stagger-2' : si === 1 ? 'stagger-3' : 'stagger-4'}`}>
          <div className="flex items-center gap-2 mb-3">
            <section.icon size={18} color={section.color} />
            <h2 className="text-[18px] font-semibold" style={{ color: section.color }}>
              {t(`result.${section.key === 'eligible_unclaimed' ? 'eligible' : section.key}`)}
            </h2>
            <span className="text-[13px] text-text-secondary font-medium">({section.items.length})</span>
          </div>

          {section.items.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 shadow-card text-center">
              <p className="text-[14px] text-text-secondary">{section.emptyMsg}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={item.scheme_id} className="space-y-2">
                  <SchemeCard
                    item={item}
                    index={i}
                    onAction={handleAction}
                    showApply={section.key === 'eligible_unclaimed'}
                  />
                  {/* Explain Decision */}
                  {(section.key === 'lapsed' || section.key === 'at_risk') && (
                    <ExplainableDecision scheme={item} />
                  )}
                  {/* Start Revival */}
                  {(section.key === 'lapsed' || section.key === 'at_risk') && (
                    <button
                      onClick={() => setRevivalScheme(item)}
                      className="btn-primary text-[13px]"
                    >
                      Start Revival
                    </button>
                  )}
                  {/* Official Sources */}
                  {item.sources && (
                    <OfficialSourceCard sources={item.sources} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
