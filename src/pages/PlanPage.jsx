import { useEffect, useMemo, useState } from 'react'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  addMedication,
  addReminderRule,
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

const prescriptionMockResult = [
  {
    drugName: '缬沙坦片',
    spec: '80mg*14片',
    dose: 1,
    unit: '片',
    withMeal: '饭后',
    suggestedReminderTime: '08:00',
  },
  {
    drugName: '二甲双胍片',
    spec: '500mg*60片',
    dose: 1,
    unit: '片',
    withMeal: '饭中',
    suggestedReminderTime: '20:00',
  },
]

const parseHints = [
  '正在识别处方版式与药品条目...',
  '正在提取规格、剂量与用药方式...',
  '正在生成建议提醒时间与导入草稿...',
]

export default function PlanPage() {
  const store = useStoreSnapshot()
  const medications = useMemo(() => store.medications || [], [store])

  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)

  const [message, setMessage] = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState('upload')
  const [importFile, setImportFile] = useState(null)
  const [importMode, setImportMode] = useState('plan_only')
  const [parsedPrescription, setParsedPrescription] = useState([])
  const [parseHintIndex, setParseHintIndex] = useState(0)

  useEffect(() => {
    if (!importOpen || importStep !== 'parsing') return undefined

    let hintIndex = 0
    const hintTimer = setInterval(() => {
      hintIndex = (hintIndex + 1) % parseHints.length
      setParseHintIndex(hintIndex)
    }, 700)

    const doneTimer = setTimeout(() => {
      setParsedPrescription(prescriptionMockResult)
      setImportStep('result')
    }, 2400)

    return () => {
      clearInterval(hintTimer)
      clearTimeout(doneTimer)
    }
  }, [importOpen, importStep])

  const openCreate = () => {
    setEditingId('')
    setForm(initialForm)
    setEditorOpen(true)
  }

  const openEdit = (medication) => {
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
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId('')
    setForm(initialForm)
  }

  const openImportSheet = () => {
    setImportOpen(true)
    setImportStep('upload')
    setImportFile(null)
    setImportMode('plan_only')
    setParsedPrescription([])
    setParseHintIndex(0)
  }

  const closeImportSheet = () => {
    setImportOpen(false)
    setImportStep('upload')
    setImportFile(null)
    setImportMode('plan_only')
    setParsedPrescription([])
    setParseHintIndex(0)
  }

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
      setMessage('药品信息已更新。')
    } else {
      addMedication(payload)
      setMessage('药品已新增。')
    }

    closeEditor()
  }

  const startMockParse = () => {
    if (!importFile) {
      setMessage('请先上传处方文件。')
      return
    }

    setImportStep('parsing')
    setParseHintIndex(0)
  }

  const confirmImport = () => {
    parsedPrescription.forEach((item) => {
      const medication = addMedication({
        drugName: item.drugName,
        spec: item.spec,
        dose: item.dose,
        unit: item.unit,
        withMeal: item.withMeal,
        stockQty: 30,
        stockUnit: '片',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        sourceLabel: '处方导入',
      })

      if (importMode === 'plan_and_reminder') {
        addReminderRule({
          medicationId: medication.id,
          time: item.suggestedReminderTime,
          enabled: true,
          repeatDays: [0, 1, 2, 3, 4, 5, 6],
          retryIntervalMinutes: 5,
          maxRetryCount: 3,
        })
      }
    })

    setImportStep('success')
    setMessage(importMode === 'plan_and_reminder' ? '处方已导入，并已生成提醒规则。' : '处方已导入到用药计划。')

    setTimeout(() => {
      closeImportSheet()
    }, 900)
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">用药计划</h1>
          <p className="mt-1 text-sm text-slate-500">仅管理药品属性，不在此页面设置闹钟</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openImportSheet}
            className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-medium text-white"
          >
            导入处方
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-medical-600 px-3 py-2 text-xs font-medium text-white"
          >
            新增药品
          </button>
        </div>
      </header>

      {message ? (
        <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </article>
      ) : null}

      <section className="space-y-3">
        {medications.length === 0 ? (
          <article className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-card">
            暂无药品，请点击右上角“新增药品”或“导入处方”。
          </article>
        ) : null}

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
                  onClick={() => openEdit(item)}
                  className="rounded-lg border border-medical-200 px-2 py-1 text-xs text-medical-700"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => deleteMedication(item.id)}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                >
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {editorOpen ? (
        <div className="sheet-overlay z-40">
          <form
            onSubmit={handleSubmit}
            className="sheet-panel"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">{editingId ? '编辑药品' : '新增药品'}</p>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                关闭
              </button>
            </div>

            <div className="space-y-3">
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

              <button
                type="submit"
                className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
              >
                {editingId ? '保存药品修改' : '新增药品'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {importOpen ? (
        <div className="sheet-overlay z-40">
          <div className="sheet-panel">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">导入处方（AI解析演示）</p>
              <button
                type="button"
                onClick={closeImportSheet}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                关闭
              </button>
            </div>

            <div className="mb-3 grid grid-cols-4 gap-1 text-[11px]">
              {['上传文件', 'AI解析中', '结果预览', '确认完成'].map((label, index) => {
                const stepMap = { upload: 0, parsing: 1, result: 2, success: 3 }
                const active = index <= stepMap[importStep]

                return (
                  <span
                    key={label}
                    className={`rounded-lg px-2 py-1 text-center ${active ? 'bg-medical-100 text-medical-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {label}
                  </span>
                )
              })}
            </div>

            {importStep === 'upload' ? (
              <div className="space-y-3">
                <label className="block rounded-2xl border border-dashed border-medical-200 bg-medical-50 p-4 text-center">
                  <p className="text-sm font-medium text-medical-700">上传处方文件（jpg/png/pdf/txt）</p>
                  <p className="mt-1 text-xs text-slate-500">仅做 AI 解析架构展示，不进行真实 OCR</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.txt"
                    className="mt-3 block w-full text-xs text-slate-600"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setImportFile(file)
                    }}
                  />
                </label>

                {importFile ? (
                  <p className="text-xs text-slate-600">已选择文件：{importFile.name}</p>
                ) : (
                  <p className="text-xs text-slate-500">尚未选择文件</p>
                )}

                <button
                  type="button"
                  onClick={startMockParse}
                  className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
                >
                  开始AI解析
                </button>
              </div>
            ) : null}

            {importStep === 'parsing' ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-medical-200 border-t-medical-600" />
                <p className="mt-3 text-sm font-medium text-slate-700">AI解析中...</p>
                <p className="mt-1 text-xs text-slate-500">{parseHints[parseHintIndex]}</p>
              </div>
            ) : null}

            {importStep === 'result' ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">mock 处方结果</p>
                  <div className="mt-2 space-y-2">
                    {parsedPrescription.map((item, index) => (
                      <article key={`${item.drugName}-${index}`} className="rounded-xl bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{item.drugName}</p>
                        <p className="mt-1 text-xs text-slate-500">规格：{item.spec}</p>
                        <p className="mt-1 text-xs text-slate-500">剂量：{item.dose}{item.unit}</p>
                        <p className="mt-1 text-xs text-slate-500">用药方式：{item.withMeal}</p>
                        <p className="mt-1 text-xs text-medical-700">建议提醒时间：{item.suggestedReminderTime}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-medical-100 bg-medical-50 p-3 text-xs text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'plan_only'}
                      onChange={() => setImportMode('plan_only')}
                    />
                    仅加入用药计划
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'plan_and_reminder'}
                      onChange={() => setImportMode('plan_and_reminder')}
                    />
                    同时生成提醒规则
                  </label>
                </div>

                <button
                  type="button"
                  onClick={confirmImport}
                  className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
                >
                  确认导入
                </button>
              </div>
            ) : null}

            {importStep === 'success' ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                <p className="text-sm font-semibold text-emerald-700">导入成功</p>
                <p className="mt-1 text-xs text-emerald-700">已完成处方解析与数据写入。</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
