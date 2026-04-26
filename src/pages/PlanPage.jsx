import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  addMedication,
  addReminderRule,
  deleteMedication,
  updateMedication,
} from '../utils/storage'
import {
  initialMedicationForm,
  parseHints,
  prescriptionMockResult,
  todayDateValue,
} from '../features/plan/constants'
import {
  enrichMedications,
  getPlanSummary,
  getTopInsight,
  mapMedicationToForm,
  splitMedicationGroups,
} from '../features/plan/helpers'
import PlanHeader from '../features/plan/PlanHeader'
import PlanOverviewCards from '../features/plan/PlanOverviewCards'
import PlanInsightBanner from '../features/plan/PlanInsightBanner'
import PlanSectionHeader from '../features/plan/PlanSectionHeader'
import PlanMedicationCard from '../features/plan/PlanMedicationCard'
import PlanActionSheet from '../features/plan/PlanActionSheet'
import PlanMedicationEditorSheet from '../features/plan/PlanMedicationEditorSheet'
import PlanPrescriptionImportSheet from '../features/plan/PlanPrescriptionImportSheet'
import PageSurface from '../components/common/PageSurface'

export default function PlanPage() {
  const navigate = useNavigate()
  const store = useStoreSnapshot()

  const [form, setForm] = useState(initialMedicationForm)
  const [editingId, setEditingId] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [message, setMessage] = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState('upload')
  const [importFile, setImportFile] = useState(null)
  const [importMode, setImportMode] = useState('plan_only')
  const [parsedPrescription, setParsedPrescription] = useState([])
  const [parseHintIndex, setParseHintIndex] = useState(0)

  const [actionTarget, setActionTarget] = useState(null)

  const enrichedMedications = useMemo(() => enrichMedications(store), [store])
  const groups = useMemo(() => splitMedicationGroups(enrichedMedications), [enrichedMedications])
  const summary = useMemo(() => getPlanSummary(enrichedMedications), [enrichedMedications])
  const topInsight = useMemo(() => getTopInsight(enrichedMedications), [enrichedMedications])

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
    setForm(initialMedicationForm)
    setEditorOpen(true)
  }

  const openEdit = (medication) => {
    setEditingId(medication.id)
    setForm(mapMedicationToForm(medication, todayDateValue))
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId('')
    setForm(initialMedicationForm)
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
    if (!form.drugName.trim()) {
      setMessage('请先填写药品名称。')
      return
    }

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
        startDate: todayDateValue,
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

  const handleInsightClick = () => {
    if (topInsight.includes('库存')) {
      navigate('/purchase')
      return
    }

    if (topInsight.includes('依从')) {
      navigate('/reminders')
      return
    }

    navigate('/consult')
  }

  const handleOpenAction = (medication) => {
    setActionTarget(medication)
  }

  const handleCloseAction = () => {
    setActionTarget(null)
  }

  const handleAction = (actionKey, medication) => {
    if (!medication) return

    if (actionKey === 'edit') {
      handleCloseAction()
      openEdit(medication)
      return
    }

    if (actionKey === 'delete') {
      deleteMedication(medication.id)
      handleCloseAction()
      setMessage(`${medication.drugName} 已删除。`)
      return
    }

    if (actionKey === 'refill') {
      handleCloseAction()
      setMessage(`已为 ${medication.drugName} 生成续方建议。`)
      navigate('/purchase')
      return
    }

    if (actionKey === 'reminder') {
      handleCloseAction()
      navigate('/reminders')
    }
  }

  return (
    <PageSurface variant="plan" className="space-y-4 pb-2">
      <PlanHeader onImport={openImportSheet} onCreate={openCreate} />
      <PlanOverviewCards summary={summary} />
      <PlanInsightBanner insight={topInsight} onClick={handleInsightClick} />

      {message ? (
        <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </article>
      ) : null}

      {enrichedMedications.length === 0 ? (
        <article className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-card">
          暂无药品，请点击顶部“添加药品”或“导入处方”。
        </article>
      ) : (
        <section className="space-y-5">
          {groups.attention.length > 0 ? (
            <div>
              <PlanSectionHeader title="需要关注" count={groups.attention.length} icon="alert" color="#F59E0B" />
              <div className="space-y-3">
                {groups.attention.map((medication) => (
                  <PlanMedicationCard
                    key={medication.id}
                    medication={medication}
                    onAction={handleOpenAction}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {groups.normal.length > 0 ? (
            <div>
              <PlanSectionHeader title="长期用药" count={groups.normal.length} icon="plan" color="#10B981" />
              <div className="space-y-3">
                {groups.normal.map((medication) => (
                  <PlanMedicationCard
                    key={medication.id}
                    medication={medication}
                    onAction={handleOpenAction}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <PlanMedicationEditorSheet
        open={editorOpen}
        editingId={editingId}
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onClose={closeEditor}
      />

      <PlanPrescriptionImportSheet
        open={importOpen}
        importStep={importStep}
        importFile={importFile}
        importMode={importMode}
        parseHint={parseHints[parseHintIndex]}
        parsedPrescription={parsedPrescription}
        onClose={closeImportSheet}
        onPickFile={setImportFile}
        onStartParse={startMockParse}
        onChangeMode={setImportMode}
        onConfirm={confirmImport}
      />

      <PlanActionSheet
        open={Boolean(actionTarget)}
        medication={actionTarget}
        onClose={handleCloseAction}
        onAction={handleAction}
      />
    </PageSurface>
  )
}
