import MedicalIcon from '../../components/MedicalIcon'

export default function PlanInsightBanner({ insight, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-blue-50 p-3 text-left transition hover:bg-blue-100"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
        <MedicalIcon name="ai" className="h-4 w-4 text-blue-600" />
      </span>
      <p className="flex-1 text-sm text-slate-700">
        {insight}
      </p>
      <MedicalIcon name="consult" className="h-5 w-5 shrink-0 text-slate-400" />
    </button>
  )
}
