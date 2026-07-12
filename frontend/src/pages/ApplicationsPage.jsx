import { useEffect, useState, useCallback } from 'react'
import { useApp } from '../store/appStore'
import ProgressStepper from '../components/ProgressStepper'
import { ArrowLeft, ChevronRight, PartyPopper, TrendingUp, Bell, Calendar } from 'lucide-react'

export default function ApplicationsPage({ onBack }) {
  const { t, lang, applications, fetchApplications, advanceApplication, setPage, scanResults } = useApp()
  const [selectedApp, setSelectedApp] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fireConfetti = useCallback(async () => {
    try {
      const canvasConfetti = (await import('canvas-confetti')).default
      canvasConfetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#FF9933', '#FFFFFF', '#138808', '#1B4B8F']
      })
      setTimeout(() => {
        canvasConfetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.4, x: 0.3 },
          colors: ['#FF9933', '#138808']
        })
        canvasConfetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.4, x: 0.7 },
          colors: ['#FFFFFF', '#1B4B8F']
        })
      }, 300)
    } catch {}
  }, [])

  const handleAdvance = async (appId) => {
    const result = await advanceApplication(appId)
    if (result.stage >= 4) {
      setShowConfetti(true)
      fireConfetti()
    }
  }

  const stageLabels = ['submitted', 'verified', 'block_office', 'sanctioned', 'restored']

  if (selectedApp) {
    const isRestored = selectedApp.stage >= 4

    if (isRestored && showConfetti) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green/10 flex items-center justify-center mb-4 animate-bounce">
            <PartyPopper size={40} className="text-green" />
          </div>
          <p className="text-[22px] font-bold text-green mb-2">
            {lang === 'hi' ? 'बधाई हो! 🎉' : 'Congratulations! 🎉'}
          </p>
          <p className="text-[16px] font-semibold text-text-primary mb-1">
            {lang === 'hi' ? 'आपका लाभ बहाल हो गया है' : 'Your benefit has been restored'}
          </p>
          <p className="text-[14px] text-text-secondary mb-6">
            {lang === 'hi' ? 'आपकी योजनाएँ अब सुरक्षित हैं।' : 'Your schemes are now protected.'}
          </p>

          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white w-full max-w-xs mb-6">
            <p className="text-[13px] opacity-80 mb-1">
              {lang === 'hi' ? 'अनुमानित वार्षिक वसूली' : 'Estimated Annual Recovery'}
            </p>
            <p className="text-[28px] font-bold">
              ₹{scanResults?.total_benefit?.toLocaleString('en-IN') || '21,000'}
              <span className="text-[13px] font-normal opacity-80 ml-1">{lang === 'hi' ? '/वर्ष' : '/year'}</span>
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Calendar size={14} />
              <span className="text-[12px] opacity-80">
                {lang === 'hi' ? 'अगला रिमाइंडर: 365 दिन में' : 'Next reminder: in 365 days'}
              </span>
            </div>
          </div>

          <button onClick={() => setPage('results')} className="btn-primary max-w-xs">
            {lang === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}
          </button>
        </div>
      )
    }

    return (
      <div className="pb-8">
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => { setSelectedApp(null); setShowConfetti(false) }} className="p-2" style={{ minHeight: '44px', minWidth: '44px' }}>
            <ArrowLeft size={22} className="text-primary" />
          </button>
          <h1 className="text-[18px] font-bold truncate">
            {lang === 'hi' ? selectedApp.name_hi : selectedApp.name_en}
          </h1>
        </div>

        <div className="px-4 mb-6">
          <div className="bg-primary-light rounded-2xl p-4 mb-4">
            <p className="text-[15px] font-bold">{selectedApp.benefit_amount}</p>
            <p className="text-[13px] text-text-secondary mt-1">
              {lang === 'hi' ? 'आवेदन #' : 'Application #'}{selectedApp.id}
            </p>
          </div>

          <ProgressStepper currentStage={selectedApp.stage} lang={lang} />

          {selectedApp.stage < 4 && (
            <button
              onClick={() => handleAdvance(selectedApp.id)}
              className="btn-primary mt-6"
            >
              {t('tracker.advance')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-32 px-4 pt-4">
      <h1 className="text-[20px] font-bold mb-4">{t('nav.applications')}</h1>

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-card text-center mt-8">
          <div className="text-[40px] mb-3">📋</div>
          <p className="text-[16px] font-medium text-text-primary mb-1">{t('empty.no_applications')}</p>
          <p className="text-[14px] text-text-secondary">{t('empty.applications_desc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app, i) => (
            <div key={app.id} className={`bg-white rounded-2xl p-4 shadow-card stagger-${(i % 5) + 1}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold">
                    {lang === 'hi' ? app.name_hi : app.name_en}
                  </h3>
                  <p className="text-[13px] text-text-secondary mt-0.5">{app.benefit_amount}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {stageLabels.map((s, si) => (
                      <div key={s} className="flex items-center gap-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          si < app.stage ? 'bg-green' :
                          si === app.stage ? 'bg-primary animate-pulse-dot' :
                          'bg-gray-200'
                        }`} />
                        {si < 4 && <div className={`w-4 h-0.5 ${si < app.stage ? 'bg-green' : 'bg-gray-200'}`} />}
                      </div>
                    ))}
                  </div>
                  <span className="inline-block mt-2 text-[12px] font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary">
                    {t(`tracker.${stageLabels[app.stage]}`)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedApp(app)}
                  className="p-2 rounded-xl hover:bg-primary-light transition-colors"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <ChevronRight size={20} className="text-text-secondary" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
