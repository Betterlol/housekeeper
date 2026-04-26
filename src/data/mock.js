export const mockStore = {
  schemaVersion: 2,
  medications: [],
  reminderRules: [],
  reminderInstances: [],
  intakeLogs: [],
  reminderQueue: [],
  experienceState: {
    onboardingDismissed: false,
    onboardingCompleted: false,
    currentOnboardingStep: 0,
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
