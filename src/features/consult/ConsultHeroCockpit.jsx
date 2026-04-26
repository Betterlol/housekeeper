import { useEffect, useState } from 'react'
import MedicalIcon from '../../components/MedicalIcon'

export default function ConsultHeroCockpit({
  analysisComplete,
  riskMeta,
  summary,
  weekWindowLabel,
}) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (analysisComplete) return undefined

    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : `${prev}.`))
    }, 500)

    return () => clearInterval(timer)
  }, [analysisComplete])

  return (
    <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.95)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-5 -top-6 h-36 w-36 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-10 -right-8 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500">
              <MedicalIcon name="ai" className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-medium text-white/90">AI 复诊分析中心</p>
              <p className="text-[11px] text-white/60">统计周期：{weekWindowLabel}</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
            {analysisComplete ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            ) : (
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
            )}
            {analysisComplete ? '分析完成' : `分析中${dots}`}
          </span>
        </div>

        {analysisComplete ? (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-white/55">综合风险评估</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-2xl font-bold ${riskMeta.textClass}`}>{riskMeta.label}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs ${riskMeta.badgeClass}`}>需关注</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/55">AI 健康评分</p>
                <p className="mt-1 text-2xl font-bold text-white">{riskMeta.score}</p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-300">
                <MedicalIcon name="alert" className="h-4 w-4" />
                <p className="text-sm font-medium">AI 发现主要风险</p>
              </div>
              <p className="text-sm leading-relaxed text-white/80">
                {summary.aiSummary}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-[11px] text-white/55">依从率</p>
                <p className="mt-1 text-lg font-semibold text-cyan-400">{summary.adherence}%</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-[11px] text-white/55">漏服次数</p>
                <p className="mt-1 text-lg font-semibold text-amber-300">{summary.missedCount}次</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-[11px] text-white/55">建议复诊</p>
                <p className="mt-1 text-sm font-semibold text-white">{summary.nextVisitDate}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm text-white/75">正在整合近7天提醒实例、服药记录与购药风险，请稍候...</p>
          </div>
        )}
      </div>
    </article>
  )
}
