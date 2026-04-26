import MedicalIcon from '../../components/MedicalIcon'
import { formatTodayLabel } from './helpers'

function HeroMetric({ value, label, tone, pulse = false }) {
  const toneClassMap = {
    amber: 'from-amber-400 to-orange-500 shadow-amber-500/35',
    emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-500/35',
    slate: 'from-white/35 to-white/20 shadow-slate-500/20',
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br p-3 text-center shadow-lg ${toneClassMap[tone]} ${pulse ? 'animate-pulse' : ''}`}>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium text-white/90">{label}</p>
    </div>
  )
}

export default function HeroSection({
  userName,
  greeting,
  statusCount,
  nextReminder,
  nextReminderMinutes,
  aiSuggestion,
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-medical-600 via-medical-700 to-cyan-700 px-5 pb-6 pt-6 text-white shadow-[0_24px_48px_-20px_rgba(15,118,110,0.85)]">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-cyan-200/20 blur-2xl" />
      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold ring-2 ring-white/35">
              {userName.slice(0, 1)}
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/70">{greeting}</p>
              <p className="text-lg font-semibold">{userName}</p>
            </div>
          </div>

          <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <MedicalIcon name="reminder" className="h-5 w-5" />
            {statusCount.pending > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400" /> : null}
          </button>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <MedicalIcon name="ai" className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-white/90">今日健康驾驶舱</span>
            </div>
            <span className="text-[11px] text-white/65">{formatTodayLabel()}</span>
          </div>

          <div className="home-breathing-glow mb-4 grid grid-cols-3 gap-2.5">
            <HeroMetric value={`${statusCount.pending}`} label="待服药" tone="amber" pulse={statusCount.pending > 0} />
            <HeroMetric value={`${statusCount.taken}`} label="已完成" tone="emerald" />
            <HeroMetric value={`${statusCount.missed}`} label="已漏服" tone="slate" />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                <MedicalIcon name="clock" className="h-6 w-6" />
              </div>
              {statusCount.pending > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-medical-700">
                  !
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/65">下次服药</p>
              <p className="truncate text-sm font-semibold">{nextReminder?.medication?.drugName || '暂无待服药任务'}</p>
              <p className="truncate text-xs text-white/70">
                {nextReminder
                  ? `${nextReminder.medication?.dose || '--'}${nextReminder.medication?.unit || ''} · ${nextReminder.medication?.withMeal || '按医嘱'}`
                  : '请先创建提醒规则'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{nextReminder ? nextReminderMinutes : '--'}</p>
              <p className="text-xs text-white/65">{nextReminder ? '分钟后' : '暂无'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <MedicalIcon name="alert" className="h-4 w-4" />
          </span>
          <p className="line-clamp-2 flex-1 text-sm">{aiSuggestion}</p>
          <span className="text-lg text-white/70">›</span>
        </div>
      </div>
    </section>
  )
}
