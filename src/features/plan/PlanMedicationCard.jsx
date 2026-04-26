import MedicalIcon from '../../components/MedicalIcon'
import PlanMedicationPillIcon from './PlanMedicationPillIcon'
import PlanStatusBadge from './PlanStatusBadge'
import PlanStockProgress from './PlanStockProgress'

export default function PlanMedicationCard({ medication, onAction }) {
  const totalStockBase = Math.max(1, Math.round((medication.dailyUse || 1) * 30))

  return (
    <article className="rounded-2xl bg-white p-4 transition active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <PlanMedicationPillIcon color={medication.color} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">{medication.drugName}</h3>
            {medication.status === 'low-stock' ? <PlanStatusBadge status="low-stock" text="库存不足" /> : null}
            {medication.status === 'missed' ? <PlanStatusBadge status="missed" text="近期漏服" /> : null}
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>{medication.spec || '未填写规格'}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{medication.dose}{medication.unit} · {medication.withMeal}</span>
          </div>

          <div className="mt-3">
            <PlanStockProgress
              current={Number(medication.stockQty || 0)}
              total={totalStockBase}
              status={medication.status}
            />
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MedicalIcon name="clock" className="h-3 w-3" />
              可用 {medication.stockDays} 天
            </span>
            <span className="inline-flex items-center gap-1">
              <MedicalIcon name="adherence" className="h-3 w-3" />
              依从率 {medication.adherence}%
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAction(medication)}
          className="-mr-1 -mt-1 rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
          aria-label="药品操作"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <circle cx="6" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="18" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      {medication.aiTip ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <MedicalIcon name="ai" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span>{medication.aiTip}</span>
          </p>
          {medication.lastMissed ? (
            <p className="mt-1 text-[11px] text-amber-600">{medication.lastMissed}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
