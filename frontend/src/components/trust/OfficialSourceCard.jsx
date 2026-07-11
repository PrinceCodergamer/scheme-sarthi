import { ExternalLink, FileText, Globe, Phone } from 'lucide-react'

export default function OfficialSourceCard({ sources }) {
  if (!sources) return null

  const links = [
    { icon: Globe, label: 'Official Website', href: sources.website, show: !!sources.website },
    { icon: FileText, label: 'Official Guideline', href: sources.guideline_pdf, show: !!sources.guideline_pdf },
    { icon: ExternalLink, label: 'Application Portal', href: sources.application_portal, show: !!sources.application_portal },
  ]

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card">
      <h4 className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wide">
        Official Sources
      </h4>
      <div className="space-y-2.5">
        {links.map((link, i) => (
          link.show ? (
            <a key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[13px] text-primary font-medium hover:underline"
              style={{ minHeight: '36px' }}>
              <link.icon size={15} className="text-primary flex-shrink-0" />
              {link.label}
            </a>
          ) : null
        ))}
        {sources.helpline && (
          <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
            <Phone size={15} className="text-primary flex-shrink-0" />
            <span>Helpline: {sources.helpline}</span>
          </div>
        )}
        {sources.csc_required && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[12px] text-warning font-medium">
            🏢 Nearest CSC required for submission
          </div>
        )}
      </div>
    </div>
  )
}
