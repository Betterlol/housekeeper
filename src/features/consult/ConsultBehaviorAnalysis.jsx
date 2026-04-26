import { resolveWeakestBucket } from './helpers'

export default function ConsultBehaviorAnalysis({ trend, buckets }) {
  const weakestBucket = resolveWeakestBucket(buckets)

  return (
    <section className="space-y-4 px-1">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-slate-800">AI 行为分析</h2>
      </div>

      <article className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-600">7日依从率趋势</span>
          <span className="text-sm font-medium text-slate-800">
            平均 {trend.length > 0 ? Math.round(trend.reduce((sum, item) => sum + item.adherence, 0) / trend.length) : 0}%
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          {trend.map((item) => (
            <div key={item.dateKey} className="flex flex-1 flex-col items-center">
              <div className="relative mb-2 h-20 w-full">
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                    item.adherence >= 90
                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                      : item.adherence >= 75
                        ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                        : 'bg-gradient-to-t from-rose-500 to-rose-400'
                  }`}
                  style={{ height: `${Math.max(item.adherence, 8)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
          <p>应服 {trend.reduce((sum, item) => sum + item.expected, 0)}</p>
          <p>实服 {trend.reduce((sum, item) => sum + item.taken, 0)}</p>
          <p>漏服 {trend.reduce((sum, item) => sum + item.missed, 0)}</p>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <p className="mb-3 text-sm text-slate-600">服药时段分布</p>
        <div className="space-y-3">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="flex items-center gap-3">
              <span className="w-8 text-sm text-slate-600">{bucket.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all duration-500 ${bucket.tone}`} style={{ width: `${bucket.rate}%` }} />
              </div>
              <span className={`w-10 text-right text-sm font-medium ${bucket.rate < 80 ? 'text-amber-600' : 'text-slate-700'}`}>
                {bucket.rate}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          AI 分析：{weakestBucket === '暂无数据' ? '当前数据不足，继续记录后可生成更完整行为洞察。' : `${weakestBucket}服药是当前主要薄弱环节。`}
        </div>
      </article>
    </section>
  )
}
