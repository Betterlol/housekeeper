import { useMemo, useState } from 'react'
import MedicalIcon from '../components/MedicalIcon'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  addReminderRule,
  deleteReminderRule,
  getReminderRulesWithToday,
  markAllTodayTaken,
  markReminderMissed,
  markReminderTaken,
  postponeReminderBeforeRing,
  restoreReminderDemoData,
  resetReminderToPending,
  skipReminder,
  toggleReminderRule,
  triggerReminderNow,
  updateReminderRule,
} from '../utils/storage'

const statusStyle = {
  off: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  taken: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-rose-100 text-rose-700',
  skipped: 'bg-slate-200 text-slate-700',
}

const statusLabel = {
  off: '关闭',
  pending: '待服药',
  taken: '已服药',
  missed: '已漏服',
  skipped: '已跳过',
}

function formatTime(value) {
  if (!value) return '--:--'
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    const hh = `${parsed.getHours()}`.padStart(2, '0')
    const mm = `${parsed.getMinutes()}`.padStart(2, '0')
    return `${hh}:${mm}`
  }
  return value.slice(11, 16)
}

function formatDistance(target) {
  if (!target) return '暂无'

  const diffMs = new Date(target).getTime() - Date.now()
  if (diffMs <= 0) return '即将触发'

  const minutes = Math.ceil(diffMs / 60000)
  return `${minutes} 分钟后`
}

function nextTenMinutesTime() {
  const date = new Date(Date.now() + 10 * 60 * 1000)
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${hour}:${minute}`
}

const initialRuleForm = {
  medicationId: '',
  time: nextTenMinutesTime(),
  retryIntervalMinutes: 5,
  maxRetryCount: 3,
  enabled: true,
}

export default function RemindersPage() {
  const [message, setMessage] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState('')
  const [ruleForm, setRuleForm] = useState(initialRuleForm)

  const store = useStoreSnapshot({ ensureToday: true })
  const medications = store.medications || []
  const rules = useMemo(() => getReminderRulesWithToday(), [store])

  const pendingCount = rules.filter((item) => item.todayStatus === 'pending').length
  const takenCount = rules.filter((item) => item.todayStatus === 'taken').length
  const missedCount = rules.filter((item) => item.todayStatus === 'missed').length
  const offCount = rules.filter((item) => item.todayStatus === 'off').length

  const nextTrigger = rules
    .filter((item) => item.enabled && item.todayStatus === 'pending' && item.nextTriggerAt)
    .sort((a, b) => (a.nextTriggerAt > b.nextTriggerAt ? 1 : -1))[0]

  const openCreate = () => {
    setEditingRuleId('')
    setRuleForm({ ...initialRuleForm, time: nextTenMinutesTime() })
    setEditorOpen(true)
  }

  const openEdit = (rule) => {
    setEditingRuleId(rule.id)
    setRuleForm({
      medicationId: rule.medicationId,
      time: rule.time || nextTenMinutesTime(),
      retryIntervalMinutes: Number(rule.retryIntervalMinutes || 5),
      maxRetryCount: Number(rule.maxRetryCount || 3),
      enabled: Boolean(rule.enabled),
    })
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingRuleId('')
    setRuleForm({ ...initialRuleForm, time: nextTenMinutesTime() })
  }

  const handleRuleField = (event) => {
    const { name, value, type, checked } = event.target
    setRuleForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmitRule = (event) => {
    event.preventDefault()

    if (!ruleForm.medicationId) {
      setMessage('请先选择已存在药品，再保存提醒规则。')
      return
    }

    const payload = {
      medicationId: ruleForm.medicationId,
      time: ruleForm.time,
      enabled: Boolean(ruleForm.enabled),
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      retryIntervalMinutes: Number(ruleForm.retryIntervalMinutes),
      maxRetryCount: Number(ruleForm.maxRetryCount),
    }

    if (editingRuleId) {
      updateReminderRule(editingRuleId, payload)
      setMessage('提醒规则已更新。')
    } else {
      addReminderRule(payload)
      setMessage('提醒规则已创建。')
    }

    closeEditor()
  }

  return (
    <section className="space-y-4">
      <article className="rounded-3xl bg-gradient-to-br from-cyan-700 via-medical-700 to-emerald-700 p-5 text-white shadow-[0_22px_44px_-20px_rgba(15,118,110,0.85)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-cyan-100">闹钟规则管理</p>
            <h1 className="mt-1 text-xl font-semibold">提醒中心</h1>
            <p className="mt-2 text-xs text-cyan-100">
              下次触发：{nextTrigger ? `${formatTime(nextTrigger.nextTriggerAt)}（${formatDistance(nextTrigger.nextTriggerAt)}）` : '暂无'}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-white/20 px-3 py-2 text-xs font-medium text-white"
          >
            新增规则
          </button>
        </div>
      </article>

      {message ? (
        <article className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </article>
      ) : null}

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">今日状态总览</p>
          <span className="text-xs text-slate-500">仅展示用户可见状态</span>
        </div>
        <p className="text-xs text-slate-600">
          待服药 {pendingCount} · 已服药 {takenCount} · 已漏服 {missedCount} · 关闭 {offCount}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              markAllTodayTaken()
              setMessage('今日待服药已一键标记为已服药。')
            }}
            className="rounded-xl bg-medical-600 px-3 py-2 text-xs font-medium text-white"
          >
            一键全部已服药
          </button>

          <button
            type="button"
            onClick={() => {
              restoreReminderDemoData()
              setMessage('已恢复演示提醒数据。')
            }}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white"
          >
            一键恢复演示提醒数据
          </button>
        </div>
      </article>

      <section className="space-y-3">
        {rules.map((rule) => {
          const todayItem = rule.todayItem
          const canPostpone = todayItem
            && todayItem.visibleStatus === 'pending'
            && todayItem.internalStatus !== 'ringing'

          return (
            <article key={rule.id} className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{rule.medication?.drugName || '未匹配药品'}</p>
                  <p className="mt-1 text-xs text-slate-500">提醒时间 {rule.time}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(rule)}
                    className="rounded-lg border border-medical-200 px-2 py-1 text-xs text-medical-700"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteReminderRule(rule.id)
                      setMessage(`${rule.medication?.drugName || '该规则'} 已删除。`)
                    }}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                  >
                    删除
                  </button>

                  <details className="relative">
                    <summary className={`cursor-pointer list-none rounded-full px-2 py-1 text-[11px] font-medium ${statusStyle[rule.todayStatus]}`}>
                      {statusLabel[rule.todayStatus]}
                    </summary>
                    <div className="absolute right-0 z-10 mt-2 w-32 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          if (!todayItem) return
                          markReminderTaken(todayItem.id)
                          setMessage(`${rule.medication?.drugName || '当前药品'} 已标记为已服药。`)
                        }}
                        className="block w-full rounded-lg px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
                      >
                        标记已服药
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!todayItem) return
                          skipReminder(todayItem.id)
                          setMessage(`${rule.medication?.drugName || '当前药品'} 已标记为已跳过。`)
                        }}
                        className="mt-1 block w-full rounded-lg px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
                      >
                        标记已跳过
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!todayItem) return
                          markReminderMissed(todayItem.id)
                          setMessage(`${rule.medication?.drugName || '当前药品'} 已标记为已漏服。`)
                        }}
                        className="mt-1 block w-full rounded-lg px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
                      >
                        标记已漏服
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!todayItem) return
                          const result = resetReminderToPending(todayItem.id)
                          if (!result.ok) {
                            if (result.reason === 'disabled') {
                              setMessage('该闹钟当前为关闭状态，请先开启后再恢复“待服药”。')
                              return
                            }
                            setMessage('当前状态无法恢复为待服药，请稍后重试。')
                            return
                          }
                          setMessage(`${rule.medication?.drugName || '当前药品'} 已恢复为待服药，将继续提醒。`)
                        }}
                        className="mt-1 block w-full rounded-lg px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
                      >
                        恢复待服药
                      </button>
                    </div>
                  </details>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p>重试间隔：{rule.retryIntervalMinutes} 分钟</p>
                <p>最大提醒次数：{rule.maxRetryCount} 次</p>
                <p>今日状态：{statusLabel[rule.todayStatus]}</p>
                <p>下次触发：{rule.nextTriggerAt ? `${formatTime(rule.nextTriggerAt)}（${formatDistance(rule.nextTriggerAt)}）` : '暂无'}</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={Boolean(rule.enabled)}
                    onChange={(event) => {
                      toggleReminderRule(rule.id, event.target.checked)
                      setMessage(`${rule.medication?.drugName || '提醒规则'} 已${event.target.checked ? '开启' : '关闭'}。`)
                    }}
                  />
                  开关
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!todayItem) return
                    const changed = postponeReminderBeforeRing(todayItem.id, 5)
                    if (!changed) {
                      setMessage('当前提醒已响铃或已完成，无法执行“延后提醒”。')
                      return
                    }
                    setMessage(`${rule.medication?.drugName || '当前药品'} 本次提醒已延后 5 分钟。`)
                  }}
                  disabled={!canPostpone}
                  className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 disabled:opacity-40"
                >
                  延后提醒（+5分钟）
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!todayItem) return
                    triggerReminderNow(todayItem.id)
                    setMessage(`${rule.medication?.drugName || '当前药品'} 已手动触发响铃。`)
                  }}
                  className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700"
                >
                  手动触发
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <div className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-900">
          <MedicalIcon name="clock" className="h-4 w-4 text-medical-700" />
          提醒说明
        </div>
        <p className="text-xs leading-5 text-slate-600">
          “延后提醒”只会调整本次下次触发时间，不改变用户可见状态。响铃后点击弹窗“稍后提醒”会按规则重试；达到最大提醒次数后，系统自动记为“已漏服”。
        </p>
      </article>

      {editorOpen ? (
        <div className="sheet-overlay z-40">
          <form
            onSubmit={handleSubmitRule}
            className="sheet-panel"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">{editingRuleId ? '编辑提醒规则' : '新增提醒规则'}</p>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                关闭
              </button>
            </div>

            {medications.length === 0 ? (
              <p className="text-xs text-amber-700">请先到“用药计划”新增药品，再创建提醒规则。</p>
            ) : (
              <div className="space-y-3">
                <select
                  name="medicationId"
                  value={ruleForm.medicationId}
                  onChange={handleRuleField}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
                >
                  <option value="">选择已存在药品</option>
                  {medications.map((medication) => (
                    <option key={medication.id} value={medication.id}>
                      {medication.drugName}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    name="time"
                    type="time"
                    value={ruleForm.time}
                    onChange={handleRuleField}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
                  />

                  <select
                    name="retryIntervalMinutes"
                    value={ruleForm.retryIntervalMinutes}
                    onChange={handleRuleField}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
                  >
                    <option value={5}>5分钟</option>
                    <option value={10}>10分钟</option>
                    <option value={15}>15分钟</option>
                  </select>

                  <select
                    name="maxRetryCount"
                    value={ruleForm.maxRetryCount}
                    onChange={handleRuleField}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-600"
                  >
                    <option value={1}>1次</option>
                    <option value={3}>3次</option>
                    <option value={5}>5次</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    name="enabled"
                    type="checkbox"
                    checked={Boolean(ruleForm.enabled)}
                    onChange={handleRuleField}
                  />
                  启用该提醒规则
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
                >
                  {editingRuleId ? '保存规则修改' : '创建提醒规则'}
                </button>
              </div>
            )}
          </form>
        </div>
      ) : null}
    </section>
  )
}
