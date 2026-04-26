export default function PlanMedicationEditorSheet({
  open,
  editingId,
  form,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!open) return null

  return (
    <div className="sheet-overlay z-40">
      <form onSubmit={onSubmit} className="sheet-panel">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">{editingId ? '编辑药品' : '新增药品'}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
          >
            关闭
          </button>
        </div>

        <div className="space-y-3">
          <input
            name="drugName"
            value={form.drugName}
            onChange={onChange}
            placeholder="药品名称（必填）"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />

          <input
            name="spec"
            value={form.spec}
            onChange={onChange}
            placeholder="规格，如 500mg*20片"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              name="dose"
              type="number"
              min="0"
              step="0.5"
              value={form.dose}
              onChange={onChange}
              placeholder="每次剂量"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
            <input
              name="unit"
              value={form.unit}
              onChange={onChange}
              placeholder="单位"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              name="withMeal"
              value={form.withMeal}
              onChange={onChange}
              placeholder="饭前/饭后"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
            <select
              name="sourceLabel"
              value={form.sourceLabel}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            >
              <option value="手动录入">手动录入</option>
              <option value="处方导入">处方导入</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              name="stockQty"
              type="number"
              min="0"
              value={form.stockQty}
              onChange={onChange}
              placeholder="当前库存"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
            <input
              name="stockUnit"
              value={form.stockUnit}
              onChange={onChange}
              placeholder="库存单位"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
          >
            {editingId ? '保存药品修改' : '新增药品'}
          </button>
        </div>
      </form>
    </div>
  )
}
