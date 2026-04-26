import MedicalIcon from '../../components/MedicalIcon'

export default function PlanOverviewCards({ summary }) {
  return (
    <section className="grid grid-cols-3 gap-3 rounded-3xl bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.9)]">
      <article className="rounded-xl bg-slate-50 p-3">
        <p className="text-2xl font-bold text-slate-900">{summary.totalMedications}</p>
        <p className="mt-0.5 text-xs text-slate-500">长期药物</p>
      </article>

      <article className="rounded-xl bg-amber-50 p-3">
        <p className="flex items-center gap-1 text-2xl font-bold text-amber-600">
          {summary.needsAttention}
          {summary.needsAttention > 0 ? <MedicalIcon name="alert" className="h-4 w-4" /> : null}
        </p>
        <p className="mt-0.5 text-xs text-amber-700/70">需要关注</p>
      </article>

      <article className="rounded-xl bg-slate-50 p-3">
        <p className="text-2xl font-bold text-slate-900">{summary.avgAdherence}%</p>
        <p className="mt-0.5 text-xs text-slate-500">本周依从率</p>
      </article>
    </section>
  )
}
