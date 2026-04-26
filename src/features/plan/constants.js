function toDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const todayDateValue = toDateInputValue()

export const initialMedicationForm = {
  drugName: '',
  spec: '',
  dose: 1,
  unit: '片',
  withMeal: '饭后',
  stockQty: 30,
  stockUnit: '片',
  startDate: todayDateValue,
  endDate: '',
  sourceLabel: '手动录入',
}

export const prescriptionMockResult = [
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

export const parseHints = [
  '正在识别处方版式与药品条目...',
  '正在提取规格、剂量与用药方式...',
  '正在生成建议提醒时间与导入草稿...',
]

export const actionSheetItems = [
  { key: 'edit', label: '编辑药品信息', tone: 'default' },
  { key: 'refill', label: '申请续方', tone: 'primary' },
  { key: 'reminder', label: '调整提醒时间', tone: 'default' },
  { key: 'delete', label: '删除药品', tone: 'danger' },
]
