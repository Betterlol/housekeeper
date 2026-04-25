import { useMemo, useState } from 'react';
import MedicalIcon from '../components/MedicalIcon';
import useStoreSnapshot from '../hooks/useStoreSnapshot';
import {
  getTodayDateKey,
  getTodayReminderItemsFromStore,
  markAllTodayTaken,
  markReminderTaken,
  restoreReminderDemoData,
  skipReminder,
  snoozeReminder,
  triggerReminderNow,
} from '../utils/storage';

const statusStyle = {
  scheduled: 'bg-slate-100 text-slate-700',
  notified: 'bg-rose-100 text-rose-700',
  snoozed: 'bg-amber-100 text-amber-700',
  taken: 'bg-emerald-100 text-emerald-700',
  skipped: 'bg-slate-200 text-slate-700',
  missed: 'bg-rose-100 text-rose-700',
};

const statusLabel = {
  scheduled: '等待提醒',
  notified: '已提醒',
  snoozed: '延后提醒',
  taken: '已服药',
  skipped: '已跳过',
  missed: '已漏服',
};

function formatTime(value) {
  if (!value) return '--:--';
  return value.slice(11, 16);
}

function formatDistance(target) {
  if (!target) return '暂无';

  const diffMs = new Date(target).getTime() - Date.now();
  if (diffMs <= 0) return '即将提醒';

  const minutes = Math.ceil(diffMs / 60000);
  return `${minutes} 分钟后`;
}

export default function RemindersPage() {
  const [message, setMessage] = useState('');
  const store = useStoreSnapshot({ ensureToday: true });

  const todayItems = useMemo(
    () => getTodayReminderItemsFromStore(store, getTodayDateKey()),
    [store]
  );

  const completed = todayItems.filter((item) => item.status === 'taken' || item.status === 'skipped');
  const snoozed = todayItems.filter((item) => item.status === 'snoozed');
  const missed = todayItems.filter((item) => item.status === 'missed');

  const nextReminder = todayItems
    .filter((item) => !['taken', 'skipped', 'missed'].includes(item.status))
    .sort((a, b) => (a.dueAt > b.dueAt ? 1 : -1))[0];

  return (
    <section className="space-y-4">
      <article className="rounded-3xl bg-gradient-to-br from-cyan-700 via-medical-700 to-emerald-700 p-5 text-white shadow-[0_22px_44px_-20px_rgba(15,118,110,0.85)]">
        <p className="text-xs text-cyan-100">智能提醒中心</p>
        <h1 className="mt-1 text-xl font-semibold">今日全部提醒</h1>
        <p className="mt-2 text-xs text-cyan-100">
          下次提醒：{nextReminder ? `${formatTime(nextReminder.dueAt)}（${formatDistance(nextReminder.dueAt)}）` : '暂无'}
        </p>
      </article>

      {message ? (
        <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </article>
      ) : null}

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              markAllTodayTaken();
              setMessage('今日提醒已一键标记为已服药。');
            }}
            className="rounded-xl bg-medical-600 px-3 py-2 text-xs font-medium text-white"
          >
            一键全部已服药
          </button>

          <button
            type="button"
            onClick={() => {
              restoreReminderDemoData();
              setMessage('已恢复演示提醒数据。');
            }}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white"
          >
            一键恢复演示提醒数据
          </button>
        </div>

        <p className="text-xs text-slate-500">
          今日：{todayItems.length} 条提醒 · 已完成 {completed.length} 条 · 延后 {snoozed.length} 条 · 漏服 {missed.length} 条
        </p>
      </article>

      <section className="space-y-3">
        {todayItems.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.medication?.drugName || '药品提醒'}</p>
              <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusStyle[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {formatTime(item.scheduledAt)} · {item.medication?.dose || '--'}{item.medication?.unit || ''} · {item.medication?.withMeal || '按医嘱'}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              下次触发：{formatTime(item.dueAt)} · {formatDistance(item.dueAt)}
              {item.snoozeUntil ? ' · 已延后提醒' : ''}
            </p>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => markReminderTaken(item.id)}
                className="rounded-lg bg-emerald-600 px-2 py-2 text-[11px] font-medium text-white"
              >
                已服药
              </button>

              <button
                type="button"
                onClick={() => snoozeReminder(item.id, 5)}
                className="rounded-lg bg-amber-100 px-2 py-2 text-[11px] font-medium text-amber-700"
              >
                延后5分
              </button>

              <button
                type="button"
                onClick={() => skipReminder(item.id)}
                className="rounded-lg bg-slate-100 px-2 py-2 text-[11px] font-medium text-slate-700"
              >
                跳过
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerReminderNow(item.id);
                  setMessage(`${item.medication?.drugName || '当前任务'} 已手动触发提醒。`);
                }}
                className="rounded-lg bg-rose-100 px-2 py-2 text-[11px] font-medium text-rose-700"
              >
                手动提醒
              </button>
            </div>
          </article>
        ))}
      </section>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <div className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-900">
          <MedicalIcon name="clock" className="h-4 w-4 text-medical-700" />
          提醒小结
        </div>
        <p className="text-xs leading-5 text-slate-600">
          已完成提醒：{completed.length} 条；延后提醒：{snoozed.length} 条；漏服记录：{missed.length} 条。
          可在答辩现场手动触发提醒，演示完整“提醒-延后-再次提醒-服药打卡”流程。
        </p>
      </article>
    </section>
  );
}
