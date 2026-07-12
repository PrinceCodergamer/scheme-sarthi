import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Bot, User } from 'lucide-react'
import { useApp } from '../store/appStore'

const SUGGESTIONS = [
  'Why did my payment stop?',
  'What schemes am I eligible for?',
  'Explain my scan results',
  'What documents do I need?',
  'Help in Hindi',
]

const LIFE_EVENT_PATTERNS = [
  /\b(i\s+(got|had)\s+)?married\b/i,
  /\b(had\s+a\s+)?baby\b/i,
  /\b(lost\s+(my\s+)?job|unemployed)\b/i,
  /\b(turned\s+60|60\s+years?\s+old)\b/i,
  /\b(had\s+a\s+)?daughter\b/i,
  /\b(shadi|shadi\s+ho|bache|naukri\s+chut|saal\s+ke\s+ho|beti\s+hui)\b/i,
]

function detectLifeEvent(message) {
  return LIFE_EVENT_PATTERNS.some(p => p.test(message))
}

export default function AICopilot() {
  const { profileId, page } = useApp()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  async function handleSend(msg) {
    const text = (msg || input).trim()
    if (!text) return
    setInput('')
    setShowSuggestions(false)

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])

    if (!profileId) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Please scan your profile first using the Get Started button to ask questions about your schemes.' }])
      return
    }

    setTyping(true)

    const isLifeEvent = detectLifeEvent(text)
    const base = import.meta.env.VITE_API_URL || '/api'
    const endpoint = isLifeEvent
      ? `${base}/ai/life-event?profile_id=${profileId}`
      : `${base}/ai/chat?profile_id=${profileId}`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          page: page || '',
          scheme_id: '',
        }),
      })
      const data = await res.json()
      setTyping(false)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || JSON.stringify(data) }])
    } catch {
      setTyping(false)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              maxWidth: '480px',
              height: '75vh',
              maxHeight: '600px',
            }}
            >
              {/* Header */}
              <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 backdrop-blur flex items-center justify-center">
                    <Sparkles size={16} className="text-blue-400" />
                  </div>
                  <span className="text-[15px] font-semibold text-white/90">
                    Scheme Sarthi AI
                  </span>
                </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-white/60 hover:text-white transition-colors" />
              </button>
            </div>

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
              {messages.length === 0 && !typing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-center py-6"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
                    <Bot size={24} className="text-blue-400" />
                  </div>
                  <p className="text-[14px] text-white/50">
                    Ask me anything about your schemes!
                  </p>
                </motion.div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 backdrop-blur flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={14} className="text-blue-400" />
                      </div>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed backdrop-blur ${
                        msg.role === 'user'
                          ? 'bg-blue-500/20 text-white rounded-br-md'
                          : 'bg-white/10 text-white/90 rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-blue-500/30 backdrop-blur flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={14} className="text-blue-300" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 backdrop-blur flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={14} className="text-blue-400" />
                    </div>
                    <div className="px-3.5 py-3 rounded-2xl bg-white/10 backdrop-blur rounded-bl-md">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 px-4 pb-2"
              >
                <p className="text-[12px] text-white/40 mb-2 font-medium">Suggested questions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      onClick={() => handleSend(s)}
                      className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[13px] text-white/60 hover:bg-white/20 hover:text-white hover:border-white/20 transition-all"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Input */}
            <div className="relative z-10 p-3 border-t border-white/10 bg-white/[0.04]">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-3 py-1.5 border border-white/10">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  className="flex-1 bg-transparent border-none outline-none text-[14px] py-2 text-white placeholder:text-white/30"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    input.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                      : 'bg-white/5 text-white/20'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-shadow"
        style={{ maxWidth: '480px', right: 'calc(50% - 240px + 24px)' }}
        title="Ask Scheme Sarthi"
      >
        <Sparkles size={24} />
      </motion.button>
    </>
  )
}
