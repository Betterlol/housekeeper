import { Link } from 'react-router-dom'
import { formatTime } from './helpers'

export default function ReminderCenterSection({ statusCount, nextReminder }) {
  return (
    <section className="rounded-3xl border border-white/55 bg-white/92 px-4 py-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">提醒中心</h2>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] text-amber-700">
            {statusCount.pending > 0 ? '进行中' : '稳定'}
          </span>
        </div>
        <Link to="/reminders" className="text-sm font-medium text-slate-500">管理规则</Link>
      </div>

      <div className="mb-3 rounded-2xl bg-gradient-to-br from-medical-600 to-cyan-600 p-4 text-white shadow-[0_16px_32px_-18px_rgba(13,148,136,0.85)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">今日提醒</span>
          <span className="rounded-full bg-white/20 px-2 py-1 text-[11px]">实时</span>
        </div>
        <p className="text-xs text-white/80">
          {statusCount.pending} 项待提醒 · {statusCount.taken} 项已完成 · {statusCount.skipped} 项已跳过
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-lg bg-white/10 p-2">
            <p className="text-white/70">下次提醒</p>
            <p className="font-semibold">{nextReminder ? formatTime(nextReminder.dueAt) : '--:--'}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-2">
            <p className="text-white/70">待服药</p>
            <p className="font-semibold">{statusCount.pending}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-2">
            <p className="text-white/70">漏服</p>
            <p className="font-semibold">{statusCount.missed}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/reminders" className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-900">提醒中心</p>
          <p className="mt-1 text-xs text-slate-500">管理全部提醒规则</p>
        </Link>
        <Link to="/consult" className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-sm font-medium text-violet-900">AI 复诊摘要</p>
          <p className="mt-1 text-xs text-violet-500">查看医生可读报告</p>
        </Link>
      </div>
    </section>
  )
}
