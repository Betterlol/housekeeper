import MedicalIcon from '../../components/MedicalIcon'
import { riskCardStyle } from './constants'

export default function ConsultRiskConsole({
  items,
  onAction,
  resolvedIds = [],
  onResolve,
}) {
  const pendingCount = items.filter((risk) => !resolvedIds.includes(risk.id)).length

  return (
    <section className="space-y-3 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MedicalIcon name="adherence" className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-800">AI 风险控制台</h2>
        </div>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-600">
          {pendingCount}项待处理
        </span>
      </div>

      {items.map((risk) => {
        const style = riskCardStyle[risk.level] || riskCardStyle.medium
        const resolved = resolvedIds.includes(risk.id)
        return (
          <article
            key={risk.id}
            className={`rounded-2xl ${style.wrap} p-4 transition ${resolved ? 'opacity-70 ring-1 ring-emerald-200' : ''}`}
          >
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.icon}`}>
                <MedicalIcon name={risk.icon} className="h-5 w-5 text-white" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-medium text-slate-800">{risk.title}</p>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${style.tag}`}>
                    {risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低'}
                  </span>
                  {resolved ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">已处理</span>
                  ) : null}
                </div>
                <p className="mb-2 text-sm text-slate-600">{risk.desc}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAction(risk)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${style.action}`}
                  >
                    {risk.actionLabel}
                    <MedicalIcon name="consult" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolve(risk)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                      resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-700 ring-1 ring-slate-200'
                    }`}
                  >
                    {resolved ? '已处理' : '标记已处理'}
                  </button>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
