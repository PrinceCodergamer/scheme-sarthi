import { useApp } from '../../store/appStore'
import { Users, FileText, IndianRupee, BarChart3, ListChecks, ArrowLeft } from 'lucide-react'

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
  const { lang, setPage } = useApp()

  const circleCircumference = 2 * Math.PI * 54

  return (
    <div className="pb-8 px-4 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setPage('results')} className="p-2" style={{ minHeight: '44px', minWidth: '44px' }}>
          <ArrowLeft size={22} className="text-primary" />
        </button>
        <h1 className="text-[20px] font-bold">Admin Dashboard</h1>
        <span className="text-[10px] bg-amber-50 text-warning px-2 py-0.5 rounded-full font-medium">Demo</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-3 shadow-card text-center">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-2">
            <Users size={16} className="text-primary" />
          </div>
          <p className="text-[20px] font-bold">{mockData.profilesScanned.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-text-secondary">Profiles Scanned</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-card text-center">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-2">
            <FileText size={16} className="text-primary" />
          </div>
          <p className="text-[20px] font-bold">{mockData.applicationsGenerated}</p>
          <p className="text-[10px] text-text-secondary">Applications</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-card text-center">
          <div className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-2">
            <IndianRupee size={16} className="text-green" />
          </div>
          <p className="text-[20px] font-bold text-green">
            ₹{(mockData.benefitsRecovered / 100000).toFixed(1)}L
          </p>
          <p className="text-[10px] text-text-secondary">Benefits Recovered</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="text-[13px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
            <BarChart3 size={14} /> Recovery Rate
          </h3>
          <div className="flex justify-center">
            <div className="countdown-ring" style={{ width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#E8ECF2" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="#138808"
                  strokeWidth="8"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={circleCircumference - (circleCircumference * mockData.recoveryRate) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90, 60, 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[22px] font-bold text-green">{mockData.recoveryRate}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="text-[13px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
            <ListChecks size={14} /> Top Schemes
          </h3>
          <div className="space-y-2">
            {mockData.commonSchemes.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-text-primary truncate mr-2">{s.name}</span>
                <span className="font-semibold text-primary">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="text-[13px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
          <BarChart3 size={14} /> Common Lapse Reasons
        </h3>
        <div className="space-y-3">
          {mockData.commonLapseReasons.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-text-primary">{item.reason}</span>
                <span className="font-semibold text-text-secondary">{item.pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-text-secondary text-center mt-6 opacity-50">
        Demo Dashboard | All data is mock/simulated
      </p>
    </div>
  )
}
