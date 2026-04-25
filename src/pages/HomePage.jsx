import { Link } from 'react-router-dom';
import MedicalIcon from '../components/MedicalIcon';
import useStoreSnapshot from '../hooks/useStoreSnapshot';
import {
  calculateSevenDayAdherence,
  getAiSuggestion,
  getGreeting,
  getMockHealthMetrics,
  getUpcomingRefill,
} from '../utils/insights';
import {
  getTodayDateKey,
  getTodayReminderItemsFromStore,
  markReminderTaken,
  skipReminder,
  snoozeReminder,
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

function formatTime(iso) {
  if (!iso) return '--:--';
  return iso.slice(11, 16);
}

function formatDistance(targetIso) {
  if (!targetIso) return '暂无';

  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) return '即将提醒';

  return `${Math.ceil(diffMs / 60000)} 分钟后`;
}

export default function HomePage() {
  const store = useStoreSnapshot({ ensureToday: true });
  const medications = store.medications || [];
  const logs = store.intakeLogs || [];

  const todayReminders = getTodayReminderItemsFromStore(store, getTodayDateKey());
  const unresolved = todayReminders.filter((item) => !['taken', 'skipped', 'missed'].includes(item.status));

  const statusCount = {
    scheduled: todayReminders.filter((item) => item.status === 'scheduled').length,
    notified: todayReminders.filter((item) => item.status === 'notified').length,
    snoozed: todayReminders.filter((item) => item.status === 'snoozed').length,
    taken: todayReminders.filter((item) => item.status === 'taken').length,
    skipped: todayReminders.filter((item) => item.status === 'skipped').length,
    missed: todayReminders.filter((item) => item.status === 'missed').length,
  };

  const nextReminder = unresolved.sort((a, b) => (a.dueAt > b.dueAt ? 1 : -1))[0];
  const adherenceData = calculateSevenDayAdherence(medications, logs);
  const metrics = getMockHealthMetrics(adherenceData.adherence);
  const aiSuggestion = getAiSuggestion(medications, logs);
  const refill = getUpcomingRefill(medications);

  const loopSteps = [
    {
      title: '问诊',
      icon: 'consult',
      status: '问诊资料已生成',
      tone: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      title: '购药',
      icon: 'purchase',
      status: '购药风险已检查',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: '用药',
      icon: 'adherence',
      status: unresolved.length > 0 ? `今日用药待完成（${unresolved.length}项）` : '今日用药全部完成',
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      title: '续方',
      icon: 'clock',
      status: refill ? '续方提醒已开启' : '暂无续方风险',
      tone: 'bg-purple-50 text-violet-700 border-violet-100',
    },
  ];

  return (
    <section className="space-y-4">
      <article className="rounded-3xl bg-gradient-to-br from-medical-700 via-medical-600 to-cyan-600 p-5 text-white shadow-[0_20px_40px_-18px_rgba(15,118,110,0.85)]">
        <p className="text-sm text-cyan-50">{getGreeting()}，张先生</p>
        <h1 className="mt-1 text-2xl font-semibold">慢病用药小管家</h1>
        <p className="mt-2 text-sm text-cyan-50">
          下次提醒：{nextReminder ? `${formatTime(nextReminder.dueAt)}（${formatDistance(nextReminder.dueAt)}）` : '暂无'}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="text-[11px] text-cyan-100">等待提醒</p>
            <p className="mt-1 text-lg font-semibold">{statusCount.scheduled}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="text-[11px] text-cyan-100">已提醒</p>
            <p className="mt-1 text-lg font-semibold">{statusCount.notified}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="text-[11px] text-cyan-100">延后提醒</p>
            <p className="mt-1 text-lg font-semibold">{statusCount.snoozed}</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.8)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">闭环流程追踪</p>
          <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] text-medical-700">问诊-购药-用药-续方</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {loopSteps.map((step, index) => (
            <div key={step.title} className={`rounded-xl border p-3 ${step.tone}`}>
              <div className="mb-1 flex items-center gap-1 text-xs font-semibold">
                <MedicalIcon name={step.icon} className="h-4 w-4" />
                <span>0{index + 1} {step.title}</span>
              </div>
              <p className="text-[11px] leading-5">{step.status}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.8)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">提醒状态看板</p>
          <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] text-medical-700">实时</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['scheduled', 'notified', 'snoozed', 'taken', 'skipped', 'missed'].map((status) => (
            <div key={status} className="rounded-xl bg-slate-50 p-2">
              <p className="text-[11px] text-slate-500">{statusLabel[status]}</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{statusCount[status]}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.8)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">今日健康状态</p>
          <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] text-medical-700">自动评估</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-gradient-to-b from-red-50 to-white p-2">
            <div className="flex items-center gap-1 text-rose-500">
              <MedicalIcon name="pressure" className="h-4 w-4" />
              <span className="text-[11px]">血压</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">{metrics.bloodPressure}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-cyan-50 to-white p-2">
            <div className="flex items-center gap-1 text-cyan-600">
              <MedicalIcon name="sugar" className="h-4 w-4" />
              <span className="text-[11px]">血糖</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">{metrics.bloodSugar}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-emerald-50 to-white p-2">
            <div className="flex items-center gap-1 text-emerald-600">
              <MedicalIcon name="adherence" className="h-4 w-4" />
              <span className="text-[11px]">依从率</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">{metrics.adherence}</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-medical-50 p-4 shadow-[0_12px_28px_-20px_rgba(15,118,110,0.7)]">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 rounded-lg bg-medical-100 p-1 text-medical-700">
            <MedicalIcon name="ai" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI 健康建议</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{aiSuggestion}</p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/reminders"
          className="rounded-xl bg-white p-3 text-xs font-medium text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]"
        >
          <div className="mb-1 flex items-center gap-1 text-medical-700">
            <MedicalIcon name="reminder" className="h-4 w-4" /> 提醒中心
          </div>
          查看今日提醒全流程
        </Link>
        <Link
          to="/consult"
          className="rounded-xl bg-white p-3 text-xs font-medium text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]"
        >
          <div className="mb-1 flex items-center gap-1 text-medical-700">
            <MedicalIcon name="consult" className="h-4 w-4" /> AI复诊摘要
          </div>
          查看近7天问诊材料
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">今日提醒任务</h2>
        {todayReminders.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{item.medication?.drugName || '药品提醒'}</p>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {formatTime(item.scheduledAt)} · {item.medication?.dose || '--'}{item.medication?.unit || ''} · {item.medication?.withMeal || '按医嘱'}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              下次提醒：{formatTime(item.dueAt)}（{formatDistance(item.dueAt)}）
              {item.snoozeUntil ? ' · 已延后提醒' : ''}
            </p>

            {item.status === 'notified' || item.status === 'snoozed' ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => markReminderTaken(item.id)}
                  className="rounded-lg bg-medical-600 px-2 py-2 text-xs font-medium text-white"
                >
                  立即服药
                </button>
                <button
                  type="button"
                  onClick={() => snoozeReminder(item.id, 5)}
                  className="rounded-lg bg-amber-100 px-2 py-2 text-xs font-medium text-amber-700"
                >
                  5分钟后提醒
                </button>
                <button
                  type="button"
                  onClick={() => skipReminder(item.id)}
                  className="rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700"
                >
                  跳过本次
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </section>
  );
}
