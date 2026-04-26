export default function ProfileEditSheet({
  open,
  form,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) return null

  return (
    <div className="sheet-overlay z-40">
      <form onSubmit={onSubmit} className="sheet-panel">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">编辑慢病档案</p>
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
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="姓名"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              name="age"
              type="number"
              min="1"
              value={form.age}
              onChange={onChange}
              placeholder="年龄"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            />
            <select
              name="gender"
              value={form.gender}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
            >
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <input
            name="diseases"
            value={form.diseases}
            onChange={onChange}
            placeholder="慢病类型，逗号分隔"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />

          <input
            name="diagnosisDate"
            type="date"
            value={form.diagnosisDate}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />

          <textarea
            name="note"
            value={form.note}
            onChange={onChange}
            rows={3}
            placeholder="备注"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
          >
            保存档案
          </button>
        </div>
      </form>
    </div>
  )
}
