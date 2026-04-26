export const onboardingSteps = [
  {
    key: 'profile',
    title: '导入档案',
    description: '前往“我的”页面点击“导入报告”，完善慢病档案与关键健康指标。',
    route: '/profile',
  },
  {
    key: 'import',
    title: '导入处方',
    description: '前往用药计划，点击“导入处方”，体验 AI 自动识别药品与剂量。',
    route: '/plan',
  },
  {
    key: 'reminder',
    title: '生成提醒',
    description: '导入处方时选择“同时生成提醒规则”，或去提醒页新增规则。',
    route: '/reminders',
  },
  {
    key: 'intake',
    title: '完成一次服药',
    description: '回到首页或提醒页，完成一次服药打卡，体验真实提醒流程。',
    route: '/home',
  },
  {
    key: 'consult',
    title: '查看AI复诊摘要',
    description: '打开 AI 复诊页，生成医生可读的复诊报告。',
    route: '/consult',
  },
  {
    key: 'purchase',
    title: '查看购药建议',
    description: '打开购药页，体验库存分析、重复购药风险与智能补货。',
    route: '/purchase',
  },
]

export const visibleStatusLabel = {
  off: '关闭',
  pending: '待服药',
  taken: '已服药',
  skipped: '已跳过',
  missed: '已漏服',
}

export const timelineStatusLabel = {
  done: '已完成',
  current: '进行中',
  upcoming: '待提醒',
  missed: '已漏服',
  skipped: '已跳过',
  off: '已关闭',
}
