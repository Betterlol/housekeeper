export default function ProfileDemoModeCard({
  demoMeta,
  isDefenseMode,
  statLine,
  generatedAtText,
  onGenerate,
  onReset,
}) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.9)] ring-1 ring-slate-100">
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-900">比赛演示模式</p>
        <p className="mt-1 text-xs text-slate-500">用于答辩演示全流程闭环，日常使用可保持基础数据模式。</p>
      </div>

      <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <p>当前模式：{isDefenseMode ? '答辩演示模式' : '基础数据模式'}</p>
        <p>数据标签：{demoMeta.label || '基础数据'}</p>
        <p>生成时间：{generatedAtText}</p>
        <p>{statLine}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          生成答辩演示数据
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          重置演示数据
        </button>
      </div>
    </article>
  )
}
