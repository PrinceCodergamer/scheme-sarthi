import { useApp } from '../../store/appStore'
import { Users, FileText, IndianRupee, BarChart3, ListChecks, ArrowLeft, Shield } from 'lucide-react'

const mockData = {
  profilesScanned: 1284,
  applicationsGenerated: 347,
  benefitsRecovered: 1845000,
  recoveryRate: 73,
  commonLapseReasons: [
    { reason: 'eKYC not completed', count: 423, pct: 33 },
    { reason: 'Bank account changed', count: 287, pct: 22 },
    { reason: 'Income threshold exceeded', count: 198, pct: 15 },
    { reason: 'Residence proof expired', count: 156, pct: 12 },
    { reason: 'Age limit exceeded', count: 112, pct: 9 },
    { reason: 'Other', count: 108, pct: 9 },
  ],
  commonSchemes: [
    { name: 'PM-KISAN Samman Nidhi', count: 312 },
    { name: 'Vridha Pension (UP)', count: 198 },
    { name: 'Ayushman Bharat', count: 176 },
    { name: 'PM Ujjwala Yojana', count: 145 },
    { name: 'PM Fasal Bima Yojana', count: 112 },
  ],
}

export default function AdminDashboard() {
  const { t, setPage } = useApp()

  const circleCircumference = 2 * Math.PI * 54

  return (
    <div className="pb-8 px-5 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setPage('results')} className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-surface-light transition-all">
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Shield size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white leading-tight">{t('admin.title')}</h1>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
              {t('admin.demo_badge')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Users size={16} className="text-blue-400" />
          </div>
          <p className="text-[20px] font-bold text-white">{mockData.profilesScanned.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-text-muted font-medium">{t('admin.profiles_scanned')}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
            <FileText size={16} className="text-purple-400" />
          </div>
          <p className="text-[20px] font-bold text-white">{mockData.applicationsGenerated}</p>
          <p className="text-[10px] text-text-muted font-medium">{t('admin.applications')}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <IndianRupee size={16} className="text-green-400" />
          </div>
          <p className="text-[20px] font-bold text-green-400">
            ₹{(mockData.benefitsRecovered / 100000).toFixed(1)}L
          </p>
          <p className="text-[10px] text-text-muted font-medium">{t('admin.benefits_recovered')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-text-muted mb-4 flex items-center gap-1.5 uppercase tracking-wide">
            <BarChart3 size={14} className="text-blue-400" /> {t('admin.recovery_rate')}
          </h3>
          <div className="flex justify-center">
            <div className="relative" style={{ width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="#22C55E"
                  strokeWidth="8"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={circleCircumference - (circleCircumference * mockData.recoveryRate) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90, 60, 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[22px] font-bold text-green-400">{mockData.recoveryRate}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-text-muted mb-4 flex items-center gap-1.5 uppercase tracking-wide">
            <ListChecks size={14} className="text-blue-400" /> {t('admin.top_schemes')}
          </h3>
          <div className="space-y-2.5">
            {mockData.commonSchemes.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[12px] py-1.5">
                <span className="text-text-primary truncate mr-2">{s.name}</span>
                <span className="font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-[11px]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-[13px] font-semibold text-text-muted mb-4 flex items-center gap-1.5 uppercase tracking-wide">
          <BarChart3 size={14} className="text-blue-400" /> {t('admin.common_lapse_reasons')}
        </h3>
        <div className="space-y-3.5">
          {mockData.commonLapseReasons.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="text-text-primary">{item.reason}</span>
                <span className="font-semibold text-text-muted">{item.pct}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-text-muted text-center mt-8 opacity-50">
        {t('admin.footer_note')}
      </p>
    </div>
  )
}
