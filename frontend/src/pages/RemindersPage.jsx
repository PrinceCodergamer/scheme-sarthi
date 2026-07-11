import { useEffect, useState } from 'react'
import { useApp } from '../store/appStore'
import { Bell, BellRing, ChevronRight, CheckCircle } from 'lucide-react'

export default function RemindersPage() {
  const { t, lang, reminders, fetchReminders } = useApp()
  const [simulated, setSimulated] = useState(false)

  useEffect(() => {
    fetchReminders()
  }, [])

  const handleSimulate = async () => {
    setSimulated(true)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Scheme Sarthi - योजना सारथी', {
        body: lang === 'hi'
          ? 'आपकी PM-KISAN eKYC की अंतिम तिथि 12 दिन में है। कृपया जल्दी करें!'
          : 'Your PM-KISAN eKYC deadline is in 12 days. Please act now!',
        icon: '/icon-192.png',
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        new Notification('Scheme Sarthi - योजना सारथी', {
          body: lang === 'hi'
            ? 'आपकी PM-KISAN eKYC की अंतिम तिथि 12 दिन में है। कृपया जल्दी करें!'
            : 'Your PM-KISAN eKYC deadline is in 12 days. Please act now!',
          icon: '/icon-192.png',
        })
      }
    }
    setTimeout(() => setSimulated(false), 3000)
  }

  return (
    <div className="pb-32 px-4 pt-4">
      <h1 className="text-[20px] font-bold mb-4">{t('reminder.title')}</h1>

      {reminders.length === 0 && !simulated ? (
        <div className="bg-white rounded-2xl p-8 shadow-card text-center mt-8">
          <div className="text-[40px] mb-3">🔔</div>
          <p className="text-[16px] font-medium text-text-primary mb-1">{t('empty.no_reminders')}</p>
          <p className="text-[14px] text-text-secondary">
            {lang === 'hi'
              ? 'जब कोई योजना जोखिम में होगी, तो यहाँ रिमाइंडर दिखेंगे।'
              : 'Reminders will appear here when any scheme is at risk.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r, i) => (
            <div key={r.id} className={`bg-white rounded-2xl p-4 shadow-card stagger-${(i % 5) + 1}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  (r.due_days || 0) <= 30 ? 'bg-warning/10' : 'bg-primary-light'
                }`}>
                  <Bell size={20} className={(r.due_days || 0) <= 30 ? 'text-warning' : 'text-primary'} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold">
                    {lang === 'hi' ? r.title_hi : r.title_en}
                  </h3>
                  <p className="text-[13px] text-text-secondary mt-0.5">
                    {lang === 'hi' ? r.name_hi : r.name_en}
                  </p>
                  {(r.due_days || 0) <= 30 ? (
                    <span className="inline-flex items-center gap-1 mt-2 text-[13px] font-semibold text-warning">
                      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                      {t('reminder.days_left', { days: r.due_days || 0 })}
                    </span>
                  ) : (
                    <span className="inline-block mt-2 text-[13px] text-text-secondary">
                      {t('reminder.days_left', { days: r.due_days || 0 })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {simulated && (
            <div className="bg-green/5 border border-green/20 rounded-2xl p-4 flex items-center gap-3 stagger-1">
              <CheckCircle size={20} className="text-green" />
              <p className="text-[14px] text-green font-medium">{t('reminder.sent')}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-primary-light/50 rounded-2xl">
        <p className="text-[13px] text-text-secondary mb-3">
          {lang === 'hi'
            ? 'डेवलपर टूल: नीचे दिए गए बटन से वेब पुश नोटिफिकेशन का डेमो देखें।'
            : 'Dev tool: Click below to simulate a web push notification reminder.'}
        </p>
        <button onClick={handleSimulate} className="btn-secondary" disabled={simulated}>
          <BellRing size={18} />
          {t('reminder.simulate')}
        </button>
      </div>
    </div>
  )
}
