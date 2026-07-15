import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Bell, BellRing, ChevronRight, CheckCircle, Clock } from 'lucide-react'

export default function RemindersPage() {
  const { t, lang, reminders, fetchReminders } = useApp()
  const [simulated, setSimulated] = useState(false)

  useEffect(() => {
    fetchReminders()
  }, [])

  const handleSimulate = async () => {
    setSimulated(true)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('reminders.notification_title'), {
        body: t('reminders.notification_body'),
        icon: '/icon-192.png',
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        new Notification(t('reminders.notification_title'), {
          body: t('reminders.notification_body'),
          icon: '/icon-192.png',
        })
      }
    }
    setTimeout(() => setSimulated(false), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-5 pb-32 pt-2"
    >
      <h1 className="text-[20px] font-bold text-white mb-5">{t('reminder.title')}</h1>

      {reminders.length === 0 && !simulated ? (
        <div className="glass-card rounded-3xl p-10 text-center mt-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-amber-400" />
          </div>
          <p className="text-[16px] font-medium text-white mb-1">{t('empty.no_reminders')}</p>
          <p className="text-[14px] text-text-muted">
            {t('reminders.empty_desc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className={`icon-container ${(r.due_days || 0) <= 30 ? 'orange' : 'blue'}`} style={{ width: 44, height: 44, borderRadius: 14 }}>
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-white">
                    {lang === 'hi' ? r.title_hi : r.title_en}
                  </h3>
                  <p className="text-[13px] text-text-muted mt-0.5">
                    {lang === 'hi' ? r.name_hi : r.name_en}
                  </p>
                  {(r.due_days || 0) <= 30 ? (
                    <span className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-semibold text-amber-400 bg-amber-500/10 rounded-full px-3 py-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <Clock size={12} />
                      {t('reminder.days_left', { days: r.due_days || 0 })}
                    </span>
                  ) : (
                    <span className="inline-block mt-2 text-[13px] text-text-muted">
                      {t('reminder.days_left', { days: r.due_days || 0 })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {simulated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border border-green-500/20 rounded-2xl p-4 flex items-center gap-3"
            >
              <CheckCircle size={20} className="text-green-400" />
              <p className="text-[14px] text-green-400 font-medium">{t('reminder.sent')}</p>
            </motion.div>
          )}
        </div>
      )}

      <div className="mt-6 glass-card rounded-3xl p-5">
        <p className="text-[13px] text-text-muted mb-3">
          {t('reminders.dev_tool')}
        </p>
        <button onClick={handleSimulate} className="btn-secondary" disabled={simulated}>
          <BellRing size={18} />
          {t('reminder.simulate')}
        </button>
      </div>
    </motion.div>
  )
}
