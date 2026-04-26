import MedicalIcon from '../MedicalIcon'

const immersiveMetricToneClassMap = {
  cyan: 'border-cyan-200/30 bg-cyan-300/15 text-cyan-50',
  emerald: 'border-emerald-200/30 bg-emerald-300/15 text-emerald-50',
  amber: 'border-amber-200/30 bg-amber-300/15 text-amber-50',
  slate: 'border-white/15 bg-white/10 text-white',
}

const softMetricToneClassMap = {
  cyan: 'border-cyan-100 bg-white text-slate-900',
  emerald: 'border-emerald-100 bg-white text-slate-900',
  amber: 'border-amber-100 bg-white text-slate-900',
  slate: 'border-slate-100 bg-white text-slate-900',
}

const variantClassMap = {
  immersive: {
    root: 'bg-gradient-to-br from-medical-700 via-teal-700 to-cyan-700 text-white shadow-[0_24px_48px_-20px_rgba(15,118,110,0.85)]',
    sectionPadding: 'px-5 pb-6 pt-5',
    glow: true,
    iconWrap: 'h-12 w-12 rounded-2xl bg-white/20 ring-1 ring-white/25 text-white',
    eyebrow: 'text-white/70',
    title: 'text-white',
    titleSize: 'text-[1.65rem]',
    description: 'text-white/78',
    badge: 'border-white/15 bg-white/10 text-white/88',
    primaryAction: 'bg-white/18 text-white hover:bg-white/24',
    secondaryAction: 'border-white/20 bg-white/10 text-white hover:bg-white/15',
    footer: 'border-white/12 bg-white/10 text-white/88',
    actionLayout: 'flex shrink-0 flex-col gap-2',
    metricGrid: 'mt-5 grid gap-2.5 grid-cols-3',
    metricCard: 'rounded-2xl border p-3',
    metricValue: 'text-2xl',
    metricLabel: 'text-white/82',
    metrics: immersiveMetricToneClassMap,
  },
  soft: {
    root: 'bg-gradient-to-br from-white via-[#fdfefe] to-[#f4fbf8] text-slate-900 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.14)] ring-1 ring-slate-100',
    sectionPadding: 'px-5 pb-5 pt-4',
    glow: false,
    iconWrap: 'h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 ring-1 ring-emerald-100 text-medical-700',
    eyebrow: 'text-slate-500',
    title: 'text-slate-900',
    titleSize: 'text-[1.35rem]',
    description: 'text-slate-600',
    badge: 'border-slate-200 bg-white text-slate-600',
    primaryAction: 'bg-medical-600 text-white hover:bg-medical-700 shadow-sm',
    secondaryAction: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    footer: 'border-slate-100 bg-[#f7fbfa] text-slate-600',
    actionLayout: 'flex shrink-0 items-center gap-2 self-start pt-1',
    metricGrid: 'mt-4 grid gap-2 grid-cols-3',
    metricCard: 'rounded-2xl border p-3 shadow-[0_8px_18px_-16px_rgba(15,23,42,0.18)]',
    metricValue: 'text-lg',
    metricLabel: 'text-slate-500',
    metrics: softMetricToneClassMap,
  },
}

export default function PageHero({
  icon = 'home',
  eyebrow,
  title,
  description,
  badges = [],
  metrics = [],
  actions = [],
  footer,
  gradientClass = '',
  variant = 'immersive',
}) {
  const resolvedVariant = variantClassMap[variant] || variantClassMap.immersive
  const rootClass = variant === 'immersive' && gradientClass
    ? `${resolvedVariant.root} ${gradientClass}`
    : resolvedVariant.root

  return (
    <article className={`relative overflow-hidden rounded-[28px] ${resolvedVariant.sectionPadding} ${rootClass}`}>
      {resolvedVariant.glow ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-cyan-200/20 blur-2xl" />
        </div>
      ) : null}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-3">
              <span className={`flex shrink-0 items-center justify-center ${resolvedVariant.iconWrap}`}>
                <MedicalIcon name={icon} className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                {eyebrow ? <p className={`text-xs ${resolvedVariant.eyebrow}`}>{eyebrow}</p> : null}
                <h1 className={`truncate font-semibold leading-none ${resolvedVariant.title} ${resolvedVariant.titleSize}`}>{title}</h1>
              </div>
            </div>

            <p className={`max-w-[28rem] text-sm leading-6 ${resolvedVariant.description}`}>{description}</p>

            {badges.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium backdrop-blur ${resolvedVariant.badge}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {actions.length > 0 ? (
            <div className={resolvedVariant.actionLayout}>
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                    action.variant === 'secondary' ? resolvedVariant.secondaryAction : resolvedVariant.primaryAction
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {metrics.length > 0 ? (
          <div className={metrics.length >= 3 ? resolvedVariant.metricGrid : resolvedVariant.metricGrid.replace('grid-cols-3', 'grid-cols-2')}>
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={`${resolvedVariant.metricCard} ${resolvedVariant.metrics[metric.tone] || resolvedVariant.metrics.slate}`}
              >
                <p className={`${resolvedVariant.metricValue} font-bold leading-none`}>{metric.value}</p>
                <p className={`mt-1 text-[11px] font-medium ${resolvedVariant.metricLabel}`}>
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {footer ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur ${resolvedVariant.footer}`}>
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  )
}
