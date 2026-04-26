import MedicalIcon from '../../components/MedicalIcon'

export default function PlanSectionHeader({ title, count, icon, color }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <span
        className="flex h-5 w-5 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}22` }}
      >
        <MedicalIcon name={icon} className="h-3.5 w-3.5" style={{ color }} />
      </span>
      <span className="text-sm font-medium text-slate-700">{title}</span>
      <span className="text-xs text-slate-400">{count}</span>
    </div>
  )
}
