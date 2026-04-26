export default function ProfileArchiveCard({
  userProfile,
  statCounts,
  onEdit,
  onImport,
}) {
  const diagnosis = (userProfile?.diseases || []).join(' + ') || '待补充'

  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.85)]">
      <p className="text-sm font-semibold text-slate-900">慢病档案</p>

      <div className="mt-3 space-y-1.5 text-sm text-slate-600">
        <p>诊断：{diagnosis}</p>
        <p>初诊日期：{userProfile?.diagnosisDate || '待补充'}</p>
        <p className="leading-5 text-slate-500">档案备注：{userProfile?.note || userProfile?.doctorAdvice || '暂无备注'}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5 text-center">
          <p className="text-base font-semibold text-slate-900">{statCounts.medications}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">当前药品数</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5 text-center">
          <p className="text-base font-semibold text-slate-900">{statCounts.intakeLogs}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">服药记录数</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5 text-center">
          <p className="text-base font-semibold text-slate-900">{statCounts.adverseEvents}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">不良反应数</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          编辑档案
        </button>
        <button
          type="button"
          onClick={onImport}
          className="rounded-xl border border-sky-200 px-3 py-2 text-sm text-sky-700 transition hover:bg-sky-50"
        >
          导入报告
        </button>
      </div>
    </article>
  )
}
