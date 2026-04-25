import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { addMedication, deleteMedication, getMedications } from '../utils/storage';

const initialForm = {
  drugName: '',
  spec: '',
  dose: 1,
  unit: '片',
  frequencyPerDay: 1,
  times: '08:00',
  withMeal: '饭后',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  stockQty: 30,
  stockUnit: '片',
};

export default function PlanPage() {
  const [form, setForm] = useState(initialForm);
  const [version, setVersion] = useState(0);

  const medications = getMedications();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.drugName.trim()) return;

    addMedication({
      drugName: form.drugName.trim(),
      spec: form.spec.trim(),
      dose: Number(form.dose),
      unit: form.unit,
      frequencyPerDay: Number(form.frequencyPerDay),
      times: form.times
        .split(',')
        .map((time) => time.trim())
        .filter(Boolean),
      withMeal: form.withMeal,
      startDate: form.startDate,
      endDate: form.endDate,
      stockQty: Number(form.stockQty),
      stockUnit: form.stockUnit,
    });

    setForm(initialForm);
    setVersion((prev) => prev + 1);
  };

  const handleDelete = (id) => {
    deleteMedication(id);
    setVersion((prev) => prev + 1);
  };

  return (
    <section key={version}>
      <PageHeader title="用药计划" subtitle="录入处方后自动生成每日提醒" />

      <form onSubmit={handleSubmit} className="mb-5 space-y-3 rounded-2xl bg-white p-4 shadow-card">
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
            name="frequencyPerDay"
            type="number"
            min="1"
            value={form.frequencyPerDay}
            onChange={handleChange}
            placeholder="每日频次"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
          <input
            name="times"
            value={form.times}
            onChange={handleChange}
            placeholder="提醒时间，逗号分隔"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            name="withMeal"
            value={form.withMeal}
            onChange={handleChange}
            placeholder="餐前/餐后"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
          />
          <input
            name="stockQty"
            type="number"
            min="0"
            value={form.stockQty}
            onChange={handleChange}
            placeholder="当前库存"
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

        <button
          type="submit"
          className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-medical-700"
        >
          保存用药计划
        </button>
      </form>

      <div className="space-y-3">
        {medications.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.drugName}</p>
                <p className="mt-1 text-xs text-slate-500">{item.spec || '未填写规格'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.frequencyPerDay}次/天 · {item.times.join(' / ')} · {item.withMeal}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  库存 {item.stockQty}
                  {item.stockUnit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
