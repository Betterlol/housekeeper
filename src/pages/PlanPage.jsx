import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  addMedication,
  deleteMedication,
  updateMedication,
} from '../utils/storage'

const initialForm = {
  drugName: '',
  spec: '',
  dose: 1,
  unit: '片',
  withMeal: '饭后',
  stockQty: 30,
  stockUnit: '片',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  sourceLabel: '手动录入',
}

export default function PlanPage() {
  const store = useStoreSnapshot()
  const medications = useMemo(() => store.medications || [], [store])

  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.drugName.trim()) return

    const payload = {
      drugName: form.drugName.trim(),
      spec: form.spec.trim(),
      dose: Number(form.dose || 1),
      unit: form.unit,
      withMeal: form.withMeal,
      stockQty: Number(form.stockQty || 0),
      stockUnit: form.stockUnit,
      startDate: form.startDate,
      endDate: form.endDate,
      sourceLabel: form.sourceLabel,
    }

    if (editingId) {
      updateMedication(editingId, payload)
    } else {
      addMedication(payload)
    }

    setForm(initialForm)
    setEditingId('')
  }

  const handleEdit = (medication) => {
    setEditingId(medication.id)
    setForm({
      drugName: medication.drugName || '',
      spec: medication.spec || '',
      dose: medication.dose || 1,
      unit: medication.unit || '片',
      withMeal: medication.withMeal || '饭后',
      stockQty: medication.stockQty || 0,
      stockUnit: medication.stockUnit || '片',
      startDate: medication.startDate || initialForm.startDate,
      endDate: medication.endDate || '',
      sourceLabel: medication.sourceLabel || '手动录入',
    })
  }

  const handleDelete = (id) => {
    deleteMedication(id)
    if (editingId === id) {
      setEditingId('')
      setForm(initialForm)
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader title="用药计划" subtitle="仅管理药品属性，不在此页面设置闹钟" />

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
        <input
          name="drugName"
          value={form.drugName}
          onChange={handleChange}
          placeholder="药品名称（必填）"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
        />

        <input
          name="spec"
          value={form.spec}
          onChange={handleChange}
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
            onChange={handleChange}
            placeholder="每次剂量"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
          <input
            name="unit"
            value={form.unit}
            onChange={handleChange}
            placeholder="单位"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            name="withMeal"
            value={form.withMeal}
            onChange={handleChange}
            placeholder="饭前/饭后"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
          <select
            name="sourceLabel"
            value={form.sourceLabel}
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="当前库存"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
          <input
            name="stockUnit"
            value={form.stockUnit}
            onChange={handleChange}
            placeholder="库存单位"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-medical-700"
          >
            {editingId ? '保存药品修改' : '新增药品'}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingId('')
              setForm(initialForm)
            }}
            className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
          >
            清空
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {medications.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.drugName}</p>
                <p className="mt-1 text-xs text-slate-500">{item.spec || '未填写规格'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.dose}{item.unit} · {item.withMeal}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  库存 {item.stockQty}{item.stockUnit}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  疗程 {item.startDate || '未设定'} ~ {item.endDate || '长期'}
                </p>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                  来源：{item.sourceLabel || '手动录入'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="rounded-lg border border-medical-200 px-2 py-1 text-xs text-medical-700"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                >
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
