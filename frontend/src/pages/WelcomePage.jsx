import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Shield, ChevronRight, User, Smartphone, LogIn, MessageSquare, Sparkles } from 'lucide-react'
import { Show, SignInButton, UserButton, useUser } from '@clerk/react'
import { Spotlight } from '../components/ui/spotlight'

export default function WelcomePage() {
  const { t, lang, setPage, setProfileId, loading, setWhatsappPhone } = useApp()
  const { isSignedIn } = useUser()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleGetStarted = async () => {
    if (!name.trim()) return
    if (phone && phone.length === 10) {
      setWhatsappPhone(`+91${phone}`)
    }
    setPage('aadhaar')
  }

  const handleDemo = async () => {
    const res = await fetch('/api/profile/demo', { method: 'POST' })
    const data = await res.json()
    if (data.profile_id) {
      setProfileId(data.profile_id)
      setPage('scanning')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-8 overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-primary-50">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#1B4B8F" />

      <div className="absolute inset-0 bg-grid-primary/[0.03] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

      <div className="w-full flex justify-end mb-4 relative z-10">
        <Show when="signed-in">
          <UserButton afterSignOutUrl="/" />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-xs flex items-center gap-1.5 text-neutral-600 font-medium px-4 py-2 rounded-full border border-neutral-200 bg-white/80 hover:bg-white transition-all"
            >
              <LogIn size={14} />
              {lang === 'hi' ? 'लॉगिन' : 'Login'}
            </motion.button>
          </SignInButton>
        </Show>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-6 shadow-glow mx-auto">
          <Shield size={40} color="white" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center"
      >
        <h1 className="text-[32px] font-extrabold text-primary">
          {t('app.name')}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-2"
      >
        <p className="text-sm text-neutral-500 text-center max-w-xs leading-relaxed">
          {lang === 'hi'
            ? 'सरकारी योजनाओं का लाभ उठाएँ — पता लगाएँ कि क्या छूट गया, क्या बचाया जा सकता है'
            : 'Never lose what\'s rightfully yours — detect lapsed schemes, recover benefits'}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full mt-10 space-y-3 relative z-10"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="btn-primary text-[17px]"
            >
              <User size={20} />
              {lang === 'hi' ? 'शुरू करें' : 'Get Started'}
              <ChevronRight size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDemo}
              disabled={loading}
              className="w-full h-[52px] rounded-xl text-neutral-500 bg-white border border-neutral-200 text-sm font-medium hover:bg-neutral-50 hover:text-neutral-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  {t('app.load_demo')}
                </>
              )}
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-2xs text-neutral-400 text-center mt-6 max-w-[240px] leading-relaxed mx-auto"
            >
              {lang === 'hi'
                ? 'आपका डेटा आपके पास रहता है। कोई जानकारी सर्वर पर सेव नहीं होती।'
                : 'Your data stays with you. No information is stored on servers.'}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full mt-8 relative z-10"
          >
            <div className="bg-white border border-neutral-200 shadow-card-lg rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                  {lang === 'hi' ? 'आपका नाम' : 'Your Name'}
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {isSignedIn && (
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-green" />
                    {lang === 'hi' ? 'व्हाट्सएप नंबर (वैकल्पिक)' : 'WhatsApp Number (optional)'}
                  </label>
                  <div className="relative">
                    <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setPhone(digits)
                      }}
                      placeholder="+91 XXXXXXXXXX"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-text-primary placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 ml-1">
                    {lang === 'hi' ? 'स्कीम अपडेट के लिए व्हाट्सएप नोटिफिकेशन पाएं' : 'Get WhatsApp notifications for scheme updates'}
                  </p>
                </div>
              )}

              <button
                onClick={handleGetStarted}
                disabled={!name.trim()}
                className="btn-primary"
              >
                {lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}
                <ChevronRight size={20} />
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                {lang === 'hi' ? 'वापस जाएं' : 'Go Back'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="flex flex-wrap justify-center gap-3 mt-8 relative z-10"
      >
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary-50 border border-primary-light text-2xs font-medium text-primary">
          <Shield size={12} />
          Demo Mode
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary-50 border border-primary-light text-2xs font-medium text-primary">
          <Smartphone size={12} />
          Privacy First
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-2xs text-neutral-400 tracking-wider uppercase font-medium">Govt AI Assistant</span>
        </div>
      </div>
    </div>
  )
}
