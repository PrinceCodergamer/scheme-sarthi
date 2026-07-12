import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../store/appStore'
import { ChevronRight, ArrowLeft } from 'lucide-react'

const questions = [
  { key: 'dob', type: 'date', icon: '🎂' },
  { key: 'gender', type: 'choice', icon: '👤', options: ['male', 'female', 'other'] },
  { key: 'state', type: 'choice', icon: '🗺️', options: ['up', 'bihar', 'mp', 'rajasthan', 'maharashtra', 'delhi', 'tn', 'karnataka', 'gujarat', 'wb', 'odisha', 'ap'] },
  { key: 'district', type: 'text', icon: '📍' },
  { key: 'occupation', type: 'choice', icon: '💼', options: ['farmer', 'student', 'worker', 'senior'] },
  { key: 'land_owner', type: 'yesno', icon: '🌾' },
  { key: 'land_acres', type: 'number', icon: '📏', dependsOn: { key: 'land_owner', value: true } },
  { key: 'annual_income', type: 'choice', icon: '💰', options: ['0-50000', '50000-100000', '100000-200000', '200000-500000', '500000+'] },
  { key: 'schemes', type: 'multiselect', icon: '📋' },
  { key: 'bank_account_changed', type: 'yesno', icon: '🏦' },
]

function isQuestionVisible(q, answers) {
  if (!q.dependsOn) return true
  return answers[q.dependsOn.key] === q.dependsOn.value
}

function getVisibleIndices(answers) {
  return questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => isQuestionVisible(q, answers))
    .map(({ i }) => i)
}

export default function ProfilerPage() {
  const { t, lang, createProfile, addEnrollments, setPage, whatsappPhone } = useApp()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [answers, setAnswers] = useState({
    dob: '', gender: '', state: '', district: '', occupation: '',
    land_owner: null, land_acres: '', annual_income: '',
    schemes: [],
    last_payment_dates: {},
    bank_account_changed: null,
  })

  // step is index into raw questions array. We find the next/prev visible one.
  const visibleIndices = getVisibleIndices(answers)
  const currentVisiblePos = visibleIndices.indexOf(step)
  const totalSteps = visibleIndices.length
  const currentQ = questions[step] || questions[0]
  const progress = ((currentVisiblePos + 1) / totalSteps) * 100
  const isLast = currentVisiblePos >= totalSteps - 1

  const goNext = () => {
    setDirection('forward')
    const curPos = visibleIndices.indexOf(step)
    if (curPos >= 0 && curPos < visibleIndices.length - 1) {
      setStep(visibleIndices[curPos + 1])
    }
  }

  const goPrev = () => {
    setDirection('back')
    const curPos = visibleIndices.indexOf(step)
    if (curPos > 0) {
      setStep(visibleIndices[curPos - 1])
    }
  }

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  const calcAge = (dobStr) => {
    if (!dobStr) return 0
    const bd = new Date(dobStr)
    const today = new Date()
    let a = today.getFullYear() - bd.getFullYear()
    const m = today.getMonth() - bd.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--
    return a
  }

  const handleFinish = async () => {
    const ageFromDob = calcAge(answers.dob)
    const profileData = {
      name: 'User',
      age: ageFromDob,
      date_of_birth: answers.dob || null,
      gender: answers.gender,
      state: answers.state === 'up' ? 'Uttar Pradesh' : answers.state,
      district: answers.district,
      occupation: answers.occupation,
      land_owner: answers.land_owner === true,
      land_acres: parseFloat(answers.land_acres) || 0,
      annual_income: answers.annual_income,
      bank_account_changed: answers.bank_account_changed === true,
      phone: whatsappPhone || undefined,
    }

    try {
      const result = await createProfile(profileData)
      if (answers.schemes.length > 0) {
        const enrollments = answers.schemes.map(sid => ({
          scheme_id: sid,
          last_payment_date: answers.last_payment_dates[sid] || null
        }))
        await addEnrollments(enrollments)
      }
      setPage('scanning')
    } catch (err) {
      console.error('Profile creation error:', err)
    }
  }

  const canProceed = () => {
    const k = currentQ.key
    const v = answers[k]
    if (k === 'dob') return v && v.length === 10
    if (k === 'district') return v && v.length > 0
    if (k === 'schemes') return true
    if (k === 'land_acres') return true
    return v !== null && v !== ''
  }

  const renderQuestion = () => {
    const q = currentQ
    const qClass = "text-text-primary text-center text-xl font-semibold mb-6"
    const optBase = "px-6 py-4 rounded-xl font-semibold text-base transition-all min-w-[100px] border-2"
    const optSelected = "bg-primary text-white shadow-md border-primary"
    const optDefault = "bg-white text-text-secondary border-neutral-200 hover:border-primary hover:text-primary"
    const inputClass = "w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-text-primary placeholder:text-neutral-400 text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"

    if (q.key === 'dob') {
      return (
        <div className="text-center">
          <p className={qClass}>{lang === 'hi' ? 'आपकी जन्म तिथि क्या है?' : 'What is your date of birth?'}</p>
          <input
            type="date"
            value={answers.dob}
            onChange={e => handleAnswer('dob', e.target.value)}
            className={`${inputClass} text-[18px] w-48 mx-auto`}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      )
    }

    if (q.key === 'gender') {
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.gender')}</p>
          <div className="flex gap-3 justify-center">
            {q.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer('gender', opt)}
                className={`${optBase} ${answers.gender === opt ? optSelected : optDefault}`}
                style={{ minHeight: '52px' }}>
                {t(`gender.${opt}`)}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (q.key === 'state') {
      const states = ['up', 'bihar', 'mp', 'rajasthan', 'maharashtra', 'delhi', 'tn', 'karnataka', 'gujarat', 'wb', 'odisha', 'ap']
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.state')}</p>
          <div className="grid grid-cols-2 gap-3">
            {states.map(s => (
              <button key={s} onClick={() => handleAnswer('state', s)}
                className={`px-4 py-3 rounded-2xl font-medium text-[15px] transition-all border border-white/10 ${
                  answers.state === s ? optSelected : optDefault
                }`} style={{ minHeight: '52px' }}>
                {t(`state.${s}`)}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (q.key === 'district') {
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.district')}</p>
          <input type="text" value={answers.district}
            onChange={e => handleAnswer('district', e.target.value)}
            className={inputClass}
            placeholder={lang === 'hi' ? 'जिले का नाम' : 'District name'} />
        </div>
      )
    }

    if (q.key === 'occupation') {
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.occupation')}</p>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer('occupation', opt)}
                className={`px-4 py-5 rounded-2xl font-semibold text-[16px] transition-all border border-white/10 ${
                  answers.occupation === opt ? optSelected : optDefault
                }`} style={{ minHeight: '64px' }}>
                {t(`occ.${opt}`)}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (q.key === 'land_owner') {
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.land')}</p>
          <div className="flex gap-3 justify-center">
            {[true, false].map(val => (
              <button key={val} onClick={() => handleAnswer('land_owner', val)}
                className={`${optBase} min-w-[120px] ${
                  answers.land_owner === val ? optSelected : optDefault
                }`} style={{ minHeight: '52px' }}>
                {t(val ? 'yes' : 'no')}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (q.key === 'land_acres') {
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.land_acres')}</p>
          <div className="flex items-center justify-center gap-2">
            <input type="number" min="0" step="0.5" value={answers.land_acres}
              onChange={e => handleAnswer('land_acres', e.target.value)}
              className={`${inputClass} text-[24px] w-24`} placeholder="2" />
            <span className="text-[18px] font-medium text-white/50">{t('acres')}</span>
          </div>
        </div>
      )
    }

    if (q.key === 'annual_income') {
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.income')}</p>
          <div className="space-y-3">
            {q.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer('annual_income', opt)}
                className={`w-full px-4 py-4 rounded-2xl font-semibold text-[16px] transition-all text-left border border-white/10 ${
                  answers.annual_income === opt ? optSelected : optDefault
                }`} style={{ minHeight: '52px' }}>
                {t(`income.${opt}`)}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (q.key === 'schemes') {
      const schemeOptions = [
        { id: 'pm-kisan', name_hi: 'PM-KISAN सम्मान निधि', name_en: 'PM-KISAN' },
        { id: 'pm-fasal-bima', name_hi: 'फसल बीमा योजना', name_en: 'PM Fasal Bima' },
        { id: 'ayushman-bharat', name_hi: 'आयुष्मान भारत', name_en: 'Ayushman Bharat' },
        { id: 'vridha-pension-up', name_hi: 'वृद्धा पेंशन', name_en: 'Vridha Pension' },
        { id: 'nsp', name_hi: 'राष्ट्रीय छात्रवृत्ति', name_en: 'NSP Scholarship' },
        { id: 'pm-ujjwala', name_hi: 'उज्ज्वला योजना', name_en: 'PM Ujjwala' },
        { id: 'pm-awas-gramin', name_hi: 'आवास योजना', name_en: 'PM Awas Gramin' },
        { id: 'atal-pension', name_hi: 'अटल पेंशन', name_en: 'Atal Pension' },
        { id: 'pm-shram-yogi', name_hi: 'श्रम योगी मानधन', name_en: 'Shram Yogi' },
        { id: 'sukanya-samriddhi', name_hi: 'सुकन्या समृद्धि', name_en: 'Sukanya Samriddhi' },
        { id: 'mgnrega', name_hi: 'MGNREGA जॉब कार्ड', name_en: 'MGNREGA' },
        { id: 'up-kanya-sumangala', name_hi: 'कन्या सुमंगला', name_en: 'UP Kanya Sumangala' },
      ]
      return (
        <div>
          <p className={`${qClass} text-center`}>{t('profiler.schemes')}</p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {schemeOptions.map(s => {
              const selected = answers.schemes.includes(s.id)
              return (
                <div key={s.id} className="bg-white rounded-xl p-3 border border-neutral-200 card">
                  <button onClick={() => {
                    const next = selected ? answers.schemes.filter(x => x !== s.id) : [...answers.schemes, s.id]
                    handleAnswer('schemes', next)
                  }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      selected ? 'bg-primary text-white' : 'bg-neutral-50 text-text-secondary hover:text-primary'
                    }`} style={{ minHeight: '48px' }}>
                    {lang === 'hi' ? s.name_hi : s.name_en}
                  </button>
                  {selected && (
                    <div className="mt-2 px-2">
                      <p className="text-xs text-text-secondary mb-1">{t('profiler.last_payment')}</p>
                      <input type="date" value={answers.last_payment_dates[s.id] || ''}
                        onChange={e => {
                          const dates = { ...answers.last_payment_dates, [s.id]: e.target.value }
                          setAnswers(prev => ({ ...prev, last_payment_dates: dates }))
                        }}
                        className="form-input text-sm h-10" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (q.key === 'bank_account_changed') {
      return (
        <div className="text-center">
          <p className={qClass}>{t('profiler.bank_change')}</p>
          <div className="flex gap-3 justify-center">
            {[true, false].map(val => (
              <button key={val} onClick={() => handleAnswer('bank_account_changed', val)}
                className={`${optBase} min-w-[120px] ${
                  answers.bank_account_changed === val ? optSelected : optDefault
                }`} style={{ minHeight: '52px' }}>
                {t(val ? 'yes' : 'no')}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return <p className="text-center text-[18px] text-white/50">Question type not found</p>
  }

  const hasPrev = currentVisiblePos > 0

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-white to-primary-50">

      <div className="flex items-center justify-between px-4 py-3 relative z-10">
        <button onClick={goPrev} className="p-2 min-h-[44px] min-w-[44px]">
          {hasPrev ? <ArrowLeft size={22} className="text-text-secondary" /> : <div />}
        </button>
        <p className="text-sm text-text-secondary font-medium">
          {t('profiler.progress', { current: currentVisiblePos + 1, total: totalSteps })}
        </p>
        <div style={{ width: 44 }} />
      </div>

      <div className="mx-4 h-1.5 bg-neutral-100 rounded-full overflow-hidden relative z-10">
        <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col justify-between px-6 pb-6 pt-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction === 'forward' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'forward' ? -40 : 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="text-center mb-4">
              <span className="text-[40px]">{currentQ.icon}</span>
            </div>
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6">
          <button
            onClick={isLast ? handleFinish : goNext}
            disabled={!canProceed()}
            className="btn-primary"
          >
            {isLast ? t('profiler.done') : t('profiler.next')}
            {!isLast && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
