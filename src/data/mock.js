const today = new Date()
const todayKey = today.toISOString().slice(0, 10)

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const soon = new Date(today.getTime() + 10 * 60 * 1000)
const later = new Date(today.getTime() + 50 * 60 * 1000)
const doneAt = new Date(today.getTime() - 90 * 60 * 1000)

const timeSoon = formatTime(soon)
const timeLater = formatTime(later)
const timeDone = formatTime(doneAt)

export const mockStore = {
  schemaVersion: 2,
  medications: [
    {
      id: 'med-1',
      drugName: '缬沙坦片',
      spec: '80mg*14片',
      dose: 1,
      unit: '片',
      withMeal: '饭后',
      stockQty: 20,
      stockUnit: '片',
      startDate: todayKey,
      endDate: '',
      sourceLabel: '处方导入',
    },
    {
      id: 'med-2',
      drugName: '盐酸二甲双胍片',
      spec: '500mg*60片',
      dose: 1,
      unit: '片',
      withMeal: '饭中',
      stockQty: 45,
      stockUnit: '片',
      startDate: todayKey,
      endDate: '',
      sourceLabel: '处方导入',
    },
    {
      id: 'med-3',
      drugName: '阿托伐他汀钙片',
      spec: '20mg*7片',
      dose: 1,
      unit: '片',
      withMeal: '睡前',
      stockQty: 12,
      stockUnit: '片',
      startDate: todayKey,
      endDate: '',
      sourceLabel: '手动录入',
    },
  ],
  reminderRules: [
    {
      id: 'rule-1',
      medicationId: 'med-1',
      time: timeDone,
      enabled: true,
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      retryIntervalMinutes: 5,
      maxRetryCount: 3,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: 'rule-2',
      medicationId: 'med-2',
      time: timeSoon,
      enabled: true,
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      retryIntervalMinutes: 5,
      maxRetryCount: 3,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: 'rule-3',
      medicationId: 'med-3',
      time: timeLater,
      enabled: true,
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      retryIntervalMinutes: 10,
      maxRetryCount: 3,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
  ],
  reminderInstances: [
    {
      id: 'ins-1',
      ruleId: 'rule-1',
      medicationId: 'med-1',
      scheduledAt: `${todayKey}T${timeDone}`,
      currentTriggerAt: `${todayKey}T${timeDone}`,
      retryCount: 0,
      internalStatus: 'completed',
      visibleStatus: 'taken',
      lastNotifiedAt: '',
      completedAt: doneAt.toISOString(),
    },
    {
      id: 'ins-2',
      ruleId: 'rule-2',
      medicationId: 'med-2',
      scheduledAt: `${todayKey}T${timeSoon}`,
      currentTriggerAt: soon.toISOString(),
      retryCount: 0,
      internalStatus: 'waiting',
      visibleStatus: 'pending',
      lastNotifiedAt: '',
      completedAt: '',
    },
    {
      id: 'ins-3',
      ruleId: 'rule-3',
      medicationId: 'med-3',
      scheduledAt: `${todayKey}T${timeLater}`,
      currentTriggerAt: later.toISOString(),
      retryCount: 0,
      internalStatus: 'waiting',
      visibleStatus: 'pending',
      lastNotifiedAt: '',
      completedAt: '',
    },
  ],
  intakeLogs: [
    {
      id: 'log-1',
      medicationId: 'med-1',
      medId: 'med-1',
      reminderInstanceId: 'ins-1',
      scheduledAt: `${todayKey}T${timeDone}`,
      takenAt: doneAt.toISOString(),
      status: 'taken',
      reason: '',
    },
  ],
  reminderQueue: [],
  experienceState: {
    consultViewed: false,
    purchaseViewed: false,
  },
  userProfile: {
    name: '张先生',
    age: 58,
    gender: '男',
    diseases: ['高血压', '2型糖尿病'],
    diagnosisDate: '2018-03-12',
    note: '请持续监测血压血糖并规律复诊。',
  },
  adverseEvents: [],
  demoMeta: {
    mode: 'default',
    generatedAt: '',
    label: '基础数据',
  },
}
