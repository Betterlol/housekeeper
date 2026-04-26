export default function PlanHeader({ onImport, onCreate }) {
  return (
    <header className="rounded-3xl bg-white px-5 pb-4 pt-5 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.9)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">我的药盒</h1>
          <p className="mt-0.5 text-sm text-slate-500">管理您的长期用药（药品属性管理）</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onImport}
            className="rounded-full bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-700"
          >
            导入处方
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-full bg-teal-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-teal-700"
          >
            添加药品
          </button>
        </div>
      </div>
    </header>
  )
}
