import MedicalIcon from '../../components/MedicalIcon'

function MetricCard({ metric }) {
  const toneMap = {
    rose: {
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
      trendText: 'text-rose-500',
      barColor: 'from-rose-300 to-rose-500',
    },
    sky: {
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-50',
      trendText: 'text-sky-500',
      barColor: 'from-sky-300 to-sky-500',
    },
    emerald: {
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      trendText: 'text-emerald-600',
      barColor: 'from-emerald-300 to-emerald-500',
    },
  }

  const tone = toneMap[metric.tone]

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.iconBg}`}>
          <MedicalIcon name={metric.icon} className={`h-5 w-5 ${tone.iconColor}`} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <span className={`text-xs font-medium ${tone.trendText}`}>{metric.trend}</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{metric.value}</p>
          <div className="mt-2 flex h-8 items-end gap-1">
            {metric.bars.map((barHeight, index) => (
              <span
                key={`${metric.key}-bar-${index}`}
                className={`flex-1 rounded-sm bg-gradient-to-t ${tone.barColor}`}
                style={{ height: `${Math.max(12, Math.min(100, barHeight))}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function HealthMetricsSection({ metricsCards }) {
  return (
    <section className="rounded-3xl border border-white/55 bg-white/92 px-4 py-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">健康指标</h2>
        <span className="text-sm font-medium text-medical-600">自动评估</span>
      </div>

      <div className="space-y-3">
        {metricsCards.map((item) => (
          <MetricCard key={item.key} metric={item} />
        ))}
      </div>
    </section>
  )
}
