import { useState } from 'react'
import { useApp } from '../store/appStore'
import { Fingerprint, Loader, CheckCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react'

const demoAadhaarData = {
  '1234-5678-9012': {
    name: 'Mohan Singh',
    age: 62,
    gender: 'male',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    phone: '+91 98765 43210',
    occupation: 'farmer',
    annual_income: '100000-200000',
    land_owner: true,
    land_acres: 2.5,
    bank_account_changed: false,
  },
  '9876-5432-1098': {
    name: 'Sunita Devi',
    age: 45,
    gender: 'female',
    state: 'Bihar',
    district: 'Patna',
    phone: '+91 87654 32109',
    occupation: 'worker',
    annual_income: '50000-100000',
    land_owner: false,
    land_acres: 0,
    bank_account_changed: true,
  },
}

export default function AadhaarPage() {
  const { lang, setPage, setProfile, setProfileId, whatsappPhone } = useApp()
  const [aadhaar, setAadhaar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [kycData, setKycData] = useState(null)

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12)
    const parts = []
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4))
    }
    return parts.join('-')
  }

  const handleVerify = async () => {
    const raw = aadhaar.replace(/-/g, '')
    if (raw.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const base = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${base}/aadhaar/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar }),
      })
      if (res.ok) {
        const data = await res.json()
        setKycData(data.data)
      } else {
        const match = demoAadhaarData[aadhaar]
        if (match) {
          setTimeout(() => {
            setKycData(match)
            setLoading(false)
          }, 800)
          return
        } else {
          setProfile(null)
          setProfileId(null)
          setTimeout(() => {
            setPage('profiler')
          }, 1500)
          throw new Error('Aadhaar not recognised. Starting manual onboarding.')
        }
      }
    } catch (e) {
      if (e.message !== 'Aadhaar not recognised. Starting manual onboarding.') {
        const match = demoAadhaarData[aadhaar]
        if (match) {
          setTimeout(() => {
            setKycData(match)
            setLoading(false)
          }, 800)
          return
        }
        setError(e.message || 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!kycData) return
    const profileData = {
      name: kycData.name,
      age: kycData.age,
      date_of_birth: kycData.dob || null,
      gender: kycData.gender,
      state: kycData.state,
      district: kycData.district,
      phone: whatsappPhone || kycData.phone,
      occupation: kycData.occupation || 'farmer',
      annual_income: kycData.annual_income || '100000',
      land_owner: Boolean(kycData.land_owner),
      land_acres: kycData.land_acres || 0,
      bank_account_changed: Boolean(kycData.bank_account_changed),
    }
    setProfile(profileData)
    setProfileId('aadhaar-' + Date.now())
    setPage('aadhaar_followup')
  }

  const handleStartFresh = () => {
    setKycData(null)
    setAadhaar('')
    setError('')
  }

  if (error && !kycData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-white to-primary-50">
        <div className="w-16 h-16 rounded-full bg-warning-light flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-warning" />
        </div>
        <p className="text-base font-medium text-text-primary text-center mb-2">
          {lang === 'hi' ? 'आधार की पहचान नहीं हुई' : 'Aadhaar not recognised'}
        </p>
        <p className="text-sm text-text-secondary text-center">
          {lang === 'hi' ? 'मैन्युअल ऑनबोर्डिंग शुरू हो रही है...' : 'Starting manual onboarding...'}
        </p>
        <div className="mt-4 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-b from-white to-primary-50">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-glow">
          <Fingerprint size={32} color="white" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-text-primary">
          {lang === 'hi' ? 'आधार वेरिफिकेशन' : 'Aadhaar Verification'}
        </h1>
        <p className="text-sm text-text-secondary text-center mb-8 max-w-xs">
          {lang === 'hi' ? 'अपना आधार नंबर दर्ज करें' : 'Enter your Aadhaar number'}
        </p>

        {!kycData ? (
          <div className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {lang === 'hi' ? 'आधार नंबर' : 'Aadhaar Number'}
              </label>
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => setAadhaar(formatAadhaar(e.target.value))}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={14}
                className="form-input text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || aadhaar.replace(/-/g, '').length !== 12}
              className="btn-primary w-full"
            >
              {loading ? (
                <Loader size={20} className="animate-spin" />
              ) : lang === 'hi' ? 'वेरिफाई करें' : 'Verify'}
            </button>

            <p className="text-xs text-text-secondary text-center">
              Demo Aadhaars: 1234-5678-9012 or 9876-5432-1098
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle size={20} />
              <div>
                <p className="font-medium text-[16px]">Identity Verified (Demo)</p>
                <p className="text-[13px] text-text-secondary">Welcome back, {kycData.name}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-green/20 divide-y divide-gray-100">
              {[
                { label: 'Name', value: kycData.name },
                { label: 'Age', value: kycData.age },
                { label: 'Gender', value: kycData.gender === 'male' ? 'Male' : kycData.gender === 'female' ? 'Female' : kycData.gender },
                { label: 'State', value: kycData.state },
                { label: 'District', value: kycData.district },
                { label: 'Phone', value: kycData.phone },
              ].map((item, i) => (
                <div key={i} className="flex justify-between px-4 py-3">
                  <span className="text-text-secondary text-sm">{item.label}</span>
                  <span className="font-medium text-sm">{item.value}</span>
                </div>
              ))}
            </div>

            <p className="text-[13px] text-green font-medium text-center">Profile loaded successfully</p>

            <button onClick={handleContinue} className="btn-primary w-full flex items-center justify-center gap-2">
              Continue
              <ArrowRight size={18} />
            </button>

            <button onClick={handleStartFresh} className="btn-secondary w-full flex items-center justify-center gap-2">
              <RotateCcw size={16} />
              Start Fresh
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
