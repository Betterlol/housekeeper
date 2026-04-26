import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MedicalIcon from '../components/MedicalIcon'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  calculateSevenDayAdherence,
  getAiSuggestion,
  getGreeting,
  getMockHealthMetrics,
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

const statusStyle = {
  off: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  taken: 'bg-emerald-100 text-emerald-700',
  skipped: 'bg-slate-200 text-slate-700',
  missed: 'bg-rose-100 text-rose-700',
}

const statusLabel = {
  off: '关闭',
  pending: '待服药',
  taken: '已服药',
  skipped: '已跳过',
  missed: '已漏服',
}

const onboardingSteps = [
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

export default function HomePage() {
  const navigate = useNavigate()
  const store = useStoreSnapshot({ ensureToday: true })

  const [guideOpen, setGuideOpen] = useState(false)
  const [guideSkippedInSession, setGuideSkippedInSession] = useState(false)

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
  const adherenceData = calculateSevenDayAdherence(store)
  const metrics = getMockHealthMetrics(adherenceData.adherence)
  const aiSuggestion = getAiSuggestion(store)
  const refill = getUpcomingRefill(store)
  const demoMode = store.demoMeta?.mode || 'default'

  const isEmptyStart = (store.medications || []).length === 0 && (store.reminderRules || []).length === 0
  const shouldAutoShowOnboarding = isEmptyStart
    && demoMode !== 'defense'
    && !onboardingProgress.onboardingDismissed
    && !onboardingProgress.onboardingCompleted

  const activeOnboardingStep = Math.min(
    Math.max(
      onboardingProgress.currentStepIndex,
      onboardingProgress.recommendedStepIndex
    ),
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
    store.experienceState?.consultViewed,
    store.experienceState?.purchaseViewed,
  ])

  useEffect(() => {
    if (shouldAutoShowOnboarding && !guideSkippedInSession) {
      setGuideOpen(true)
    }
  }, [shouldAutoShowOnboarding, guideSkippedInSession])

  const loopSteps = [
    {
      title: '问诊',
      icon: 'consult',
      status: '问诊资料已生成',
      tone: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      title: '购药',
      icon: 'purchase',
      status: '购药风险已检查',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: '用药',
      icon: 'adherence',
      status: pendingItems.length > 0 ? `今日用药待完成（${pendingItems.length}项）` : '今日用药全部完成',
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      title: '续方',
      icon: 'clock',
      status: refill ? '续方提醒已开启' : '暂无续方风险',
      tone: 'bg-purple-50 text-violet-700 border-violet-100',
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

    if (activeStepData.key === 'intake') {
      setGuideOpen(false)
      const section = document.getElementById('today-reminder-tasks')
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
      return
    }

    setGuideOpen(false)
    navigate(activeStepData.route)
  }

  const handleNextStep = () => {
    const nextStep = Math.min(activeOnboardingStep + 1, onboardingSteps.length - 1)
    setCurrentOnboardingStep(nextStep)
  }

  return (
    <>
      <section className="space-y-4">
        <article className="rounded-3xl bg-gradient-to-br from-medical-700 via-medical-600 to-cyan-600 p-5 text-white shadow-[0_20px_40px_-18px_rgba(15,118,110,0.85)]">
          <p className="text-sm text-cyan-50">{getGreeting()}，{userName}</p>
          <h1 className="mt-1 text-2xl font-semibold">慢病用药小管家</h1>
          <p className="mt-2 text-sm text-cyan-50">
            {pendingItems.length > 0 ? `今天需要完成 ${pendingItems.length} 次服药` : '今日提醒任务已全部完成'}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/15 p-2 text-center">
              <p className="text-[11px] text-cyan-100">待服药</p>
              <p className="mt-1 text-lg font-semibold">{statusCount.pending}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-2 text-center">
              <p className="text-[11px] text-cyan-100">已服药</p>
              <p className="mt-1 text-lg font-semibold">{statusCount.taken}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-2 text-center">
              <p className="text-[11px] text-cyan-100">已漏服</p>
              <p className="mt-1 text-lg font-semibold">{statusCount.missed}</p>
            </div>
          </div>
        </article>

        {demoMode !== 'defense' && !onboardingProgress.onboardingCompleted ? (
          <button
            type="button"
            onClick={openGuide}
            className="w-full rounded-xl border border-medical-100 bg-white px-3 py-2 text-left shadow-card"
          >
            <p className="text-xs font-semibold text-medical-700">首次使用引导</p>
            <p className="mt-1 text-xs text-slate-500">
              当前进度 {Math.min(activeOnboardingStep + 1, onboardingSteps.length)}/{onboardingSteps.length} · 推荐：{activeStepData?.title || '完成引导'}
            </p>
          </button>
        ) : null}

        <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.8)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">闭环流程追踪</p>
            <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] text-medical-700">问诊-购药-用药-续方</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {loopSteps.map((step, index) => (
              <div key={step.title} className={`rounded-xl border p-3 ${step.tone}`}>
                <div className="mb-1 flex items-center gap-1 text-xs font-semibold">
                  <MedicalIcon name={step.icon} className="h-4 w-4" />
                  <span>0{index + 1} {step.title}</span>
                </div>
                <p className="text-[11px] leading-5">{step.status}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.8)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">今日提醒状态</p>
            <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] text-medical-700">可理解状态</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {['off', 'pending', 'taken', 'skipped', 'missed'].map((status) => (
              <div key={status} className="rounded-xl bg-slate-50 p-2">
                <p className="text-[11px] text-slate-500">{statusLabel[status]}</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{statusCount[status]}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            下次提醒：{nextReminder ? `${formatTime(nextReminder.dueAt)}（${formatDistance(nextReminder.dueAt)}）` : '暂无'}
          </p>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.8)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">今日健康状态</p>
            <span className="rounded-full bg-medical-50 px-2 py-1 text-[11px] text-medical-700">自动评估</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-gradient-to-b from-red-50 to-white p-2">
              <div className="flex items-center gap-1 text-rose-500">
                <MedicalIcon name="pressure" className="h-4 w-4" />
                <span className="text-[11px]">血压</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">{metrics.bloodPressure}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-cyan-50 to-white p-2">
              <div className="flex items-center gap-1 text-cyan-600">
                <MedicalIcon name="sugar" className="h-4 w-4" />
                <span className="text-[11px]">血糖</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">{metrics.bloodSugar}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-emerald-50 to-white p-2">
              <div className="flex items-center gap-1 text-emerald-600">
                <MedicalIcon name="adherence" className="h-4 w-4" />
                <span className="text-[11px]">依从率</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">{metrics.adherence}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-medical-50 p-4 shadow-[0_12px_28px_-20px_rgba(15,118,110,0.7)]">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 rounded-lg bg-medical-100 p-1 text-medical-700">
              <MedicalIcon name="ai" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">AI 健康建议</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{aiSuggestion}</p>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/reminders"
            className="rounded-xl bg-white p-3 text-xs font-medium text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]"
          >
            <div className="mb-1 flex items-center gap-1 text-medical-700">
              <MedicalIcon name="reminder" className="h-4 w-4" /> 提醒中心
            </div>
            管理闹钟规则与状态
          </Link>
          <Link
            to="/consult"
            className="rounded-xl bg-white p-3 text-xs font-medium text-slate-700 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]"
          >
            <div className="mb-1 flex items-center gap-1 text-medical-700">
              <MedicalIcon name="consult" className="h-4 w-4" /> AI复诊摘要
            </div>
            查看近7天问诊材料
          </Link>
        </div>

        <section id="today-reminder-tasks" className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">今日提醒任务</h2>
          {todayReminders.length === 0 ? (
            <article className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-card">
              今日暂无提醒任务，请先前往“提醒”页面创建闹钟规则。
            </article>
          ) : null}
          {todayReminders.map((item) => (
            <article key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{item.medication?.drugName || '药品提醒'}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[item.visibleStatus]}`}>
                  {statusLabel[item.visibleStatus]}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                {formatTime(item.scheduledAt)} · {item.medication?.dose || '--'}{item.medication?.unit || ''} · {item.medication?.withMeal || '按医嘱'}
              </p>

              {item.visibleStatus === 'pending' ? (
                <p className="mt-1 text-xs text-slate-500">
                  下次提醒：{formatTime(item.dueAt)}（{formatDistance(item.dueAt)}）
                </p>
              ) : null}

              {item.visibleStatus === 'pending' ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => markReminderTaken(item.id)}
                    className="rounded-lg bg-medical-600 px-2 py-2 text-xs font-medium text-white"
                  >
                    标记已服药
                  </button>
                  <button
                    type="button"
                    onClick={() => skipReminder(item.id)}
                    className="rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700"
                  >
                    标记已跳过
                  </button>
                </div>
              ) : null}
            </article>
          ))}
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
              <p className="text-sm font-semibold text-slate-900">{activeStepData?.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{activeStepData?.description}</p>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1">
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
                去完成
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
              >
                下一步
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
