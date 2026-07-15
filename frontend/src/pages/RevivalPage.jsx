import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/appStore'
import { ArrowLeft, Download, ExternalLink, MapPin, CheckCircle, ChevronRight, Lightbulb, AlertTriangle, Clock, CheckSquare } from 'lucide-react'

export default function RevivalPage({ schemeId, onBack }) {
  const { t, lang, scanResults, profile, applyScheme, fetchApplications, setPage } = useApp()
  const [tab, setTab] = useState('explain')
  const [formData, setFormData] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [showSimple, setShowSimple] = useState(false)

  const allItems = [
    ...(scanResults?.results?.lapsed || []),
    ...(scanResults?.results?.at_risk || []),
    ...(scanResults?.results?.eligible_unclaimed || []),
  ]
  const item = allItems.find(x => x.scheme_id === schemeId)

  if (!item) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="btn-secondary mb-4"><ArrowLeft size={18} /> {t('revival.back_button')}</button>
        <p className="text-center text-text-muted">{t('revival.not_found')}</p>
      </div>
    )
  }

  const simpleExplanations = item.reasons_hi?.length
    ? item.reasons_hi.map((r, i) => {
        const en = item.reasons_en?.[i] || r
        const hi = r
        return {
          hi: `• ${hi}`,
          en: `• ${en}`
        }
      })
    : [
        { hi: t('revival.default_explanation'), en: t('revival.default_explanation') },
        { hi: t('revival.default_reapply'), en: t('revival.default_reapply') },
      ]

  const simpleExplanationText = lang === 'hi'
    ? `आपकी ${item.name_hi} में निम्नलिखित समस्या पाई गई:\n\n${simpleExplanations.map(e => e.hi).join('\n')}\n\nइसे ठीक करने के लिए दिए गए चरणों का पालन करें।`
    : `The following issues were detected in your ${item.name_en}:\n\n${simpleExplanations.map(e => e.en).join('\n')}\n\nFollow the steps below to fix this.`

  const steps = item.reasons_hi?.length
    ? item.reasons_hi.map((r, i) => ({
        hi: `✅ ${item.reasons_en?.[i] ? item.reasons_en[i] : r}`,
        en: `✅ ${item.reasons_en?.[i] || r}`
      }))
    : [
        { hi: t('revival.default_step1'), en: t('revival.default_step1') },
        { hi: t('revival.default_step2'), en: t('revival.default_step2') },
        { hi: t('revival.default_step3'), en: t('revival.default_step3') },
      ]

  const timelineItems = item.timeline || []

  const handleSubmitForm = async () => {
    try {
      await applyScheme(schemeId, formData)
      setSubmitted(true)
    } catch (err) {
      console.error('Application error:', err)
    }
  }

  const handleDownloadPDF = () => {
    let content = `${item.name_hi}\n${item.name_en}\n\n`
    content += `${t('revival.form_title')}\n\n`
    content += `${t('revival.form_profile_info')}:\n`
    content += `${t('revival.field_name')}: ${profile?.name || ''}\n`
    content += `${t('revival.field_age')}: ${profile?.age || ''}\n`
    content += `${t('revival.field_state')}: ${profile?.state || ''}\n`
    content += `${t('revival.field_district')}: ${profile?.district || ''}\n`
    content += `${t('revival.field_occupation')}: ${profile?.occupation || ''}\n\n`
    content += `${t('revival.required_info')}:\n`
    const pdfFields = ['revival.field_aadhaar', 'revival.field_bank_account', 'revival.field_ifsc', 'revival.field_mobile']
    pdfFields.forEach(fKey => {
      content += `${t(fKey)}: _______________\n`
    })
    content += `\n---\n${t('revival.form_disclaimer')}\n`
    content += `${t('revival.form_dpdp')}\n`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scheme-sarthi-${schemeId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 flex flex-col items-center justify-center min-h-[60vh]"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <p className="text-[18px] font-semibold text-center text-white mb-2">
          {t('revival.success_title')}
        </p>
        <p className="text-[14px] text-text-muted text-center mb-6">
          {t('revival.success_desc')}
        </p>
        <button onClick={() => setPage('applications')} className="btn-primary">
          {t('revival.view_status')}
        </button>
        <button onClick={() => setPage('results')} className="btn-secondary mt-3">
          {t('revival.back_dashboard')}
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-8"
    >
      <div className="flex items-center gap-2 px-5 py-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-surface-light transition-all">
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <h1 className="text-[18px] font-bold text-white truncate flex-1">{lang === 'hi' ? item.name_hi : item.name_en}</h1>
        {item.priority && (
          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
            item.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
            item.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {item.priority}
          </span>
        )}
      </div>

      {item.consequence_hi && (
        <div className="mx-5 mb-4 glass border border-red-500/20 rounded-2xl p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-300">
              <span className="font-semibold">{t('revival.if_ignored')}</span>{' '}
              {lang === 'hi' ? item.consequence_hi : item.consequence_en}
            </p>
          </div>
        </div>
      )}

      {item.recovery && (
        <div className="mx-5 mb-4 flex gap-2">
          <div className="flex-1 glass rounded-2xl p-3 text-center">
            <p className="text-[11px] text-text-muted">{t('revival.time_label')}</p>
            <p className="text-[15px] font-bold text-green-400">{item.recovery.estimated_minutes} {t('revival.min_label')}</p>
          </div>
          <div className="flex-1 glass rounded-2xl p-3 text-center">
            <p className="text-[11px] text-text-muted">{t('revival.difficulty_label')}</p>
            <p className="text-[15px] font-bold text-blue-400">
              {lang === 'hi'
                ? (item.recovery.difficulty_hi === 'Easy' ? 'आसान' : item.recovery.difficulty_hi === 'Medium' ? 'मध्यम' : 'कठिन')
                : item.recovery.difficulty_en}
            </p>
          </div>
          <div className="flex-1 glass rounded-2xl p-3 text-center">
            <p className="text-[11px] text-text-muted">{t('revival.office_label')}</p>
            <p className="text-[15px] font-bold text-amber-400">{item.recovery.office_visit_required ? t('revival.yes') : t('revival.no')}</p>
          </div>
        </div>
      )}

      <div className="glass rounded-3xl mx-5 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="icon-container blue" style={{ width: 40, height: 40, borderRadius: 12 }}>
            <Lightbulb size={18} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gradient-blue mb-1">{item.benefit_amount}</p>
            <p className="text-[14px] text-text-secondary">
              {lang === 'hi' ? item.reason_hi : item.reason_en}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-5 mb-4">
        <button
          onClick={() => setShowSimple(!showSimple)}
          className="btn-secondary text-[13px]"
        >
          <Lightbulb size={16} />
          {t('revival.explain_simple')}
        </button>
        {showSimple && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 glass rounded-2xl p-4 border border-blue-500/10"
          >
            <p className="text-[14px] text-text-primary whitespace-pre-line leading-relaxed">
              {simpleExplanationText}
            </p>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[12px] text-text-muted">
                {t('revival.confidence')} {item.confidence || 'High'}
                {' | '}
                {t('revival.rule_based')}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {timelineItems.length > 0 && (
        <div className="mx-5 mb-4">
          <h3 className="text-[14px] font-semibold text-white mb-2">
            {t('revival.payment_history')}
          </h3>
          <div className="glass rounded-2xl p-4">
            {timelineItems.map((tl, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  tl.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                  tl.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                  tl.status === 'missed' ? 'bg-red-500/20 text-red-400' :
                  'bg-surface/50 text-text-muted'
                }`}>
                  {tl.status === 'paid' ? '✓' : tl.status === 'missed' ? '✗' : '○'}
                </div>
                <span className={`text-[13px] ${
                  tl.status === 'paid' ? 'text-green-400 font-medium' :
                  tl.status === 'missed' ? 'text-red-400' :
                  'text-text-muted'
                }`}>
                  {lang === 'hi' ? tl.label_hi : tl.label_en}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 px-5 mb-4">
        {['explain', 'form', 'docs'].map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 rounded-xl font-medium text-[13px] transition-all ${
              tab === tabKey
                ? 'bg-blue-500 text-white'
                : 'glass text-text-muted hover:text-white'
            }`}
            style={{ minHeight: '40px' }}
          >
            {tabKey === 'explain' ? t('revival.step_fix') :
             tabKey === 'form' ? t('revival.step_form') :
             t('revival.step_docs')}
          </button>
        ))}
      </div>

      <div className="px-5">
        {tab === 'explain' && (
          <div>
            <div className="glass border border-amber-500/20 rounded-2xl p-4 mb-4">
              <p className="text-[14px] font-semibold text-amber-400 mb-1">{t('revival.what_wrong')}</p>
              <p className="text-[14px] text-text-secondary">
                {lang === 'hi' ? item.reason_hi : item.reason_en}
              </p>
            </div>

            <h3 className="text-[16px] font-semibold text-white mb-3">{t('revival.steps')}</h3>
            <div className="space-y-3 mb-6">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 glass rounded-2xl p-4">
                  <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/20">
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                  <p className="text-[14px] text-text-primary">{lang === 'hi' ? step.hi : step.en}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-4 mb-4">
              <p className="text-[14px] font-semibold text-white mb-3">{t('revival.submit_at')}</p>
              {item.apply_url && (
                <a href={item.apply_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 font-medium mb-3 hover:underline"
                  style={{ minHeight: '44px' }}>
                  <ExternalLink size={16} />
                  {t('revival.apply_online')}
                </a>
              )}
              <div className="flex items-center gap-2 text-text-muted text-[14px]">
                <MapPin size={16} />
                {t('revival.csc')}
              </div>
            </div>

            {item.matched_rules && item.matched_rules.length > 0 && (
              <div className="glass rounded-2xl p-4 mb-4">
                <p className="text-[13px] font-semibold text-white mb-2">
                  {t('revival.matched_rules')}
                </p>
                {item.matched_rules.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <CheckSquare size={14} className="text-green-400" />
                    <span className="text-[12px] text-text-muted">
                      {r.field}: {String(r.actual)} {r.operator} {String(r.expected)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'form' && (
          <div>
            <h3 className="text-[16px] font-semibold text-white mb-4">{t('revival.fill_form')}</h3>
            <div className="space-y-4">
              {[
                { name: 'aadhaar', tKey: 'revival.field_aadhaar', type: 'text' },
                { name: 'bank_account', tKey: 'revival.field_bank_account', type: 'text' },
                { name: 'ifsc', tKey: 'revival.field_ifsc', type: 'text' },
                { name: 'mobile', tKey: 'revival.field_mobile', type: 'tel' },
              ].map(f => (
                <div key={f.name}>
                  <label className="font-medium text-[13px] mb-1 block text-text-muted">
                    {t(f.tKey)}
                  </label>
                  <input
                    type={f.type}
                    value={formData[f.name] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [f.name]: e.target.value }))}
                    className="form-input"
                    placeholder={t(f.tKey)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 glass rounded-2xl p-4">
              <p className="text-[12px] font-medium text-text-muted mb-1">
                {t('revival.pre_filled')}
              </p>
              <div className="text-[13px] text-text-primary space-y-1">
                <p>{t('revival.field_name')}: {profile?.name || '-'}</p>
                <p>{t('revival.field_age')}: {profile?.age || '-'}</p>
                <p>{t('revival.field_state')}: {profile?.state || '-'}</p>
                <p>{t('revival.field_district')}: {profile?.district || '-'}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmitForm} className="btn-primary flex-1">
                {t('revival.submit')}
              </button>
            </div>

            <button onClick={handleDownloadPDF} className="btn-secondary mt-3">
              <Download size={18} />
              {t('revival.download_pdf')}
            </button>
          </div>
        )}

        {tab === 'docs' && (
          <div>
            <h3 className="text-[16px] font-semibold text-white mb-4">{t('revival.documents')}</h3>
            {item.recovery && (
              <p className="text-[13px] text-text-muted mb-3">
                {t('revival.required_info')}: {item.recovery.documents_required}
              </p>
            )}
            <div className="space-y-3">
              {(item.documents || [
                t('revival.default_doc1'),
                t('revival.default_doc2'),
                t('revival.default_doc3'),
                t('revival.default_doc4'),
              ]).map((doc, i) => (
                <div key={i} className="flex items-center gap-3 glass rounded-2xl p-4">
                  <div className="icon-container blue" style={{ width: 40, height: 40, borderRadius: 12 }}>
                    <span className="text-[16px]">📄</span>
                  </div>
                  <p className="text-[14px] text-text-primary">{doc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 glass border border-amber-500/20 rounded-2xl p-4">
              <p className="text-[13px] text-text-muted">
                {t('revival.doc_submit_hint')}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
