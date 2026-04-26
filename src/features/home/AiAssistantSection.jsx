import MedicalIcon from '../../components/MedicalIcon'

export default function AiAssistantSection({ aiSuggestion, adherenceData, trendData }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-5 text-white shadow-[0_20px_44px_-24px_rgba(15,23,42,0.95)]">
      <div className="home-shimmer absolute inset-0 opacity-15" />
      <div className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="absolute -bottom-8 -left-6 h-28 w-28 rounded-full bg-cyan-500/30 blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/80">
              <MedicalIcon name="ai" className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold">AI 健康助理</h2>
          </div>
          <span className="rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-300">分析中</span>
        </div>

        <p className="mb-3 text-sm leading-6 text-white/90">{aiSuggestion}</p>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-1 text-amber-300">依从率风险</span>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-1 text-cyan-300">作息建议</span>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/20 px-2 py-1 text-violet-300">AI 生成</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-white/60">本周依从率趋势</span>
            <span className="text-xs text-cyan-300">{adherenceData.adherence}%</span>
          </div>
          <div className="flex h-12 items-end gap-1">
            {(trendData.length === 7 ? trendData : Array.from({ length: 7 }).map(() => ({ adherence: adherenceData.adherence }))).map((day, index) => (
              <span
                key={`${day.dateKey || index}`}
                className={`flex-1 rounded-sm ${index === 6 ? 'bg-gradient-to-t from-cyan-500 to-cyan-300' : 'bg-white/20'}`}
                style={{ height: `${30 + Math.round((day.adherence / 100) * 60)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
