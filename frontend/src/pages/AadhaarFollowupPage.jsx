import { useState } from 'react'
import { useApp } from '../store/appStore'
import { ArrowRight, ChevronRight } from 'lucide-react'

const schemeOptions = [
  { id: 'pm-kisan', name: 'PM-KISAN Samman Nidhi' },
  { id: 'pm-fasal-bima', name: 'PM Fasal Bima Yojana' },
  { id: 'ayushman-bharat', name: 'Ayushman Bharat' },
  { id: 'vridha-pension-up', name: 'Vridha Pension' },
  { id: 'nsp', name: 'NSP Scholarship' },
  { id: 'pm-ujjwala', name: 'PM Ujjwala Yojana' },
  { id: 'pm-awas-gramin', name: 'PM Awas Yojana (Gramin)' },
  { id: 'atal-pension', name: 'Atal Pension Yojana' },
  { id: 'mgnrega', name: 'MGNREGA Job Card' },
  { id: 'sukanya-samriddhi', name: 'Sukanya Samriddhi Yojana' },
]

export default function AadhaarFollowupPage() {
  const { lang, setPage, profile, setProfile, setProfileId, createProfile, addEnrollments } = useApp()
  const [schemes, setSchemes] = useState([])
  const [lastPaymentDates, setLastPaymentDates] = useState({})
  const [bankChanged, setBankChanged] = useState(null)
  const [extraInfo, setExtraInfo] = useState('')
  const [dob, setDob] = useState(profile?.date_of_birth || '')
  const [saving, setSaving] = useState(false)

  const handleToggleScheme = (id) => {
    setSchemes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleContinue = async () => {
    setSaving(true)
    const merged = {
      ...profile,
      schemes,
      last_payment_dates: lastPaymentDates,
      bank_account_changed: bankChanged === 'yes',
      extra_info: extraInfo,
      date_of_birth: dob || profile?.date_of_birth,
    }
    setProfile(merged)
    try {
      const result = await createProfile(merged)
      if (result?.profile_id) {
        setProfileId(result.profile_id)
        if (schemes.length > 0) {
          const enrollments = schemes.map(sid => ({
            scheme_id: sid,
            last_payment_date: lastPaymentDates[sid] || null
          }))
          await addEnrollments(enrollments)
        }
      }
      setPage('scanning')
    } catch (err) {
      console.error('Profile creation failed:', err)
      setSaving(false)
    }
  }

  const needsDob = !profile?.date_of_birth
  const canContinue = bankChanged !== null && (!needsDob || dob.trim())

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 bg-gradient-to-b from-white to-primary-50">
      <div className="flex-1">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
            <ChevronRight size={28} color="white" strokeWidth={1.5} className="rotate-90" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {lang === 'hi' ? 'कुछ और जानकारी' : 'A Few More Details'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {lang === 'hi' ? 'आपकी प्रोफ़ाइल से पहले ही लोड कर ली गई है' : 'Already loaded from your profile'}
          </p>
        </div>

        <div className="bg-green/5 border border-green/20 rounded-2xl p-3 mb-6">
          <p className="text-[12px] text-green font-medium text-center">
            ✓ Name, Age, Gender, State, District loaded from Aadhaar
          </p>
        </div>

        <div className="space-y-6">
          {needsDob && (
            <div>
              <h3 className="text-[16px] font-semibold mb-3">
                {lang === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}
              </h3>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="form-input"
                required
              />
            </div>
          )}
          <div>
            <h3 className="text-[16px] font-semibold mb-3">
              {lang === 'hi' ? 'आप वर्तमान में किन योजनाओं में पंजीकृत हैं?' : 'Currently Enrolled Schemes'}
            </h3>
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {schemeOptions.map(s => {
                const selected = schemes.includes(s.id)
                return (
                  <div key={s.id} className="bg-white rounded-xl p-3 shadow-card">
                    <button
                      onClick={() => handleToggleScheme(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                        selected ? 'bg-primary text-white' : 'bg-primary-light/50 text-text-primary'
                      }`}
                    >
                      {s.name}
                    </button>
                    {selected && (
                      <div className="mt-2 px-2">
                        <label className="text-[12px] text-text-secondary">
                          {lang === 'hi' ? 'अंतिम भुगतान तिथि' : 'Last Payment Date'}
                        </label>
                        <input
                          type="date"
                          value={lastPaymentDates[s.id] || ''}
                          onChange={e => setLastPaymentDates(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="form-input h-10 text-[13px] mt-1"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold mb-3">
              {lang === 'hi' ? 'क्या हाल ही में बैंक खाता बदला है?' : 'Bank Account Changed Recently?'}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setBankChanged('yes')}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  bankChanged === 'yes' ? 'bg-primary text-white shadow-md' : 'bg-primary-light text-primary border-2 border-primary-light'
                }`}
              >
                {lang === 'hi' ? 'हाँ' : 'Yes'}
              </button>
              <button
                onClick={() => setBankChanged('no')}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  bankChanged === 'no' ? 'bg-primary text-white shadow-md' : 'bg-primary-light text-primary border-2 border-primary-light'
                }`}
              >
                {lang === 'hi' ? 'नहीं' : 'No'}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold mb-2">
              {lang === 'hi' ? 'कोई अतिरिक्त जानकारी?' : 'Any Other Info?'}
            </h3>
            <textarea
              value={extraInfo}
              onChange={e => setExtraInfo(e.target.value)}
              placeholder={lang === 'hi' ? 'कुछ और बताना चाहते हैं...' : 'Anything else you\'d like to share...'}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleContinue} disabled={!canContinue || saving} className="btn-primary">
          {lang === 'hi' ? 'जाँच शुरू करें' : 'Start Scanning'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
