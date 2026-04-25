import MedicalIcon from './MedicalIcon'

function formatTime(value) {
  if (!value) return '--:--'
  return value.slice(11, 16)
}

export default function ReminderModal({
  reminders,
  onTake,
  onSnooze,
  onSkip,
  permissionState,
}) {
  if (!reminders || reminders.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 reminder-overlay flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-sm">
      <div className="reminder-sheet max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-[0_30px_60px_-24px_rgba(2,132,199,0.65)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-medical-600">智能用药提醒</p>
            <h2 className="text-lg font-semibold text-slate-900">现在该服药了</h2>
          </div>
          <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] text-medical-700">
            {reminders.length} 条待处理
          </span>
        </div>

        {permissionState === 'denied' ? (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            浏览器通知权限未开启，已自动降级为站内提醒弹层。
          </p>
        ) : null}

        <div className="space-y-3">
          {reminders.map((reminder) => {
            const medication = reminder.medication || {}
            const rule = reminder.rule || {}

            return (
              <article key={reminder.id} className="rounded-2xl border border-medical-100 bg-gradient-to-r from-cyan-50/60 to-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{medication.drugName || '药品提醒'}</p>
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] text-rose-700">响铃中</span>
                </div>

                <p className="text-xs text-slate-600">
                  {formatTime(reminder.scheduledAt)} · {medication.dose || '--'}{medication.unit || ''} · {medication.withMeal || '按医嘱'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  本次第 {reminder.attemptNo || 1} 次提醒 · 剩余 {reminder.remainingRetryCount || 0} 次
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  稍后提醒间隔：{rule.retryIntervalMinutes || 5} 分钟
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onTake(reminder.id)}
                    className="rounded-lg bg-medical-600 px-2 py-2 text-xs font-medium text-white transition hover:bg-medical-700"
                  >
                    已服药
                  </button>
                  <button
                    type="button"
                    onClick={() => onSnooze(reminder.id)}
                    className="rounded-lg bg-amber-100 px-2 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-200"
                  >
                    稍后提醒
                  </button>
                  <button
                    type="button"
                    onClick={() => onSkip(reminder.id)}
                    className="rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    跳过本次
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
          <MedicalIcon name="alert" className="h-3.5 w-3.5" />
          达到最大提醒次数后仍未处理，将自动标记为已漏服。
        </div>
      </div>
    </div>
  )
}
