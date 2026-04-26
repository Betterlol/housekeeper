import { timelineStatusLabel, visibleStatusLabel } from './constants'
import { formatDistance, formatTime, toMinutes } from './helpers'

function TimelineItem({ item, onTake, onSkip }) {
  const isCurrent = item.timelineState === 'current'
  const isDone = item.timelineState === 'done'
  const isMissed = item.timelineState === 'missed'
  const isSkipped = item.timelineState === 'skipped'
  const isOff = item.timelineState === 'off'
  const isPending = item.timelineState === 'upcoming' || item.timelineState === 'current'
  const dueMinutes = toMinutes(item.dueAt || item.scheduledAt || '')

  return (
    <article className="relative flex gap-3 py-1">
      <div className="w-[44px] shrink-0">
        <p className={`mb-2 text-center text-[11px] font-medium ${
          isCurrent
            ? 'text-medical-600'
            : isDone
              ? 'text-emerald-500'
              : isMissed
                ? 'text-rose-500'
                : 'text-slate-400'
        }`}>
          {formatTime(item.scheduledAt)}
        </p>

        <div className="relative mx-auto h-5 w-5">
          {isCurrent ? (
            <>
              <span className="absolute inset-0 rounded-full bg-medical-400/35 animate-ping" />
              <span className="absolute inset-[3px] rounded-full bg-medical-300/40" />
            </>
          ) : null}

          <span
            className={`relative z-10 block h-5 w-5 rounded-full border-2 ${
              isCurrent
                ? 'border-medical-500 bg-medical-500'
                : isDone
                  ? 'border-emerald-500 bg-emerald-500'
                  : isMissed
                    ? 'border-rose-500 bg-rose-500'
                    : isSkipped
                      ? 'border-slate-400 bg-slate-400'
                      : isOff
                        ? 'border-slate-300 bg-slate-200'
                        : 'border-cyan-300 bg-white'
            }`}
          />
        </div>
      </div>

      <div className={`flex-1 rounded-2xl border p-3 transition ${
        isCurrent
          ? 'border-medical-200 bg-gradient-to-r from-medical-50 via-white to-cyan-50 shadow-[0_16px_32px_-24px_rgba(13,148,136,0.8)]'
          : isDone
            ? 'border-emerald-100 bg-emerald-50/40'
            : isMissed
              ? 'border-rose-100 bg-rose-50/60'
              : isSkipped
                ? 'border-slate-100 bg-slate-50'
                : isOff
                  ? 'border-slate-200 bg-slate-50/70'
                  : 'border-slate-100 bg-white'
      }`}>
        {isCurrent ? (
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            {dueMinutes} 分钟后到时
          </div>
        ) : null}

        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-semibold ${isCurrent ? 'text-slate-900' : 'text-slate-800'}`}>
              {item.medication?.drugName || '药品提醒'}
            </p>
            <p className="text-xs text-slate-500">
              {item.medication?.dose || '--'}{item.medication?.unit || ''} · {item.medication?.withMeal || '按医嘱'}
            </p>
          </div>
          <div className="text-right">
            <span className={`rounded-full px-2 py-1 text-[11px] ${
              isCurrent
                ? 'bg-medical-100 text-medical-700'
                : isDone
                  ? 'bg-emerald-100 text-emerald-700'
                  : isMissed
                    ? 'bg-rose-100 text-rose-700'
                    : isSkipped
                      ? 'bg-slate-200 text-slate-700'
                      : isOff
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-cyan-100 text-cyan-700'
            }`}>
              {timelineStatusLabel[item.timelineState]}
            </span>
            {isPending ? (
              <p className="mt-1 text-[11px] text-slate-500">
                {item.id && item.dueAt ? `下次：${formatDistance(item.dueAt)}` : ''}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">{visibleStatusLabel[item.visibleStatus]}</p>
            )}
          </div>
        </div>

        {isDone ? (
          <p className="mb-2 text-[11px] text-emerald-600">本次用药已完成</p>
        ) : null}
        {isMissed ? (
          <p className="mb-2 text-[11px] text-rose-600">本次提醒未处理，已标记漏服</p>
        ) : null}

        {isPending ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTake}
              className={`rounded-xl px-3 py-2 text-xs font-medium text-white ${
                isCurrent ? 'bg-gradient-to-r from-medical-600 to-cyan-600' : 'bg-medical-600'
              }`}
            >
              立即服药
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
            >
              标记跳过
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function TimelineSection({ timelineItems, statusCount, onTake, onSkip }) {
  return (
    <section id="today-reminder-tasks" className="rounded-3xl border border-white/55 bg-white/92 px-4 py-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">今日用药时间流</h2>
          <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] font-medium text-medical-700">
            {statusCount.taken}/{timelineItems.length || 0} 已完成
          </span>
        </div>
        <span className="text-xs text-slate-400">按时间排序</span>
      </div>

      {timelineItems.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          今日暂无提醒任务，请先前往“提醒”页面创建闹钟规则。
        </article>
      ) : (
        <div className="relative">
          <div className="absolute bottom-3 left-[22px] top-6 w-0.5 bg-gradient-to-b from-emerald-300 via-medical-300 to-slate-200" />
          <div className="space-y-1">
            {timelineItems.map((item) => (
              <TimelineItem
                key={item.id}
                item={item}
                onTake={() => onTake(item.id)}
                onSkip={() => onSkip(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
