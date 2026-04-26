import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MedicalIcon from '../components/MedicalIcon'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  calculateSevenDayAdherence,
  getAiSuggestion,
  getGreeting,
  getMockHealthMetrics,
  getSevenDayTrendData,
  getUpcomingRefill,
} from '../utils/insights'
import {
  getOnboardingProgress,
  getTodayDateKey,
  getTodayReminderItemsFromStore,
  markReminderTaken,
  setCurrentOnboardingStep,
  setOnboardingDismissed,
  skipReminder,
  syncOnboardingProgress,
} from '../utils/storage'

const onboardingSteps = [
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

const visibleStatusLabel = {
  off: '关闭',
  pending: '待服药',
  taken: '已服药',
  skipped: '已跳过',
  missed: '已漏服',
}

const timelineStatusLabel = {
  done: '已完成',
  current: '进行中',
  upcoming: '待提醒',
  missed: '已漏服',
  skipped: '已跳过',
  off: '已关闭',
}

function formatTime(iso) {
  if (!iso) return '--:--'
  return iso.slice(11, 16)
}

function formatDistance(targetIso) {
  if (!targetIso) return '暂无'
  const diffMs = new Date(targetIso).getTime() - Date.now()
  if (diffMs <= 0) return '即将触发'
  return `${Math.ceil(diffMs / 60000)} 分钟后`
}

function formatTodayLabel() {
  const now = new Date()
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekday}`
}

function toMinutes(targetIso) {
  if (!targetIso) return 0
  const diffMs = new Date(targetIso).getTime() - Date.now()
  return Math.max(Math.ceil(diffMs / 60000), 0)
}

function getTimelineState(item, nextPendingId) {
  if (item.visibleStatus === 'taken') return 'done'
  if (item.visibleStatus === 'missed') return 'missed'
  if (item.visibleStatus === 'skipped') return 'skipped'
  if (item.visibleStatus === 'off') return 'off'
  if (item.id === nextPendingId) return 'current'
  return 'upcoming'
}

function parsePressureValue(value) {
  const numbers = `${value || ''}`.match(/\d+/g) || []
  return Number(numbers[0] || 120)
}

function parseSugarValue(value) {
  const match = `${value || ''}`.match(/\d+(\.\d+)?/)
  return Number(match?.[0] || 6.0)
}

function mapNumberToBars(value, min, max) {
  const normalized = Math.max(0, Math.min(1, (value - min) / Math.max(max - min, 1)))
  return Array.from({ length: 7 }).map((_, index) => {
    const threshold = (index + 1) / 7
    if (normalized >= threshold) return 90 - index * 6
    return 38 + index * 4
  })
}

function mapAdherenceToBars(adherence, trendData) {
  if (trendData.length === 7) {
    return trendData.map((day) => 32 + Math.round((day.adherence / 100) * 60))
  }
  return mapNumberToBars(adherence, 0, 100)
}

export default function HomePage() {
  const navigate = useNavigate()
  const store = useStoreSnapshot({ ensureToday: true })

  const [guideOpen, setGuideOpen] = useState(false)
  const [guideSkippedInSession, setGuideSkippedInSession] = useState(false)
  const previousCompletedRef = useRef(null)

  const todayReminders = getTodayReminderItemsFromStore(store, getTodayDateKey())
  const onboardingProgress = useMemo(() => getOnboardingProgress(store), [store])

  const userName = store.userProfile?.name || '张先生'
  const pendingItems = todayReminders.filter((item) => item.visibleStatus === 'pending')
  const statusCount = {
    off: todayReminders.filter((item) => item.visibleStatus === 'off').length,
    pending: todayReminders.filter((item) => item.visibleStatus === 'pending').length,
    taken: todayReminders.filter((item) => item.visibleStatus === 'taken').length,
    skipped: todayReminders.filter((item) => item.visibleStatus === 'skipped').length,
    missed: todayReminders.filter((item) => item.visibleStatus === 'missed').length,
  }

  const nextReminder = [...pendingItems].sort((a, b) => (a.dueAt > b.dueAt ? 1 : -1))[0]
  const nextPendingId = nextReminder?.id || ''
  const nextReminderMinutes = toMinutes(nextReminder?.dueAt || '')
  const adherenceData = calculateSevenDayAdherence(store)
  const trendData = getSevenDayTrendData(store)
  const metrics = getMockHealthMetrics(adherenceData.adherence)
  const aiSuggestion = getAiSuggestion(store)
  const refill = getUpcomingRefill(store)
  const demoMode = store.demoMeta?.mode || 'default'

  const timelineItems = useMemo(
    () => todayReminders
      .map((item) => ({
        ...item,
        timelineState: getTimelineState(item, nextPendingId),
      }))
      .sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1)),
    [todayReminders, nextPendingId]
  )

  const isEmptyStart = (store.medications || []).length === 0 && (store.reminderRules || []).length === 0
  const shouldAutoShowOnboarding = isEmptyStart
    && demoMode !== 'defense'
    && !onboardingProgress.onboardingDismissed
    && !onboardingProgress.onboardingCompleted

  const activeOnboardingStep = Math.min(
    Math.max(onboardingProgress.currentStepIndex, onboardingProgress.recommendedStepIndex),
    onboardingSteps.length - 1
  )
  const activeStepData = onboardingSteps[activeOnboardingStep]

  useEffect(() => {
    syncOnboardingProgress()
  }, [
    store.medications,
    store.reminderRules,
    store.intakeLogs,
    store.reminderInstances,
    store.userProfile?.bloodPressure,
    store.userProfile?.bloodSugar,
    store.userProfile?.doctorAdvice,
    store.userProfile?.nextVisitDate,
    store.experienceState?.consultViewed,
    store.experienceState?.purchaseViewed,
  ])

  useEffect(() => {
    if (shouldAutoShowOnboarding && !guideSkippedInSession) {
      setGuideOpen(true)
    }
  }, [shouldAutoShowOnboarding, guideSkippedInSession])

  useEffect(() => {
    const previousCompleted = previousCompletedRef.current
    const currentCompleted = onboardingProgress.completedCount

    if (previousCompleted === null) {
      previousCompletedRef.current = currentCompleted
      return
    }

    if (
      currentCompleted > previousCompleted
      && !onboardingProgress.onboardingDismissed
      && demoMode !== 'defense'
    ) {
      setGuideOpen(true)
      setGuideSkippedInSession(false)
    }

    previousCompletedRef.current = currentCompleted
  }, [
    onboardingProgress.completedCount,
    onboardingProgress.onboardingDismissed,
    demoMode,
  ])

  const journeySteps = [
    {
      title: '问诊',
      icon: 'consult',
      status: onboardingProgress.stepCompleted[4] ? '已完成' : '待体验',
      detail: onboardingProgress.stepCompleted[4] ? '复诊资料已生成' : '请完成 AI 复诊查看',
      done: onboardingProgress.stepCompleted[4],
    },
    {
      title: '购药',
      icon: 'purchase',
      status: onboardingProgress.stepCompleted[5] ? '已完成' : '待体验',
      detail: onboardingProgress.stepCompleted[5] ? '补货风险已检查' : '请完成购药建议查看',
      done: onboardingProgress.stepCompleted[5],
    },
    {
      title: '用药',
      icon: 'adherence',
      status: statusCount.pending > 0 ? '进行中' : '已完成',
      detail: statusCount.pending > 0 ? `今日待服药 ${statusCount.pending} 项` : '今日服药处理完成',
      done: statusCount.pending === 0,
    },
    {
      title: '续方',
      icon: 'clock',
      status: refill ? '已提醒' : '稳定',
      detail: refill ? `${refill.drugName} ${refill.daysLeft} 天后用完` : '暂无续方风险',
      done: Boolean(refill),
    },
  ]

  const openGuide = () => {
    setGuideOpen(true)
    setGuideSkippedInSession(false)
  }

  const closeGuideTemporarily = () => {
    setGuideOpen(false)
    setGuideSkippedInSession(true)
  }

  const handleNeverShow = () => {
    setOnboardingDismissed(true)
    setGuideOpen(false)
    setGuideSkippedInSession(true)
  }

  const handleGoComplete = () => {
    if (!activeStepData) return
    if (onboardingProgress.onboardingCompleted) {
      setGuideOpen(false)
      return
    }
    if (activeStepData.key === 'intake') {
      setGuideOpen(false)
      const section = document.getElementById('today-reminder-tasks')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }
    setGuideOpen(false)
    navigate(activeStepData.route)
  }

  const handleNextStep = () => {
    if (onboardingProgress.onboardingCompleted) {
      setGuideOpen(false)
      return
    }
    const nextStep = Math.min(activeOnboardingStep + 1, onboardingSteps.length - 1)
    setCurrentOnboardingStep(nextStep)
  }

  const metricsCards = [
    {
      key: 'pressure',
      icon: 'pressure',
      label: '血压',
      value: metrics.bloodPressure,
      tone: 'rose',
      bars: mapNumberToBars(parsePressureValue(metrics.bloodPressure), 90, 160),
      trend: `${parsePressureValue(metrics.bloodPressure) - 118 >= 0 ? '+' : ''}${parsePressureValue(metrics.bloodPressure) - 118}`,
    },
    {
      key: 'sugar',
      icon: 'sugar',
      label: '血糖',
      value: metrics.bloodSugar,
      tone: 'sky',
      bars: mapNumberToBars(parseSugarValue(metrics.bloodSugar), 4.5, 9.5),
      trend: `${(parseSugarValue(metrics.bloodSugar) - 6.0).toFixed(1)}`,
    },
    {
      key: 'adherence',
      icon: 'adherence',
      label: '依从率',
      value: metrics.adherence,
      tone: 'emerald',
      bars: mapAdherenceToBars(adherenceData.adherence, trendData),
      trend: `${adherenceData.adherence}%`,
    },
  ]

  return (
    <>
      <section className="space-y-5 pb-3">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-medical-600 via-medical-700 to-cyan-700 px-5 pb-6 pt-6 text-white shadow-[0_24px_48px_-20px_rgba(15,118,110,0.85)]">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-cyan-200/20 blur-2xl" />
          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold ring-2 ring-white/35">
                  {userName.slice(0, 1)}
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/70">{getGreeting()}</p>
                  <p className="text-lg font-semibold">{userName}</p>
                </div>
              </div>

              <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <MedicalIcon name="reminder" className="h-5 w-5" />
                {statusCount.pending > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400" /> : null}
              </button>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <MedicalIcon name="ai" className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-white/90">今日健康驾驶舱</span>
                </div>
                <span className="text-[11px] text-white/65">{formatTodayLabel()}</span>
              </div>

              <div className="home-breathing-glow mb-4 grid grid-cols-3 gap-2.5">
                <HeroMetric value={`${statusCount.pending}`} label="待服药" tone="amber" pulse={statusCount.pending > 0} />
                <HeroMetric value={`${statusCount.taken}`} label="已完成" tone="emerald" />
                <HeroMetric value={`${statusCount.missed}`} label="已漏服" tone="slate" />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                    <MedicalIcon name="clock" className="h-6 w-6" />
                  </div>
                  {statusCount.pending > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-medical-700">
                      !
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/65">下次服药</p>
                  <p className="truncate text-sm font-semibold">{nextReminder?.medication?.drugName || '暂无待服药任务'}</p>
                  <p className="truncate text-xs text-white/70">
                    {nextReminder
                      ? `${nextReminder.medication?.dose || '--'}${nextReminder.medication?.unit || ''} · ${nextReminder.medication?.withMeal || '按医嘱'}`
                      : '请先创建提醒规则'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{nextReminder ? nextReminderMinutes : '--'}</p>
                  <p className="text-xs text-white/65">{nextReminder ? '分钟后' : '暂无'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <MedicalIcon name="alert" className="h-4 w-4" />
              </span>
              <p className="line-clamp-2 flex-1 text-sm">{aiSuggestion}</p>
              <span className="text-lg text-white/70">›</span>
            </div>
          </div>
        </section>

        {demoMode !== 'defense' && !onboardingProgress.onboardingDismissed ? (
          <button
            type="button"
            onClick={openGuide}
            className="w-full rounded-2xl border border-medical-100 bg-white px-4 py-3 text-left shadow-card"
          >
            <p className="text-xs font-semibold text-medical-700">首次使用引导</p>
            <p className="mt-1 text-xs text-slate-500">
              {onboardingProgress.onboardingCompleted
                ? '已完成全部引导，点击可查看完成提示'
                : `当前进度 ${Math.min(activeOnboardingStep + 1, onboardingSteps.length)}/${onboardingSteps.length} · 推荐：${activeStepData?.title || '完成引导'}`}
            </p>
          </button>
        ) : null}

        <section id="today-reminder-tasks" className="rounded-3xl bg-white px-4 py-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">今日用药时间流</h2>
              <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] font-medium text-medical-700">
                {statusCount.taken}/{timelineItems.length || 0} 已完成
              </span>
            </div>
            <span className="text-xs text-slate-400">按时间排序</span>
          </div>

          {timelineItems.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              今日暂无提醒任务，请先前往“提醒”页面创建闹钟规则。
            </article>
          ) : (
            <div className="relative">
              <div className="absolute bottom-3 left-[22px] top-6 w-0.5 bg-gradient-to-b from-emerald-300 via-medical-300 to-slate-200" />
              <div className="space-y-1">
              {timelineItems.map((item) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  onTake={() => markReminderTaken(item.id)}
                  onSkip={() => skipReminder(item.id)}
                />
              ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white px-4 py-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">就医流程追踪</h2>
              <p className="mt-0.5 text-xs text-slate-500">问诊 → 购药 → 用药 → 续方</p>
            </div>
            <span className="text-sm font-medium text-medical-600">{journeySteps.filter((item) => item.done).length}/4</span>
          </div>

          <div className="relative mb-4 grid grid-cols-4 gap-2">
            <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-100" />
            <div
              className="absolute left-6 top-5 h-0.5 bg-gradient-to-r from-medical-400 to-cyan-500 transition-all duration-500"
              style={{ width: `${Math.max(0, (journeySteps.filter((item) => item.done).length - 1) * 31)}%` }}
            />
            {journeySteps.map((step) => (
              <div key={step.title} className="relative z-10 text-center">
                <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${
                  step.done ? 'bg-medical-600 text-white shadow-md shadow-medical-300/50' : 'bg-slate-100 text-slate-400'
                }`}>
                  <MedicalIcon name={step.icon} className="h-5 w-5" />
                </div>
                <p className={`mt-2 text-xs font-medium ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</p>
                <p className="text-[11px] text-slate-400">{step.status}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-medical-100 bg-gradient-to-r from-medical-50 to-cyan-50 p-3">
            <p className="text-sm font-medium text-medical-700">
              当前阶段：{journeySteps[2].detail}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {refill ? `${refill.drugName} 预计 ${refill.daysLeft} 天后库存不足。` : '当前库存风险可控，建议持续按时打卡。'}
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-5 text-white shadow-[0_20px_44px_-24px_rgba(15,23,42,0.95)]">
          <div className="home-shimmer absolute inset-0 opacity-15" />
          <div className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -bottom-8 -left-6 h-28 w-28 rounded-full bg-cyan-500/30 blur-2xl" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/80">
                  <MedicalIcon name="ai" className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold">AI 健康助理</h2>
              </div>
              <span className="rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-300">分析中</span>
            </div>

            <p className="mb-3 text-sm leading-6 text-white/90">{aiSuggestion}</p>

            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-1 text-amber-300">依从率风险</span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 py-1 text-cyan-300">作息建议</span>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/20 px-2 py-1 text-violet-300">AI 生成</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-white/60">本周依从率趋势</span>
                <span className="text-xs text-cyan-300">{adherenceData.adherence}%</span>
              </div>
              <div className="flex h-12 items-end gap-1">
                {(trendData.length === 7 ? trendData : Array.from({ length: 7 }).map(() => ({ adherence: adherenceData.adherence }))).map((day, index) => (
                  <span
                    key={`${day.dateKey || index}`}
                    className={`flex-1 rounded-sm ${index === 6 ? 'bg-gradient-to-t from-cyan-500 to-cyan-300' : 'bg-white/20'}`}
                    style={{ height: `${30 + Math.round((day.adherence / 100) * 60)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white px-4 py-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">健康指标</h2>
            <span className="text-sm font-medium text-medical-600">自动评估</span>
          </div>

          <div className="space-y-3">
            {metricsCards.map((item) => (
              <MetricCard key={item.key} metric={item} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white px-4 py-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">提醒中心</h2>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] text-amber-700">
                {statusCount.pending > 0 ? '进行中' : '稳定'}
              </span>
            </div>
            <Link to="/reminders" className="text-sm font-medium text-slate-500">管理规则</Link>
          </div>

          <div className="mb-3 rounded-2xl bg-gradient-to-br from-medical-600 to-cyan-600 p-4 text-white shadow-[0_16px_32px_-18px_rgba(13,148,136,0.85)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">今日提醒</span>
              <span className="rounded-full bg-white/20 px-2 py-1 text-[11px]">实时</span>
            </div>
            <p className="text-xs text-white/80">
              {statusCount.pending} 项待提醒 · {statusCount.taken} 项已完成 · {statusCount.skipped} 项已跳过
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/10 p-2">
                <p className="text-white/70">下次提醒</p>
                <p className="font-semibold">{nextReminder ? formatTime(nextReminder.dueAt) : '--:--'}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-2">
                <p className="text-white/70">待服药</p>
                <p className="font-semibold">{statusCount.pending}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-2">
                <p className="text-white/70">漏服</p>
                <p className="font-semibold">{statusCount.missed}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link to="/reminders" className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-900">提醒中心</p>
              <p className="mt-1 text-xs text-slate-500">管理全部提醒规则</p>
            </Link>
            <Link to="/consult" className="rounded-xl border border-violet-100 bg-violet-50 p-3">
              <p className="text-sm font-medium text-violet-900">AI 复诊摘要</p>
              <p className="mt-1 text-xs text-violet-500">查看医生可读报告</p>
            </Link>
          </div>
        </section>
      </section>

      {guideOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-sm">
          <article className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">首次使用引导</p>
              <span className="rounded-full bg-medical-100 px-2 py-1 text-xs font-medium text-medical-700">
                {activeOnboardingStep + 1}/{onboardingSteps.length}
              </span>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-medical-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${((activeOnboardingStep + 1) / onboardingSteps.length) * 100}%` }}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-medical-100 bg-cyan-50/50 p-3">
              {onboardingProgress.onboardingCompleted ? (
                <>
                  <p className="text-sm font-semibold text-emerald-700">恭喜！你已完成新手引导！</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    AI健康管理已启用，你可以继续使用提醒、AI复诊与购药建议完成日常慢病管理。
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-900">{activeStepData?.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{activeStepData?.description}</p>
                </>
              )}
            </div>

            <div className="mt-3 grid grid-cols-6 gap-1">
              {onboardingSteps.map((item, index) => {
                const isCurrent = index === activeOnboardingStep
                const isDone = onboardingProgress.stepCompleted[index]
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCurrentOnboardingStep(index)}
                    className={`rounded-lg px-1 py-1.5 text-[11px] ${
                      isCurrent
                        ? 'bg-medical-600 text-white'
                        : isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isDone ? '已完成' : `${index + 1}`}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleGoComplete}
                className="rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
              >
                {onboardingProgress.onboardingCompleted ? '开始使用' : '去完成'}
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
              >
                {onboardingProgress.onboardingCompleted ? '关闭' : '下一步'}
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeGuideTemporarily}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600"
              >
                跳过引导
              </button>
              <button
                type="button"
                onClick={handleNeverShow}
                className="rounded-xl border border-rose-200 px-3 py-2 text-xs text-rose-600"
              >
                不再提示
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </>
  )
}

function HeroMetric({ value, label, tone, pulse = false }) {
  const toneClassMap = {
    amber: 'from-amber-400 to-orange-500 shadow-amber-500/35',
    emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-500/35',
    slate: 'from-white/35 to-white/20 shadow-slate-500/20',
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br p-3 text-center shadow-lg ${toneClassMap[tone]} ${pulse ? 'animate-pulse' : ''}`}>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium text-white/90">{label}</p>
    </div>
  )
}

function TimelineItem({ item, onTake, onSkip }) {
  const isCurrent = item.timelineState === 'current'
  const isDone = item.timelineState === 'done'
  const isMissed = item.timelineState === 'missed'
  const isSkipped = item.timelineState === 'skipped'
  const isOff = item.timelineState === 'off'
  const isPending = item.timelineState === 'upcoming' || item.timelineState === 'current'
  const dueMinutes = toMinutes(item.dueAt || item.scheduledAt || '')

  return (
    <article className="relative flex gap-3 py-1">
      <div className="w-[44px] shrink-0">
        <p className={`mb-2 text-center text-[11px] font-medium ${
          isCurrent
            ? 'text-medical-600'
            : isDone
              ? 'text-emerald-500'
              : isMissed
                ? 'text-rose-500'
                : 'text-slate-400'
        }`}>
          {formatTime(item.scheduledAt)}
        </p>

        <div className="relative mx-auto h-5 w-5">
          {isCurrent ? (
            <>
              <span className="absolute inset-0 rounded-full bg-medical-400/35 animate-ping" />
              <span className="absolute inset-[3px] rounded-full bg-medical-300/40" />
            </>
          ) : null}

          <span
            className={`relative z-10 block h-5 w-5 rounded-full border-2 ${
              isCurrent
                ? 'border-medical-500 bg-medical-500'
                : isDone
                  ? 'border-emerald-500 bg-emerald-500'
                  : isMissed
                    ? 'border-rose-500 bg-rose-500'
                    : isSkipped
                      ? 'border-slate-400 bg-slate-400'
                      : isOff
                        ? 'border-slate-300 bg-slate-200'
                        : 'border-cyan-300 bg-white'
            }`}
          />
        </div>
      </div>

      <div className={`flex-1 rounded-2xl border p-3 transition ${
        isCurrent
          ? 'border-medical-200 bg-gradient-to-r from-medical-50 via-white to-cyan-50 shadow-[0_16px_32px_-24px_rgba(13,148,136,0.8)]'
          : isDone
            ? 'border-emerald-100 bg-emerald-50/40'
            : isMissed
              ? 'border-rose-100 bg-rose-50/60'
              : isSkipped
                ? 'border-slate-100 bg-slate-50'
                : isOff
                  ? 'border-slate-200 bg-slate-50/70'
                  : 'border-slate-100 bg-white'
      }`}>
        {isCurrent ? (
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            {dueMinutes} 分钟后到时
          </div>
        ) : null}

        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-semibold ${isCurrent ? 'text-slate-900' : 'text-slate-800'}`}>
              {item.medication?.drugName || '药品提醒'}
            </p>
            <p className="text-xs text-slate-500">
              {item.medication?.dose || '--'}{item.medication?.unit || ''} · {item.medication?.withMeal || '按医嘱'}
            </p>
          </div>
          <div className="text-right">
            <span className={`rounded-full px-2 py-1 text-[11px] ${
              isCurrent
              ? 'bg-medical-100 text-medical-700'
              : isDone
                ? 'bg-emerald-100 text-emerald-700'
                : isMissed
                  ? 'bg-rose-100 text-rose-700'
                  : isSkipped
                    ? 'bg-slate-200 text-slate-700'
                    : isOff
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-cyan-100 text-cyan-700'
          }`}>
            {timelineStatusLabel[item.timelineState]}
          </span>
          {isPending ? (
            <p className="mt-1 text-[11px] text-slate-500">
              {item.id && item.dueAt ? `下次：${formatDistance(item.dueAt)}` : ''}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">{visibleStatusLabel[item.visibleStatus]}</p>
          )}
          </div>
        </div>

        {isDone ? (
          <p className="mb-2 text-[11px] text-emerald-600">本次用药已完成</p>
        ) : null}
        {isMissed ? (
          <p className="mb-2 text-[11px] text-rose-600">本次提醒未处理，已标记漏服</p>
        ) : null}

        {isPending ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTake}
              className={`rounded-xl px-3 py-2 text-xs font-medium text-white ${
                isCurrent ? 'bg-gradient-to-r from-medical-600 to-cyan-600' : 'bg-medical-600'
              }`}
            >
              立即服药
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
            >
              标记跳过
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

function MetricCard({ metric }) {
  const toneMap = {
    rose: {
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
      trendText: 'text-rose-500',
      barColor: 'from-rose-300 to-rose-500',
    },
    sky: {
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-50',
      trendText: 'text-sky-500',
      barColor: 'from-sky-300 to-sky-500',
    },
    emerald: {
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      trendText: 'text-emerald-600',
      barColor: 'from-emerald-300 to-emerald-500',
    },
  }

  const tone = toneMap[metric.tone]

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.iconBg}`}>
          <MedicalIcon name={metric.icon} className={`h-5 w-5 ${tone.iconColor}`} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <span className={`text-xs font-medium ${tone.trendText}`}>{metric.trend}</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{metric.value}</p>
          <div className="mt-2 flex h-8 items-end gap-1">
            {metric.bars.map((barHeight, index) => (
              <span
                key={`${metric.key}-bar-${index}`}
                className={`flex-1 rounded-sm bg-gradient-to-t ${tone.barColor}`}
                style={{ height: `${Math.max(12, Math.min(100, barHeight))}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
