import { useApp } from '../../store/appStore'
import { ExternalLink, FileText, Globe, Phone } from 'lucide-react'

export default function OfficialSourceCard({ sources }) {
  const { t } = useApp()
  if (!sources) return null

  const links = [
    { icon: Globe, label: t('official.website_link'), href: sources.website, show: !!sources.website },
    { icon: FileText, label: t('official.guideline_link'), href: sources.guideline_pdf, show: !!sources.guideline_pdf },
    { icon: ExternalLink, label: t('official.portal_link'), href: sources.application_portal, show: !!sources.application_portal },
  ]

  return (
    <div className="glass rounded-2xl p-4">
      <h4 className="text-[13px] font-semibold text-text-muted mb-3 uppercase tracking-wide">
        {t('official.title')}
      </h4>
      <div className="space-y-2.5">
        {links.map((link, i) => (
          link.show ? (
            <a key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[13px] text-blue-400 font-medium hover:text-blue-300 transition-colors"
              style={{ minHeight: '36px' }}>
              <link.icon size={15} className="text-blue-400 flex-shrink-0" />
              {link.label}
            </a>
          ) : null
        ))}
        {sources.helpline && (
          <div className="flex items-center gap-2.5 text-[13px] text-text-muted">
            <Phone size={15} className="text-blue-400 flex-shrink-0" />
            <span>{t('official.helpline')}{sources.helpline}</span>
          </div>
        )}
        {sources.csc_required && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-400 font-medium">
            {t('official.csc_note')}
          </div>
        )}
      </div>
    </div>
  )
}
