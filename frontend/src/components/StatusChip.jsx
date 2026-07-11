export default function StatusChip({ status, label }) {
  const cls = status === 'lapsed' ? 'lapsed' : status === 'at_risk' ? 'at-risk' : status === 'eligible_unclaimed' ? 'eligible' : 'not-eligible'
  const dots = { lapsed: '🔴', at_risk: '🟡', eligible_unclaimed: '🟢', not_eligible: '⚪' }
  return (
    <span className={`status-chip ${cls}`}>
      <span>{dots[status] || '●'}</span>
      {label}
    </span>
  )
}
