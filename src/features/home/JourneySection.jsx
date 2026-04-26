import MedicalIcon from '../../components/MedicalIcon'

export default function JourneySection({ journeySteps, refill }) {
  const doneCount = journeySteps.filter((item) => item.done).length

  return (
    <section className="rounded-3xl border border-white/55 bg-white/92 px-4 py-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">就医流程追踪</h2>
          <p className="mt-0.5 text-xs text-slate-500">问诊 → 购药 → 用药 → 续方</p>
        </div>
        <span className="text-sm font-medium text-medical-600">{doneCount}/4</span>
      </div>

      <div className="relative mb-4 grid grid-cols-4 gap-2">
        <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-100" />
        <div
          className="absolute left-6 top-5 h-0.5 bg-gradient-to-r from-medical-400 to-cyan-500 transition-all duration-500"
          style={{ width: `${Math.max(0, (doneCount - 1) * 31)}%` }}
        />
        {journeySteps.map((step) => (
          <div key={step.title} className="relative z-10 text-center">
            <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${
              step.done ? 'bg-medical-600 text-white shadow-md shadow-medical-300/50' : 'bg-slate-100 text-slate-400'
            }`}>
              <MedicalIcon name={step.icon} className="h-5 w-5" />
            </div>
            <p className={`mt-2 text-xs font-medium ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</p>
            <p className="text-[11px] text-slate-400">{step.status}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-medical-100 bg-gradient-to-r from-medical-50 to-cyan-50 p-3">
        <p className="text-sm font-medium text-medical-700">
          当前阶段：{journeySteps[2].detail}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {refill ? `${refill.drugName} 预计 ${refill.daysLeft} 天后库存不足。` : '当前库存风险可控，建议持续按时打卡。'}
        </p>
      </div>
    </section>
  )
}
