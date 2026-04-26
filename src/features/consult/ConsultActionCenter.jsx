import MedicalIcon from '../../components/MedicalIcon'

const toneMap = {
  emerald: 'from-emerald-500 to-green-600',
  amber: 'from-amber-500 to-orange-500',
  blue: 'from-blue-500 to-indigo-500',
  slate: 'from-slate-500 to-slate-600',
}

export default function ConsultActionCenter({ actions, onAction }) {
  return (
    <section className="space-y-3 px-1">
      <div className="flex items-center gap-2">
        <MedicalIcon name="ai" className="h-5 w-5 text-slate-700" />
        <h2 className="font-semibold text-slate-800">AI 建议行动</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => onAction(action)}
            className={`relative overflow-hidden rounded-2xl p-4 text-left ${action.primary ? 'col-span-2' : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${toneMap[action.tone] || toneMap.blue}`} />
            <div className="relative">
              <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <MedicalIcon name={action.icon} className="h-5 w-5 text-white" />
              </span>
              <p className="font-medium text-white">{action.title}</p>
              <p className="text-sm text-white/70">{action.desc}</p>
              {action.primary ? (
                <p className="mt-3 text-sm font-medium text-white">立即处理</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
