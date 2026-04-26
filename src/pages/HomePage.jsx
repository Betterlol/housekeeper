import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import HeroSection from '../features/home/HeroSection'
import TimelineSection from '../features/home/TimelineSection'
import JourneySection from '../features/home/JourneySection'
// import AiAssistantSection from '../features/home/AiAssistantSection'
import HealthMetricsSection from '../features/home/HealthMetricsSection'
import ReminderCenterSection from '../features/home/ReminderCenterSection'
import OnboardingEntryCard from '../features/home/OnboardingEntryCard'
import OnboardingGuideModal from '../features/home/OnboardingGuideModal'
import { onboardingSteps } from '../features/home/constants'
import {
  getTimelineState,
  mapAdherenceToBars,
  mapNumberToBars,
  parsePressureValue,
  parseSugarValue,
  toMinutes,
} from '../features/home/helpers'

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

  return (
    <>
      <section className="relative space-y-5 pb-3">
        <div className="home-page-bg pointer-events-none absolute inset-x-0 -top-4 -z-10 h-[calc(100%+2rem)] rounded-[32px]" />

        <HeroSection
          userName={userName}
          greeting={getGreeting()}
          statusCount={statusCount}
          nextReminder={nextReminder}
          nextReminderMinutes={nextReminderMinutes}
          aiSuggestion={aiSuggestion}
        />

        {demoMode !== 'defense' && !onboardingProgress.onboardingDismissed ? (
          <OnboardingEntryCard
            onboardingProgress={onboardingProgress}
            activeOnboardingStep={activeOnboardingStep}
            onboardingSteps={onboardingSteps}
            activeStepData={activeStepData}
            onOpen={openGuide}
          />
        ) : null}

        <TimelineSection
          timelineItems={timelineItems}
          statusCount={statusCount}
          onTake={markReminderTaken}
          onSkip={skipReminder}
        />

        <JourneySection journeySteps={journeySteps} refill={refill} />
        {/* <AiAssistantSection aiSuggestion={aiSuggestion} adherenceData={adherenceData} trendData={trendData} /> */}
        <HealthMetricsSection metricsCards={metricsCards} />
        <ReminderCenterSection statusCount={statusCount} nextReminder={nextReminder} />
      </section>

      <OnboardingGuideModal
        open={guideOpen}
        activeOnboardingStep={activeOnboardingStep}
        onboardingSteps={onboardingSteps}
        onboardingProgress={onboardingProgress}
        activeStepData={activeStepData}
        onSetStep={setCurrentOnboardingStep}
        onGoComplete={handleGoComplete}
        onNextStep={handleNextStep}
        onCloseTemporarily={closeGuideTemporarily}
        onNeverShow={handleNeverShow}
      />
    </>
  )
}
