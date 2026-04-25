import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MedicalIcon from '../components/MedicalIcon';
import {
  buildTodaySchedule,
  calculateSevenDayAdherence,
  getAiSuggestion,
  getGreeting,
  getMockHealthMetrics,
  getUpcomingRefill,
} from '../utils/insights';
import { getIntakeLogs, getMedications, upsertIntakeLog } from '../utils/storage';

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
  const today = new Date().toISOString().slice(0, 10);

  const schedule = useMemo(
    () => buildTodaySchedule(medications, logs),
    [medications, logs, version]
  );

  const pendingCount = schedule.filter((item) => item.status === 'pending').length;
  const takenCount = schedule.filter((item) => item.status === 'taken').length;
  const missedCount = schedule.filter((item) => item.status === 'missed').length;

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
      status: pendingCount > 0 ? `今日用药待完成（${pendingCount}项）` : '今日用药待完成',
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      title: '续方',
      icon: 'clock',
      status: '续方提醒已开启',
      tone: 'bg-purple-50 text-violet-700 border-violet-100',
    },
  ];

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
    <section className="space-y-4">
      <article className="rounded-3xl bg-gradient-to-br from-medical-700 via-medical-600 to-cyan-600 p-5 text-white shadow-[0_20px_40px_-18px_rgba(15,118,110,0.85)]">
        <p className="text-sm text-cyan-50">{getGreeting()}，张先生</p>
        <h1 className="mt-1 text-2xl font-semibold">慢病用药小管家</h1>
        <p className="mt-2 text-sm text-cyan-50">今天需要完成 {schedule.length} 次服药</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="text-[11px] text-cyan-100">待服药</p>
            <p className="mt-1 text-lg font-semibold">{pendingCount}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="text-[11px] text-cyan-100">已完成</p>
            <p className="mt-1 text-lg font-semibold">{takenCount}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="text-[11px] text-cyan-100">漏服</p>
            <p className="mt-1 text-lg font-semibold">{missedCount}</p>
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

      <article className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-[0_12px_28px_-20px_rgba(234,88,12,0.65)]">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 rounded-lg bg-amber-100 p-1 text-amber-700">
            <MedicalIcon name="alert" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">续方提醒</p>
            <p className="mt-1 text-xs text-slate-600">
              {refill
                ? `${refill.drugName} 预计将在 ${refill.remainingDays} 天后用完，建议提前安排复诊续方。`
                : '暂无可计算的续方提醒。'}
            </p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/consult"
          className="rounded-xl bg-white p-3 text-xs font-medium text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]"
        >
          <div className="mb-1 flex items-center gap-1 text-medical-700">
            <MedicalIcon name="consult" className="h-4 w-4" /> AI复诊摘要
          </div>
          查看近7天问诊材料
        </Link>
        <Link
          to="/purchase"
          className="rounded-xl bg-white p-3 text-xs font-medium text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]"
        >
          <div className="mb-1 flex items-center gap-1 text-medical-700">
            <MedicalIcon name="purchase" className="h-4 w-4" /> 购药预警
          </div>
          检查库存与重复购药
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">今日用药清单</h2>
        {schedule.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
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
      </section>
    </section>
  );
}
