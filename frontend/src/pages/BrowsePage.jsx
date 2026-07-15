import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import { Search, ArrowLeft, Shield, ChevronRight, ExternalLink } from 'lucide-react'

const categoryIcons = {
  agriculture: '🌾', education: '📚', health: '🏥', housing: '🏠',
  business: '💼', skills: '🔧', 'social-welfare': '🤝', 'women-child': '👩‍👧',
  pension: '👴', banking: '🏦', farmer: '🚜', student: '🎓',
  sanitation: '🧹', infrastructure: '🚂', 'science-it': '💻', sports: '🎭',
  travel: '✈️', 'public-safety': '⚖️',
}

export default function BrowsePage() {
  const { t, lang, navigate, pageParams } = useApp()
  const [allSchemes, setAllSchemes] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(pageParams?.category || null)
  const [searchQuery, setSearchQuery] = useState(pageParams?.search || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/schemes').then(r => r.json()),
      fetch('/api/schemes/categories').then(r => r.json()),
    ]).then(([schemesData, catsData]) => {
      const schemes = Array.isArray(schemesData) ? schemesData : (schemesData.results || [])
      const cats = catsData?.categories || []
      setAllSchemes(schemes)
      setCategories(cats)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = allSchemes.filter(s => {
    const matchesSearch = !searchQuery || 
      s.name_hi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !activeCategory || s.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-8"
    >
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('welcome')}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-surface-light transition-all"
          >
            <ArrowLeft size={18} className="text-text-secondary" />
          </motion.button>
          <h1 className="text-[18px] font-bold text-white">
            {t('browse.title')}
          </h1>
          <span className="text-[13px] text-text-muted font-medium ml-auto">{filtered.length}</span>
        </div>
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('browse.search_placeholder')}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface/50 border border-border text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400/30 text-[14px]"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-5 pb-3 overflow-x-auto scrollbar-none">
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-medium transition-all ${
              !activeCategory
                ? 'bg-blue-500 text-white shadow-glow'
                : 'glass text-text-secondary hover:text-white hover:bg-surface-light/50'
            }`}
          >
            {t('browse.filter_all')}
          </motion.button>
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-500 text-white shadow-glow'
                  : 'glass text-text-secondary hover:text-white hover:bg-surface-light/50'
              }`}
            >
              <span>{categoryIcons[cat.id] || '📋'}</span>
              {lang === 'hi' ? cat.name_hi : cat.name_en}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-2 space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-[15px] text-text-muted font-medium">
              {t('browse.empty')}
            </p>
            <p className="text-[13px] text-text-muted mt-1">
              {t('browse.empty_hint')}
            </p>
          </div>
        ) : (
          filtered.map((scheme, i) => (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -2 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="icon-container blue" style={{ width: 42, height: 42, borderRadius: 12 }}>
                  <Shield size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[14px] font-bold text-white leading-tight">
                        {lang === 'hi' ? scheme.name_hi : scheme.name_en}
                      </h3>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        {lang === 'hi' ? scheme.name_en : scheme.name_hi}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface/50 text-text-muted border border-border">
                      {categoryIcons[scheme.category] || '📋'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[13px] font-bold text-green-400">{scheme.benefit_amount}</span>
                    <span className="text-[11px] text-text-muted px-2 py-0.5 rounded-full bg-surface/50 border border-border">
                      {t('browse.per')} {scheme.benefit_period}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    {scheme.apply_url && scheme.apply_url !== '' ? (
                      <a
                        href={scheme.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12px] text-blue-400 font-medium hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink size={13} />
                        {t('browse.apply_link')}
                      </a>
                    ) : null}
                    <button
                      onClick={() => navigate('aadhaar')}
                      className="flex items-center gap-1 text-[12px] text-blue-400 font-medium ml-auto hover:text-blue-300 transition-colors"
                    >
                      {t('browse.eligibility_link')}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!loading && allSchemes.length > 0 && (
        <div className="px-5 mt-6">
          <motion.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('aadhaar')}
            className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-[15px] shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-2"
          >
            <Shield size={18} />
            {t('browse.find_eligible')}
            <ChevronRight size={18} />
          </motion.button>
          <p className="text-[11px] text-text-muted text-center mt-2">
            {t('browse.scan_prompt')}
          </p>
        </div>
      )}
    </motion.div>
  )
}
