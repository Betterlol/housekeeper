const colorMap = {
  'low-stock': 'bg-amber-400',
  missed: 'bg-rose-400',
  normal: 'bg-emerald-400',
}

export default function PlanStockProgress({ current, total, status }) {
  const safeTotal = total > 0 ? total : 1
  const percentage = Math.min(100, Math.round((Number(current || 0) / safeTotal) * 100))

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${colorMap[status] || colorMap.normal}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-400">{current}片</span>
    </div>
  )
}
