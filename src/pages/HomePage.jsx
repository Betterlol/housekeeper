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
  getTodayDateKey,
  getTodayReminderItemsFromStore,
  markReminderTaken,
  skipReminder,
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

const guideStateStyle = {
  completed: 'bg-emerald-100 text-emerald-700',
  current: 'bg-medical-100 text-medical-700',
  todo: 'bg-slate-100 text-slate-600',
}

const guideStateLabel = {
  completed: '已完成',
  current: '当前推荐',
  todo: '未完成',
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

export default function HomePage() {
  const navigate = useNavigate()
  const store = useStoreSnapshot({ ensureToday: true })
  const todayReminders = getTodayReminderItemsFromStore(store, getTodayDateKey())

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
  const experienceState = store.experienceState || {}

  const importedPrescription = (store.medications || []).some(
    (medication) => medication.sourceLabel === '处方导入'
  )

  const createdReminders = (store.reminderRules || []).length > 0

  const completedIntake = (store.intakeLogs || []).some((log) => log.status === 'taken')
    || (store.reminderInstances || []).some((instance) => instance.visibleStatus === 'taken')

  const guideTasks = [
    {
      key: 'import',
      title: '导入处方',
      description: '体验 AI 自动识别药品与剂量',
      completed: importedPrescription,
      route: '/plan',
    },
    {
      key: 'reminder',
      title: '生成提醒',
      description: '自动创建用药闹钟',
      completed: createdReminders,
      route: '/reminders',
    },
    {
      key: 'intake',
      title: '完成一次服药',
      description: '体验真实用药提醒流程',
      completed: completedIntake,
      route: '/home',
    },
    {
      key: 'consult',
      title: '查看 AI复诊摘要',
      description: '生成医生可读复诊报告',
      completed: Boolean(experienceState.consultViewed),
      route: '/consult',
    },
    {
      key: 'purchase',
      title: '查看购药建议',
      description: '体验库存分析与智能补货',
      completed: Boolean(experienceState.purchaseViewed),
      route: '/purchase',
    },
  ]

  const completedGuideCount = guideTasks.filter((task) => task.completed).length
  const currentGuideTask = guideTasks.find((task) => !task.completed) || null
  const guideProgress = Math.round((completedGuideCount / guideTasks.length) * 100)

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

  const handleGuideClick = (task) => {
    if (task.key === 'intake') {
      const section = document.getElementById('today-reminder-tasks')
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
      return
    }

    navigate(task.route)
  }

  return (
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

      <article className="rounded-2xl border border-medical-100 bg-gradient-to-br from-white via-cyan-50/70 to-medical-50 p-4 shadow-[0_14px_30px_-20px_rgba(15,118,110,0.55)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">今日健康任务</p>
            <p className="mt-1 text-xs text-slate-500">新用户推荐按步骤体验完整闭环流程</p>
          </div>
          <span className="rounded-full bg-medical-100 px-2 py-1 text-xs font-medium text-medical-700">
            {completedGuideCount}/{guideTasks.length}
          </span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-medical-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${guideProgress}%` }}
          />
        </div>

        {currentGuideTask ? (
          <p className="mt-2 text-xs text-medical-700">推荐下一步：{currentGuideTask.title}</p>
        ) : (
          <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
            <p className="font-semibold">今日健康流程已体验完成</p>
            <p className="mt-1">AI健康管理已启用 · 用药提醒运行中 · 购药监测运行中</p>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {guideTasks.map((task, index) => {
            const state = task.completed
              ? 'completed'
              : currentGuideTask?.key === task.key
                ? 'current'
                : 'todo'

            return (
              <button
                key={task.key}
                type="button"
                onClick={() => handleGuideClick(task)}
                className="flex w-full items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-left transition hover:bg-white"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      task.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    } ${state === 'current' ? 'animate-pulse' : ''}`}
                  >
                    {task.completed ? '✓' : index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{task.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{task.description}</p>
                  </div>
                </div>

                <span className={`rounded-full px-2 py-1 text-[11px] ${guideStateStyle[state]}`}>
                  {guideStateLabel[state]}
                </span>
              </button>
            )
          })}
        </div>
      </article>

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
  )
}
