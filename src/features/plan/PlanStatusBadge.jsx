const styleMap = {
  'low-stock': 'bg-amber-50 text-amber-700',
  missed: 'bg-rose-50 text-rose-600',
  normal: 'bg-emerald-50 text-emerald-700',
}

export default function PlanStatusBadge({ status, text }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styleMap[status] || styleMap.normal}`}>
      {text}
    </span>
  )
}
