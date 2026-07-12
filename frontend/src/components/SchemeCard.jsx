import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import StatusChip from './StatusChip'
import { Shield, AlertTriangle, Clock, MapPin } from 'lucide-react'

const priorityColors = {
  Critical: { bg: 'bg-danger-light', text: 'text-danger', dot: '#D93025' },
  High: { bg: 'bg-warning-light', text: 'text-warning', dot: '#F5A623' },
  Medium: { bg: 'bg-primary-50', text: 'text-primary', dot: '#1B4B8F' },
  Low: { bg: 'bg-neutral-100', text: 'text-neutral-500', dot: '#868E96' },
}

export default function SchemeCard({ item, onAction, index = 0, showApply = false }) {
  const { t, lang } = useApp()

  const statusLabels = {
    lapsed: t('result.lapsed'),
    at_risk: t('result.at_risk'),
    eligible_unclaimed: t('result.eligible'),
    not_eligible: t('result.not_eligible'),
  }

  const priorityInfo = priorityColors[item.priority] || priorityColors.Medium
  const statusColor = item.status === 'lapsed' ? 'bg-danger' : item.status === 'at_risk' ? 'bg-warning' : 'bg-green'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', damping: 25, stiffness: 300 }}
      className="group relative overflow-hidden card p-4 hover:shadow-card-hover transition-all border border-neutral-100"
    >
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l ${statusColor}`} />
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold leading-tight text-text-primary">
                {lang === 'hi' ? item.name_hi : item.name_en}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {lang === 'hi' ? item.name_en : item.name_hi}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <StatusChip status={item.status} label={statusLabels[item.status] || item.status} />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold ${priorityInfo.bg} ${priorityInfo.text}`}>
              {item.status === 'lapsed' ? <AlertTriangle size={12} /> : <Clock size={12} />}
              {lang === 'hi' ? (item.priority === 'Critical' ? 'गंभीर' : item.priority === 'High' ? 'उच्च' : 'मध्यम') : item.priority}
            </span>
            <span className="text-base font-bold text-green">{item.benefit_amount}</span>
          </div>

          <p className="text-sm text-text-secondary mt-1 leading-snug">
            {lang === 'hi' ? item.reason_hi : item.reason_en}
          </p>

          {item.consequence_hi && (
            <p className="text-2xs text-danger/70 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> {lang === 'hi' ? item.consequence_hi : item.consequence_en}
            </p>
          )}

          {item.recovery && (
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className="text-2xs px-2 py-0.5 rounded-full bg-neutral-100 text-text-secondary flex items-center gap-1">
                <Clock size={11} /> {item.recovery.estimated_minutes} {lang === 'hi' ? 'मिनट' : 'min'}
              </span>
              <span className="text-2xs px-2 py-0.5 rounded-full bg-neutral-100 text-text-secondary">
                {lang === 'hi'
                  ? (item.recovery.difficulty_hi === 'Easy' ? 'आसान' : item.recovery.difficulty_hi === 'Medium' ? 'मध्यम' : 'कठिन')
                  : item.recovery.difficulty_en}
              </span>
              {item.recovery.office_visit_required && (
                <span className="text-2xs px-2 py-0.5 rounded-full bg-warning-light text-warning flex items-center gap-1">
                  <MapPin size={11} /> {lang === 'hi' ? 'कार्यालय जाना होगा' : 'Office visit'}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => onAction?.(item)}
            className="mt-3 w-full h-[44px] rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            {showApply ? t('result.apply') : t('result.fix')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
