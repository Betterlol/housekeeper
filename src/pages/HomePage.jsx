import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { getIntakeLogs, getMedications, upsertIntakeLog } from '../utils/storage';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function toMinutes(datetime) {
  const [, time] = datetime.split('T');
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function getStatus(item, log) {
  if (log?.status === 'taken') return 'taken';
  if (log?.status === 'missed') return 'missed';

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const itemMinutes = toMinutes(item.scheduledAt);

  return nowMinutes - itemMinutes >= 120 ? 'missed' : 'pending';
}

const statusLabel = {
  pending: '待服药',
  taken: '已服药',
  missed: '漏服',
};

const statusClass = {
  pending: 'bg-amber-100 text-amber-700',
  taken: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-rose-100 text-rose-700',
};

export default function HomePage() {
  const [version, setVersion] = useState(0);
  const medications = getMedications();
  const logs = getIntakeLogs();
  const today = getToday();

  const schedule = useMemo(() => {
    const rows = medications.flatMap((med) =>
      med.times.map((time) => {
        const scheduledAt = `${today}T${time}`;
        const log = logs.find((item) => item.medId === med.id && item.scheduledAt === scheduledAt);
        const status = getStatus({ scheduledAt }, log);

        return {
          id: `${med.id}-${time}`,
          medId: med.id,
          drugName: med.drugName,
          doseText: `${med.dose}${med.unit}`,
          withMeal: med.withMeal,
          time,
          scheduledAt,
          status,
          takenAt: log?.takenAt || '',
        };
      })
    );

    return rows.sort((a, b) => (a.time > b.time ? 1 : -1));
  }, [medications, logs, today, version]);

  const pendingCount = schedule.filter((item) => item.status === 'pending').length;
  const takenCount = schedule.filter((item) => item.status === 'taken').length;
  const missedCount = schedule.filter((item) => item.status === 'missed').length;

  const handleTake = (item) => {
    upsertIntakeLog({
      medId: item.medId,
      scheduledAt: item.scheduledAt,
      status: 'taken',
      takenAt: `${today}T${new Date().toTimeString().slice(0, 5)}`,
      reason: '',
    });
    setVersion((prev) => prev + 1);
  };

  return (
    <section>
      <PageHeader title="今日用药" subtitle="按时打卡，连续用药更安心" />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-card">
          <p className="text-xs text-slate-500">待服药</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-card">
          <p className="text-xs text-slate-500">已完成</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{takenCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-card">
          <p className="text-xs text-slate-500">漏服</p>
          <p className="mt-1 text-lg font-bold text-rose-600">{missedCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {schedule.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{item.drugName}</p>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {item.time} · {item.doseText} · {item.withMeal}
            </p>

            {item.status !== 'taken' ? (
              <button
                type="button"
                onClick={() => handleTake(item)}
                className="mt-3 w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-medical-700"
              >
                立即打卡
              </button>
            ) : (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                已于 {item.takenAt.slice(11, 16)} 完成服药
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
