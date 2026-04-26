import PlanMedicationPillIcon from './PlanMedicationPillIcon'
import { actionSheetItems } from './constants'

const toneClass = {
  default: 'text-slate-700',
  primary: 'text-blue-600',
  danger: 'text-rose-600',
}

export default function PlanActionSheet({
  open,
  medication,
  onClose,
  onAction,
}) {
  if (!open || !medication) return null

  return (
    <div className="sheet-overlay z-40">
      <article className="sheet-panel">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlanMedicationPillIcon color={medication.color} size="sm" />
            <div>
              <p className="font-semibold text-slate-900">{medication.drugName}</p>
              <p className="text-sm text-slate-500">{medication.spec || '未填写规格'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
          >
            关闭
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          {actionSheetItems.map((action, index) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction(action.key, medication)}
              className={`w-full px-4 py-3.5 text-left text-base ${toneClass[action.tone]} transition hover:bg-slate-50 ${
                index !== actionSheetItems.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          取消
        </button>
      </article>
    </div>
  )
}
