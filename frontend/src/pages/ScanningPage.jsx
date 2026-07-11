import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Shield, User, Settings, Database, CheckCircle, FileText } from 'lucide-react'
import { Particles } from '../components/ui/particles'
import { AnimatedGradientText } from '../components/ui/animated-gradient-text'

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
        setPage('results')
      }
    }, 2800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0F1F3D] to-[#1B4B8F]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Particles */}
      <Particles
        className="absolute inset-0 pointer-events-none"
        quantity={80}
        color="#60A5FA"
        size={0.5}
      />

      {/* Animated scan icon */}
      <motion.div
        className="relative w-32 h-32 mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />

        {/* Gradient spinning rings */}
        <div className="absolute inset-0 rounded-full border border-blue-400/20" />
        <div
          className="absolute inset-2 rounded-full animate-spin"
          style={{
            animationDuration: '2s',
            border: '3px solid transparent',
            borderTopColor: '#3B82F6',
            borderRightColor: '#8B5CF6',
          }}
        />
        <div
          className="absolute inset-4 rounded-full animate-spin"
          style={{
            animationDuration: '1.2s',
            animationDirection: 'reverse',
            border: '3px solid transparent',
            borderBottomColor: '#60A5FA',
            borderLeftColor: '#A78BFA',
          }}
        />
        <div
          className="absolute inset-6 rounded-full animate-spin"
          style={{
            animationDuration: '0.8s',
            border: '2px solid transparent',
            borderTopColor: '#93C5FD',
            borderBottomColor: '#C4B5FD',
          }}
        />

        {/* Center shield */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield size={28} color="white" />
          </div>
        </div>
      </motion.div>

      {/* Animated gradient title */}
      <AnimatedGradientText
        className="text-2xl font-bold mb-2"
        colorFrom="#60A5FA"
        colorTo="#A78BFA"
        speed={3}
      >
        {lang === 'hi' ? 'स्कैनिंग…' : 'Scanning…'}
      </AnimatedGradientText>

      <p
        className="text-sm text-white/60 text-center mb-10 transition-opacity duration-300 h-5"
        key={msgIndex}
      >
        {lang === 'hi' ? messages[msgIndex].hi : messages[msgIndex].en}
      </p>

      {/* Pipeline stages with glass effect */}
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
                className={`flex items-center gap-3 flex-1 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                  isPast
                    ? 'bg-white/10 backdrop-blur-sm border border-green-500/30'
                    : isActive
                      ? 'bg-white/15 backdrop-blur-md border border-blue-400/40 shadow-lg shadow-blue-500/10'
                      : 'bg-white/5 backdrop-blur-sm border border-white/10'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isPast
                      ? 'bg-green-500/80 text-white'
                      : isActive
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 shadow-md'
                        : 'bg-white/10 text-white/40'
                  }`}
                >
                  <StageIcon size={16} />
                </div>
                <span
                  className={`text-[13px] font-medium transition-all duration-500 ${
                    isPast
                      ? 'text-green-400'
                      : isActive
                        ? 'text-white font-semibold'
                        : 'text-white/40'
                  }`}
                >
                  {lang === 'hi' ? stage.label_hi : stage.label_en}
                </span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
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
            className="w-2 h-2 rounded-full bg-blue-400 transition-all duration-500"
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
