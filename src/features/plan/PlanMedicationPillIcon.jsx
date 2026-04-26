import MedicalIcon from '../../components/MedicalIcon'

export default function PlanMedicationPillIcon({ color, size = 'md' }) {
  const sizeClass = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size] || 'h-10 w-10'

  return (
    <span
      className={`${sizeClass} flex items-center justify-center rounded-xl`}
      style={{ backgroundColor: `${color}22` }}
    >
      <MedicalIcon name="plan" className="h-5 w-5" style={{ color }} />
    </span>
  )
}
