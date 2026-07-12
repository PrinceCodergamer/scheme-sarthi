import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Shield, User, Settings, Database, CheckCircle, FileText, Loader, AlertCircle } from 'lucide-react'
import { Particles } from '../components/ui/particles'

const pipelineStages = [
  { icon: User, label_hi: 'आपकी प्रोफ़ाइल', label_en: 'Your Profile', key: 'profile' },
  { icon: Settings, label_hi: 'नियम इंजन', label_en: 'Rule Engine', key: 'engine' },
  { icon: Database, label_hi: '3,000+ योजना नियम', label_en: '3,000+ Scheme Rules', key: 'rules' },
  { icon: CheckCircle, label_hi: 'मिलान किए गए नियम', label_en: 'Matched Rules', key: 'matched' },
  { icon: FileText, label_hi: 'परिणाम', label_en: 'Results', key: 'results' },
]

export default function ScanningPage() {
  const { t, lang, runScan, setPage } = useApp()
  const [activeStage, setActiveStage] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)
  const [error, setError] = useState(null)

  const messages = [
    { hi: 'आपकी योजनाएँ जाँची जा रही हैं…', en: 'Scanning your schemes…' },
    { hi: '3,000+ योजनाओं से मिलान…', en: 'Matching with 3,000+ schemes…' },
    { hi: 'आपकी जानकारी का विश्लेषण…', en: 'Analyzing your profile…' },
    { hi: 'लैप्स और जोखिम का पता लगाया जा रहा है…', en: 'Detecting lapses and risks…' },
  ]

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length)
    }, 600)
    return () => clearInterval(msgInterval)
  }, [])

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setActiveStage(s => Math.min(s + 1, pipelineStages.length - 1))
    }, 500)
    return () => clearInterval(stageInterval)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const result = await runScan()
        if (result) {
          setPage('results')
        }
      } catch (err) {
        console.error('Scan error:', err)
        setError(err.message || 'Scan failed. Please try again.')
      }
    }, 2800)
    return () => clearTimeout(timer)
  }, [])

  const handleRetry = useCallback(async () => {
    setError(null)
    setActiveStage(0)
    try {
      const result = await runScan()
      if (result) setPage('results')
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.')
    }
  }, [runScan, setPage])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-white to-primary-50">
        <div className="w-16 h-16 rounded-full bg-danger-light flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-danger" />
        </div>
        <p className="text-lg font-semibold text-text-primary mb-2">Scan Failed</p>
        <p className="text-sm text-text-secondary text-center mb-6 max-w-xs">{error}</p>
        <button onClick={handleRetry} className="btn-primary max-w-xs">
          <Loader size={18} />
          {lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}
        </button>
        <button onClick={() => setPage('results')} className="btn-secondary mt-3 max-w-xs">
          {lang === 'hi' ? 'डैशबोर्ड पर जाएँ' : 'Go to Dashboard'}
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden bg-gradient-to-b from-white to-primary-50">
      <Particles
        className="absolute inset-0 pointer-events-none"
        quantity={60}
        color="#1B4B8F"
        size={0.4}
      />

      {/* Animated scan icon */}
      <motion.div
        className="relative w-28 h-28 mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
        <div className="absolute inset-0 rounded-full border border-primary/20" />
        <div
          className="absolute inset-2 rounded-full animate-spin"
          style={{
            animationDuration: '2s',
            border: '3px solid transparent',
            borderTopColor: '#1B4B8F',
            borderRightColor: '#2563AC',
          }}
        />
        <div
          className="absolute inset-4 rounded-full animate-spin"
          style={{
            animationDuration: '1.2s',
            animationDirection: 'reverse',
            border: '3px solid transparent',
            borderBottomColor: '#1B4B8F',
            borderLeftColor: '#2563AC',
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
            <Shield size={28} color="white" />
          </div>
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-text-primary mb-2">
        {lang === 'hi' ? 'स्कैनिंग…' : 'Scanning…'}
      </h2>

      <p
        className="text-sm text-text-secondary text-center mb-10 transition-opacity duration-300 h-5"
        key={msgIndex}
      >
        {lang === 'hi' ? messages[msgIndex].hi : messages[msgIndex].en}
      </p>

      {/* Pipeline stages */}
      <div className="w-full max-w-xs space-y-3">
        {pipelineStages.map((stage, i) => {
          const isActive = i === activeStage
          const isPast = i < activeStage
          const StageIcon = stage.icon
          return (
            <motion.div
              key={stage.key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <div
                className={`flex items-center gap-3 flex-1 px-4 py-2.5 rounded-xl transition-all duration-500 border ${
                  isPast
                    ? 'bg-green-light/50 border-green/20'
                    : isActive
                      ? 'bg-primary-50 border-primary/30 shadow-sm'
                      : 'bg-white border-neutral-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isPast
                      ? 'bg-green text-white'
                      : isActive
                        ? 'bg-primary text-white scale-110 shadow-md'
                        : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  <StageIcon size={16} />
                </div>
                <span
                  className={`text-sm font-medium transition-all duration-500 ${
                    isPast
                      ? 'text-green font-semibold'
                      : isActive
                        ? 'text-primary font-semibold'
                        : 'text-text-secondary'
                  }`}
                >
                  {lang === 'hi' ? stage.label_hi : stage.label_en}
                </span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Dots indicator */}
      <div className="flex gap-1.5 mt-10">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary transition-all duration-500"
            style={{
              opacity: msgIndex % 3 === i ? 1 : 0.25,
              transform: msgIndex % 3 === i ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
