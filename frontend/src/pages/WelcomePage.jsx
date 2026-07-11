import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Shield, ChevronRight, User, Smartphone, LogIn, MessageSquare, Sparkles } from 'lucide-react'
import { Show, SignInButton, UserButton, useUser } from '@clerk/react'
import { BackgroundBeams } from '../components/ui/background-beams'
import { Spotlight } from '../components/ui/spotlight'
import { AnimatedGradientText } from '../components/ui/animated-gradient-text'
import { TypingAnimation } from '../components/ui/typing-animation'
import { MovingBorderButton } from '../components/ui/moving-border'
import { Card } from '../components/ui/card'

export default function WelcomePage() {
  const { t, lang, setPage, createProfile, setProfileId, loading, setWhatsappPhone } = useApp()
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

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    return digits
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-8 overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F1F3D] to-[#1B4B8F]">
      <BackgroundBeams />
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

      <div className="w-full flex justify-end mb-4 relative z-10">
        <Show when="signed-in">
          <UserButton afterSignOutUrl="/" />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-xs flex items-center gap-1.5 text-white/80 font-medium px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all"
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
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1B4B8F] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)] mx-auto">
          <Shield size={40} color="white" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center"
      >
        <AnimatedGradientText
          speed={1.5}
          colorFrom="#60A5FA"
          colorTo="#A78BFA"
          className="text-[32px] font-bold"
        >
          {t('app.name')}
        </AnimatedGradientText>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-2"
      >
        <p className="text-[14px] text-white/60 text-center max-w-xs">
          <TypingAnimation
            duration={30}
            startOnView={false}
            cursorStyle="line"
            blinkCursor={true}
          >
            {lang === 'hi' ? t('app.tagline') : t('app.tagline.en')}
          </TypingAnimation>
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
            <MovingBorderButton
              borderRadius="14px"
              className="w-full bg-gradient-to-r from-[#1E3A6F] to-[#2563EB] text-white text-[17px] font-semibold h-[52px] border-0"
              borderClassName="bg-[radial-gradient(#60A5FA_40%,transparent_60%)]"
              containerClassName="w-full"
              onClick={() => setShowForm(true)}
            >
              <User size={20} />
              {lang === 'hi' ? 'शुरू करें' : 'Get Started'}
              <ChevronRight size={20} />
            </MovingBorderButton>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDemo}
              disabled={loading}
              className="w-full h-[52px] rounded-xl text-white/70 bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
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
              transition={{ delay: 0.8 }}
              className="text-[10px] text-white/40 text-center mt-6 max-w-[240px] leading-relaxed mx-auto"
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
            <Card className="bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  {lang === 'hi' ? 'आपका नाम' : 'Your Name'}
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {isSignedIn && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-green-400" />
                    {lang === 'hi' ? 'व्हाट्सएप नंबर (वैकल्पिक)' : 'WhatsApp Number (optional)'}
                  </label>
                  <div className="relative">
                    <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="+91 XXXXXXXXXX"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-white/40 mt-1 ml-1">
                    {lang === 'hi' ? 'स्कीम अपडेट के लिए व्हाट्सएप नोटिफिकेशन पाएं' : 'Get WhatsApp notifications for scheme updates'}
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                disabled={!name.trim()}
                className="w-full h-[52px] rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-[16px] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}
                <ChevronRight size={20} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(false)}
                className="w-full h-[52px] rounded-xl text-white/60 bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 hover:text-white/80 transition-all"
              >
                {lang === 'hi' ? 'वापस जाएं' : 'Go Back'}
              </motion.button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="flex flex-wrap justify-center gap-3 mt-8 relative z-10"
      >
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/50 backdrop-blur-sm">
          <Shield size={12} />
          Demo Mode
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/50 backdrop-blur-sm">
          <Smartphone size={12} />
          Privacy First
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] text-white/30 tracking-wider uppercase">Govt AI Assistant</span>
        </div>
      </div>
    </div>
  )
}
