import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import StatusChip from './StatusChip'
import { Shield, AlertTriangle, Clock, MapPin } from 'lucide-react'

const priorityColors = {
  Critical: { bg: 'bg-red-500/20', text: 'text-red-400', label_hi: 'गंभीर', label_en: 'Critical' },
  High: { bg: 'bg-amber-500/20', text: 'text-amber-400', label_hi: 'उच्च', label_en: 'High' },
  Medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', label_hi: 'मध्यम', label_en: 'Medium' },
  Low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label_hi: 'कम', label_en: 'Low' },
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', damping: 25, stiffness: 300 }}
      className="group relative overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 p-4 hover:bg-white/[0.1] hover:border-white/20 transition-all"
    >
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l ${item.status === 'lapsed' ? 'bg-red-500' : item.status === 'at_risk' ? 'bg-amber-500' : 'bg-green-500'}`} />
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold leading-tight text-white/90">
                {lang === 'hi' ? item.name_hi : item.name_en}
              </h3>
              <p className="text-[13px] text-white/50 mt-0.5">
                {lang === 'hi' ? item.name_en : item.name_hi}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <StatusChip status={item.status} label={statusLabels[item.status] || item.status} />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${priorityInfo.bg} ${priorityInfo.text}`}>
              {item.status === 'lapsed' ? <AlertTriangle size={12} /> : <Clock size={12} />}
              {lang === 'hi' ? priorityInfo.label_hi : priorityInfo.label_en}
            </span>
            <span className="text-[17px] font-bold text-green-400">{item.benefit_amount}</span>
          </div>

          <p className="text-[14px] text-white/60 mt-1 leading-snug">
            {lang === 'hi' ? item.reason_hi : item.reason_en}
          </p>

          {item.consequence_hi && (
            <p className="text-[12px] text-red-400/70 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> {lang === 'hi' ? item.consequence_hi : item.consequence_en}
            </p>
          )}

          {item.recovery && (
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 flex items-center gap-1">
                <Clock size={11} /> {item.recovery.estimated_minutes} {lang === 'hi' ? 'मिनट' : 'min'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                {lang === 'hi'
                  ? (item.recovery.difficulty_hi === 'Easy' ? 'आसान' : item.recovery.difficulty_hi === 'Medium' ? 'मध्यम' : 'कठिन')
                  : item.recovery.difficulty_en}
              </span>
              {item.recovery.office_visit_required && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 flex items-center gap-1">
                  <MapPin size={11} /> {lang === 'hi' ? 'कार्यालय जाना होगा' : 'Office visit'}
                </span>
              )}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAction?.(item)}
            className="mt-3 w-full h-[44px] rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-[14px] shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            {showApply ? t('result.apply') : t('result.fix')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
