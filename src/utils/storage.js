import { mockStore } from '../data/mock'

const STORAGE_KEY = 'housekeeper-med-app-v1'
export const STORE_UPDATED_EVENT = 'housekeeper-store-updated'

export const VISIBLE_REMINDER_STATUSES = ['off', 'pending', 'taken', 'missed', 'skipped']
export const INTERNAL_REMINDER_STATUSES = ['waiting', 'ringing', 'snoozed', 'retrying', 'completed', 'expired']

const FINAL_VISIBLE_STATUS_SET = new Set(['taken', 'missed', 'skipped'])
const DEFAULT_REPEAT_DAYS = [0, 1, 2, 3, 4, 5, 6]
const ONBOARDING_STEP_COUNT = 6
const RING_ACK_TIMEOUT_MS = 60 * 1000

const clone = (obj) => JSON.parse(JSON.stringify(obj))

function pad2(value) {
  return `${value}`.padStart(2, '0')
}

function toLocalDateTime(date, withSeconds = true) {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hour = pad2(date.getHours())
  const minute = pad2(date.getMinutes())

  if (!withSeconds) {
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  const second = pad2(date.getSeconds())
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

function parseDateLike(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

function toDateTime(dateKey, time) {
  return `${dateKey}T${time}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toTime(iso) {
  if (!iso || !iso.includes('T')) return '08:00'
  const parsed = parseDateLike(iso)
  if (parsed) {
    return `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`
  }
  return iso.slice(11, 16)
}

function toInt(value, fallback = 0) {
  const next = Number(value)
  if (Number.isNaN(next)) return fallback
  return Math.round(next)
}

function toPositiveInt(value, fallback = 1) {
  const resolved = toInt(value, fallback)
  return resolved > 0 ? resolved : fallback
}

function toNonNegativeInt(value, fallback = 0) {
  const resolved = toInt(value, fallback)
  return resolved >= 0 ? resolved : fallback
}

function nowIso() {
  return toLocalDateTime(new Date())
}

function addMinutesToNow(minutes) {
  return toLocalDateTime(new Date(Date.now() + Number(minutes || 0) * 60 * 1000))
}

function normalizeMinuteDateTime(value, fallback) {
  const parsed = parseDateLike(value)
  if (!parsed) return fallback
  return toLocalDateTime(parsed, false)
}

function normalizeSecondDateTime(value, fallback) {
  const parsed = parseDateLike(value)
  if (!parsed) return fallback
  return toLocalDateTime(parsed)
}

function getDefaultUserProfile() {
  return {
    name: '张先生',
    age: 58,
    gender: '男',
    diseases: ['高血压', '2型糖尿病'],
    diagnosisDate: '2018-03-12',
    note: '请按时服药并按期复诊。',
    bloodPressure: '',
    bloodSugar: '',
    doctorAdvice: '',
    nextVisitDate: '',
  }
}

function emitStoreUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(STORE_UPDATED_EVENT))
}

function isMedicationActiveOnDate(medication, dateKey) {
  const startOk = !medication.startDate || medication.startDate <= dateKey
  const endOk = !medication.endDate || medication.endDate >= dateKey
  return startOk && endOk
}

function isRuleEnabledOnDate(rule, dateKey) {
  const day = new Date(`${dateKey}T00:00:00`).getDay()
  const repeatDays = Array.isArray(rule.repeatDays) && rule.repeatDays.length > 0
    ? rule.repeatDays
    : DEFAULT_REPEAT_DAYS

  return repeatDays.includes(day)
}

function isVisibleStatus(status) {
  return VISIBLE_REMINDER_STATUSES.includes(status)
}

function isInternalStatus(status) {
  return INTERNAL_REMINDER_STATUSES.includes(status)
}

function normalizeVisibleStatus(status) {
  if (status === 'scheduled' || status === 'notified' || status === 'snoozed') return 'pending'
  if (status === 'disabled' || status === 'closed') return 'off'
  if (isVisibleStatus(status)) return status
  return 'pending'
}

function normalizeInternalStatus(status, visibleStatus) {
  if (isInternalStatus(status)) return status

  if (status === 'scheduled') return 'waiting'
  if (status === 'notified') return 'ringing'
  if (status === 'snoozed') return 'snoozed'

  if (visibleStatus === 'taken' || visibleStatus === 'skipped') return 'completed'
  if (visibleStatus === 'missed' || visibleStatus === 'off') return 'expired'
  return 'waiting'
}

function normalizeMedication(medication = {}, index = 0) {
  return {
    id: medication.id || `med-${Date.now()}-${index}`,
    drugName: medication.drugName || '未命名药品',
    spec: medication.spec || '',
    dose: Number(medication.dose || 1),
    unit: medication.unit || '片',
    withMeal: medication.withMeal || '按医嘱',
    stockQty: Number(medication.stockQty || 0),
    stockUnit: medication.stockUnit || '片',
    startDate: medication.startDate || toDateKey(new Date()),
    endDate: medication.endDate || '',
    sourceLabel: medication.sourceLabel || medication.source || '手动录入',
    frequencyPerDay: toPositiveInt(medication.frequencyPerDay, 1),
    times: Array.isArray(medication.times)
      ? medication.times
      : typeof medication.times === 'string'
        ? medication.times.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
  }
}

function normalizeReminderRule(rule = {}, index = 0) {
  const repeatDays = Array.isArray(rule.repeatDays) && rule.repeatDays.length > 0
    ? rule.repeatDays.map((day) => toNonNegativeInt(day, 0)).filter((day) => day >= 0 && day <= 6)
    : DEFAULT_REPEAT_DAYS

  const createdAt = rule.createdAt || nowIso()

  return {
    id: rule.id || `rule-${Date.now()}-${index}`,
    medicationId: rule.medicationId || rule.medId || '',
    time: rule.time || '08:00',
    enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
    repeatDays,
    retryIntervalMinutes: toPositiveInt(rule.retryIntervalMinutes, 5),
    maxRetryCount: toNonNegativeInt(rule.maxRetryCount, 3),
    createdAt,
    updatedAt: rule.updatedAt || createdAt,
  }
}

function normalizeReminderInstance(instance = {}, index = 0) {
  const visibleStatus = normalizeVisibleStatus(
    instance.visibleStatus || instance.reminderStatus || instance.status || 'pending'
  )

  const fallbackScheduledAt = toDateTime(toDateKey(new Date()), '08:00')
  const scheduledAt = normalizeMinuteDateTime(instance.scheduledAt, fallbackScheduledAt)
  const currentTriggerAt = normalizeSecondDateTime(
    instance.currentTriggerAt || instance.snoozeUntil || scheduledAt,
    scheduledAt
  )

  return {
    id: instance.id || `instance-${Date.now()}-${index}`,
    ruleId: instance.ruleId || '',
    medicationId: instance.medicationId || instance.medId || '',
    scheduledAt,
    currentTriggerAt,
    retryCount: toNonNegativeInt(instance.retryCount, 0),
    internalStatus: normalizeInternalStatus(instance.internalStatus || instance.status, visibleStatus),
    visibleStatus,
    lastNotifiedAt: instance.lastNotifiedAt || instance.notifiedAt || '',
    notifiedAt: instance.notifiedAt || instance.lastNotifiedAt || '',
    completedAt: instance.completedAt || instance.takenAt || '',
    reminderStatus: visibleStatus,
    status: visibleStatus,
    snoozeUntil: instance.snoozeUntil || '',
    takenAt: instance.takenAt || '',
  }
}

function normalizeIntakeLog(log = {}, index = 0) {
  const status = normalizeVisibleStatus(log.status || log.reminderStatus || 'pending')
  const fallbackScheduledAt = toDateTime(toDateKey(new Date()), '08:00')

  return {
    id: log.id || `log-${Date.now()}-${index}`,
    medicationId: log.medicationId || log.medId || '',
    medId: log.medicationId || log.medId || '',
    reminderInstanceId: log.reminderInstanceId || '',
    scheduledAt: normalizeMinuteDateTime(log.scheduledAt, fallbackScheduledAt),
    takenAt: normalizeSecondDateTime(log.takenAt, ''),
    status,
    reason: log.reason || '',
    reminderStatus: status,
  }
}

function normalizeUserProfile(profile = {}) {
  const fallback = getDefaultUserProfile()
  const diseases = Array.isArray(profile.diseases)
    ? profile.diseases
    : typeof profile.diseases === 'string'
      ? profile.diseases.split(/[,，]/).map((item) => item.trim()).filter(Boolean)
      : fallback.diseases

  return {
    name: profile.name || fallback.name,
    age: toPositiveInt(profile.age, fallback.age),
    gender: profile.gender || fallback.gender,
    diseases,
    diagnosisDate: profile.diagnosisDate || fallback.diagnosisDate,
    note: profile.note || fallback.note,
    bloodPressure: profile.bloodPressure || '',
    bloodSugar: profile.bloodSugar || '',
    doctorAdvice: profile.doctorAdvice || '',
    nextVisitDate: profile.nextVisitDate || '',
  }
}

function normalizeExperienceState(state = {}) {
  return {
    onboardingDismissed: Boolean(state.onboardingDismissed),
    onboardingCompleted: Boolean(state.onboardingCompleted),
    currentOnboardingStep: Math.min(toNonNegativeInt(state.currentOnboardingStep, 0), ONBOARDING_STEP_COUNT - 1),
    consultViewed: Boolean(state.consultViewed || state.consultVisited),
    purchaseViewed: Boolean(state.purchaseViewed || state.purchaseVisited),
  }
}

function computeOnboardingProgress(store, experienceState) {
  const profileImported = Boolean(
    store.userProfile?.bloodPressure
    || store.userProfile?.bloodSugar
    || store.userProfile?.doctorAdvice
    || store.userProfile?.nextVisitDate
  )

  const importedPrescription = (store.medications || []).some((medication) => medication.sourceLabel === '处方导入')
  const hasReminderRules = (store.reminderRules || []).length > 0
  const hasTaken = (store.intakeLogs || []).some((log) => log.status === 'taken')
    || (store.reminderInstances || []).some((instance) => instance.visibleStatus === 'taken')

  const stepCompleted = [
    profileImported,
    importedPrescription,
    hasReminderRules,
    hasTaken,
    Boolean(experienceState.consultViewed),
    Boolean(experienceState.purchaseViewed),
  ]

  const completedCount = stepCompleted.filter(Boolean).length
  const firstIncompleteIndex = stepCompleted.findIndex((item) => !item)
  const onboardingCompleted = firstIncompleteIndex === -1
  const recommendedStepIndex = onboardingCompleted ? ONBOARDING_STEP_COUNT - 1 : firstIncompleteIndex

  return {
    stepCompleted,
    completedCount,
    onboardingCompleted,
    recommendedStepIndex,
  }
}

function applyOnboardingProgressToStore(store) {
  const experienceState = normalizeExperienceState(store.experienceState || {})
  const progress = computeOnboardingProgress(store, experienceState)

  let currentOnboardingStep = experienceState.currentOnboardingStep
  if (progress.onboardingCompleted) {
    currentOnboardingStep = ONBOARDING_STEP_COUNT - 1
  } else if (currentOnboardingStep < progress.recommendedStepIndex) {
    currentOnboardingStep = progress.recommendedStepIndex
  }

  const nextExperienceState = {
    ...experienceState,
    onboardingCompleted: progress.onboardingCompleted,
    currentOnboardingStep,
  }

  const changed = JSON.stringify(experienceState) !== JSON.stringify(nextExperienceState)

  return {
    changed,
    nextStore: changed
      ? {
          ...store,
          experienceState: nextExperienceState,
        }
      : store,
    experienceState: nextExperienceState,
    progress,
  }
}

function buildLegacyRulesFromMedications(medications) {
  const rules = []

  medications.forEach((medication, medIndex) => {
    const legacyTimes = Array.isArray(medication.times) && medication.times.length > 0
      ? medication.times
      : []

    if (legacyTimes.length === 0) return

    legacyTimes.forEach((time, timeIndex) => {
      rules.push(
        normalizeReminderRule({
          id: `rule-legacy-${medication.id}-${timeIndex}`,
          medicationId: medication.id,
          time,
          enabled: true,
          repeatDays: DEFAULT_REPEAT_DAYS,
          retryIntervalMinutes: 5,
          maxRetryCount: 3,
          createdAt: medication.createdAt || nowIso(),
          updatedAt: medication.updatedAt || nowIso(),
        }, `${medIndex}-${timeIndex}`)
      )
    })
  })

  return rules
}

function ensureRuleForLegacyLog(reminderRules, log) {
  const medId = log.medicationId || log.medId || ''
  const time = toTime(log.scheduledAt)
  const key = `${medId}|${time}`

  const existing = reminderRules.find((rule) => `${rule.medicationId}|${rule.time}` === key)
  if (existing) return existing

  const rule = normalizeReminderRule({
    id: `rule-migrate-${medId}-${time}`,
    medicationId: medId,
    time,
    enabled: true,
    repeatDays: DEFAULT_REPEAT_DAYS,
    retryIntervalMinutes: 5,
    maxRetryCount: 3,
  })

  reminderRules.push(rule)
  return rule
}

function mapLegacyLogToInstance(log, rule, index) {
  const visibleStatus = normalizeVisibleStatus(log.status || log.reminderStatus || 'pending')

  return normalizeReminderInstance({
    id: `instance-migrate-${index}`,
    ruleId: rule.id,
    medicationId: log.medicationId || log.medId || '',
    scheduledAt: log.scheduledAt,
    currentTriggerAt: log.snoozeUntil || log.scheduledAt,
    retryCount: toNonNegativeInt(log.retryCount, log.status === 'snoozed' ? 1 : 0),
    internalStatus: normalizeInternalStatus(log.status, visibleStatus),
    visibleStatus,
    lastNotifiedAt: log.notifiedAt || '',
    completedAt: visibleStatus === 'taken' ? log.takenAt || '' : '',
    takenAt: log.takenAt || '',
    reason: log.reason || '',
  })
}

function upsertFinalLogForInstance(store, instance, reason = '') {
  if (!FINAL_VISIBLE_STATUS_SET.has(instance.visibleStatus)) return store

  const existingIndex = (store.intakeLogs || []).findIndex(
    (log) => log.reminderInstanceId === instance.id
  )

  const nextLog = normalizeIntakeLog({
    id: existingIndex >= 0 ? store.intakeLogs[existingIndex].id : `log-${Date.now()}-${instance.id}`,
    medicationId: instance.medicationId,
    medId: instance.medicationId,
    reminderInstanceId: instance.id,
    scheduledAt: instance.scheduledAt,
    takenAt: instance.visibleStatus === 'taken' ? (instance.completedAt || nowIso()) : '',
    status: instance.visibleStatus,
    reason,
  })

  if (existingIndex >= 0) {
    const nextLogs = [...store.intakeLogs]
    nextLogs[existingIndex] = nextLog
    return { ...store, intakeLogs: nextLogs }
  }

  return {
    ...store,
    intakeLogs: [nextLog, ...(store.intakeLogs || [])],
  }
}

function normalizeStoreSchema(rawStore = {}) {
  const base = rawStore || {}
  const isLegacySource = !base.schemaVersion || Number(base.schemaVersion) < 2
  const hasReminderRulesField = Array.isArray(base.reminderRules)
  const hasReminderInstancesField = Array.isArray(base.reminderInstances)

  const medications = Array.isArray(base.medications)
    ? base.medications.map((item, index) => normalizeMedication(item, index))
    : []

  let reminderRules = Array.isArray(base.reminderRules)
    ? base.reminderRules.map((item, index) => normalizeReminderRule(item, index))
    : []

  if (isLegacySource && !hasReminderRulesField && reminderRules.length === 0) {
    reminderRules = buildLegacyRulesFromMedications(medications)
  }

  let reminderInstances = Array.isArray(base.reminderInstances)
    ? base.reminderInstances.map((item, index) => normalizeReminderInstance(item, index))
    : []

  const legacyLogs = Array.isArray(base.intakeLogs)
    ? base.intakeLogs.map((item, index) => normalizeIntakeLog(item, index))
    : []

  if (isLegacySource && !hasReminderInstancesField && reminderInstances.length === 0 && legacyLogs.length > 0) {
    reminderInstances = legacyLogs.map((log, index) => {
      const rule = ensureRuleForLegacyLog(reminderRules, log)
      return mapLegacyLogToInstance(log, rule, index)
    })
  }

  reminderInstances = reminderInstances.map((instance) => {
    if (instance.ruleId) return instance

    const rule = reminderRules.find(
      (item) => item.medicationId === instance.medicationId && item.time === toTime(instance.scheduledAt)
    )

    if (rule) {
      return {
        ...instance,
        ruleId: rule.id,
      }
    }

    const fallbackRule = normalizeReminderRule({
      id: `rule-auto-${instance.medicationId}-${toTime(instance.scheduledAt)}`,
      medicationId: instance.medicationId,
      time: toTime(instance.scheduledAt),
      enabled: true,
      repeatDays: DEFAULT_REPEAT_DAYS,
      retryIntervalMinutes: 5,
      maxRetryCount: 3,
    })

    reminderRules.push(fallbackRule)

    return {
      ...instance,
      ruleId: fallbackRule.id,
    }
  })

  let intakeLogs = legacyLogs

  reminderInstances.forEach((instance) => {
    if (!FINAL_VISIBLE_STATUS_SET.has(instance.visibleStatus)) return

    if (intakeLogs.some((log) => log.reminderInstanceId === instance.id)) return

    intakeLogs = [
      normalizeIntakeLog({
        id: `log-instance-${instance.id}`,
        medicationId: instance.medicationId,
        medId: instance.medicationId,
        reminderInstanceId: instance.id,
        scheduledAt: instance.scheduledAt,
        takenAt: instance.visibleStatus === 'taken' ? (instance.completedAt || instance.takenAt || '') : '',
        status: instance.visibleStatus,
        reason: '',
      }),
      ...intakeLogs,
    ]
  })

  const normalizedQueue = Array.isArray(base.reminderQueue)
    ? base.reminderQueue.filter((id) => reminderInstances.some((instance) => instance.id === id))
    : reminderInstances
      .filter((instance) => instance.internalStatus === 'ringing' && instance.visibleStatus === 'pending')
      .map((instance) => instance.id)

  const userProfile = normalizeUserProfile(base.userProfile || {})
  const experienceState = normalizeExperienceState(base.experienceState || base.experience || {})

  const normalizedStore = {
    ...base,
    schemaVersion: 2,
    medications,
    reminderRules,
    reminderInstances,
    intakeLogs,
    reminderQueue: normalizedQueue,
    userProfile,
    experienceState,
    adverseEvents: Array.isArray(base.adverseEvents) ? base.adverseEvents : [],
    demoMeta: base.demoMeta || {
      mode: 'default',
      generatedAt: '',
      label: '基础数据',
    },
  }

  return applyOnboardingProgressToStore(normalizedStore).nextStore
}

function compareIso(a, b) {
  if (a === b) return 0
  const timeA = parseDateLike(a)?.getTime()
  const timeB = parseDateLike(b)?.getTime()

  if (typeof timeA === 'number' && typeof timeB === 'number') {
    if (timeA === timeB) return 0
    return timeA > timeB ? 1 : -1
  }

  return `${a}` > `${b}` ? 1 : -1
}

function syncInstancesForDate(store, dateKey = toDateKey(new Date())) {
  let changed = false
  let nextInstances = [...(store.reminderInstances || [])]
  const queueSet = new Set(store.reminderQueue || [])

  ;(store.reminderRules || []).forEach((rule) => {
    const medication = (store.medications || []).find((item) => item.id === rule.medicationId)
    if (!medication) return
    if (!isMedicationActiveOnDate(medication, dateKey)) return
    if (!isRuleEnabledOnDate(rule, dateKey)) return

    const scheduledAt = toDateTime(dateKey, rule.time)

    nextInstances = nextInstances.filter((instance) => {
      if (
        instance.ruleId === rule.id
        && (instance.scheduledAt || '').startsWith(dateKey)
        && instance.scheduledAt !== scheduledAt
        && !FINAL_VISIBLE_STATUS_SET.has(instance.visibleStatus)
      ) {
        queueSet.delete(instance.id)
        changed = true
        return false
      }

      return true
    })

    const targetIndex = nextInstances.findIndex(
      (instance) => instance.ruleId === rule.id && instance.scheduledAt === scheduledAt
    )

    if (targetIndex === -1) {
      const nextInstance = normalizeReminderInstance({
        id: `instance-${Date.now()}-${rule.id}`,
        ruleId: rule.id,
        medicationId: medication.id,
        scheduledAt,
        currentTriggerAt: scheduledAt,
        retryCount: 0,
        internalStatus: rule.enabled ? 'waiting' : 'expired',
        visibleStatus: rule.enabled ? 'pending' : 'off',
        lastNotifiedAt: '',
        completedAt: '',
      })

      nextInstances.push(nextInstance)
      changed = true
      return
    }

    const current = normalizeReminderInstance(nextInstances[targetIndex])
    if (FINAL_VISIBLE_STATUS_SET.has(current.visibleStatus)) {
      nextInstances[targetIndex] = {
        ...current,
        medicationId: medication.id,
        ruleId: rule.id,
      }
      return
    }

    let next = {
      ...current,
      medicationId: medication.id,
      ruleId: rule.id,
    }

    if (!rule.enabled && current.visibleStatus !== 'off') {
      next = {
        ...next,
        visibleStatus: 'off',
        status: 'off',
        reminderStatus: 'off',
        internalStatus: 'expired',
        currentTriggerAt: scheduledAt,
      }

      queueSet.delete(next.id)
      changed = true
    }

    if (rule.enabled && current.visibleStatus === 'off') {
      next = {
        ...next,
        visibleStatus: 'pending',
        status: 'pending',
        reminderStatus: 'pending',
        internalStatus: 'waiting',
        currentTriggerAt: compareIso(current.currentTriggerAt || scheduledAt, scheduledAt) < 0
          ? scheduledAt
          : current.currentTriggerAt || scheduledAt,
      }

      changed = true
    }

    nextInstances[targetIndex] = next
  })

  if (!changed) {
    return {
      changed: false,
      nextStore: store,
    }
  }

  return {
    changed: true,
    nextStore: {
      ...store,
      reminderInstances: nextInstances,
      reminderQueue: Array.from(queueSet),
    },
  }
}

function getTodayDateKeyInner() {
  return toDateKey(new Date())
}

function getTodayInstancesFromStore(store, dateKey = getTodayDateKeyInner()) {
  return (store.reminderInstances || [])
    .filter((item) => (item.scheduledAt || '').startsWith(dateKey))
    .sort((a, b) => compareIso(a.scheduledAt, b.scheduledAt))
}

function withInstanceUpdate(store, instanceId, updater) {
  let changed = false
  let updated = null

  const reminderInstances = (store.reminderInstances || []).map((instance) => {
    if (instance.id !== instanceId) return instance

    const next = normalizeReminderInstance(updater(instance))
    changed = true
    updated = next
    return next
  })

  return {
    changed,
    updated,
    nextStore: changed
      ? {
          ...store,
          reminderInstances,
        }
      : store,
  }
}

function enrichInstance(store, instance) {
  const medication = (store.medications || []).find((item) => item.id === instance.medicationId) || null
  const rule = (store.reminderRules || []).find((item) => item.id === instance.ruleId) || null

  return {
    ...instance,
    medication,
    rule,
    dueAt: instance.currentTriggerAt || instance.scheduledAt,
    status: instance.visibleStatus,
  }
}

export function subscribeStoreUpdates(callback) {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener(STORE_UPDATED_EVENT, callback)
  return () => window.removeEventListener(STORE_UPDATED_EVENT, callback)
}

export function initStore() {
  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return

  const seeded = normalizeStoreSchema(mockStore)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
}

export function getStore() {
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    initStore()
    return normalizeStoreSchema(clone(mockStore))
  }

  try {
    const parsed = JSON.parse(raw)
    const normalized = normalizeStoreSchema(parsed)

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    }

    return normalized
  } catch (error) {
    const fallback = normalizeStoreSchema(clone(mockStore))
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return fallback
  }
}

export function setStore(nextStore) {
  const normalized = normalizeStoreSchema(nextStore)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  emitStoreUpdated()
}

export function getTodayDateKey() {
  return getTodayDateKeyInner()
}

export function ensureTodayReminderInstances(dateKey = getTodayDateKey()) {
  const store = getStore()
  const { changed, nextStore } = syncInstancesForDate(store, dateKey)

  if (changed) {
    setStore(nextStore)
    return nextStore
  }

  return store
}

export function ensureTodayReminderLogs(dateKey = getTodayDateKey()) {
  return ensureTodayReminderInstances(dateKey)
}

export function getMedications() {
  return getStore().medications || []
}

export function getIntakeLogs() {
  return getStore().intakeLogs || []
}

export function getTodayReminderItemsFromStore(store, dateKey = getTodayDateKey()) {
  const { nextStore } = syncInstancesForDate(store, dateKey)
  const ruleList = nextStore.reminderRules || []
  const medList = nextStore.medications || []
  const instanceList = getTodayInstancesFromStore(nextStore, dateKey)

  const rows = []

  ruleList.forEach((rule) => {
    const medication = medList.find((item) => item.id === rule.medicationId)
    if (!medication) return
    if (!isMedicationActiveOnDate(medication, dateKey)) return
    if (!isRuleEnabledOnDate(rule, dateKey)) return

    const scheduledAt = toDateTime(dateKey, rule.time)

    const instance = instanceList.find(
      (item) => item.ruleId === rule.id && item.scheduledAt === scheduledAt
    ) || normalizeReminderInstance({
      id: `virtual-${rule.id}-${dateKey}`,
      ruleId: rule.id,
      medicationId: rule.medicationId,
      scheduledAt,
      currentTriggerAt: scheduledAt,
      retryCount: 0,
      internalStatus: rule.enabled ? 'waiting' : 'expired',
      visibleStatus: rule.enabled ? 'pending' : 'off',
    })

    const visibleStatus = rule.enabled ? instance.visibleStatus : 'off'

    rows.push({
      ...instance,
      id: instance.id,
      ruleId: rule.id,
      medicationId: medication.id,
      scheduledAt,
      dueAt: visibleStatus === 'pending' ? (instance.currentTriggerAt || scheduledAt) : '',
      status: visibleStatus,
      visibleStatus,
      internalStatus: instance.internalStatus,
      medication,
      rule,
    })
  })

  return rows.sort((a, b) => compareIso(a.scheduledAt, b.scheduledAt))
}

export function getTodayReminderItems(dateKey = getTodayDateKey()) {
  const store = ensureTodayReminderInstances(dateKey)
  return getTodayReminderItemsFromStore(store, dateKey)
}

export function getReminderRulesWithToday(dateKey = getTodayDateKey()) {
  const store = ensureTodayReminderInstances(dateKey)
  const todayItems = getTodayReminderItemsFromStore(store, dateKey)

  return (store.reminderRules || [])
    .map((rule) => {
      const medication = (store.medications || []).find((item) => item.id === rule.medicationId) || null
      const todayItem = todayItems.find((item) => item.ruleId === rule.id) || null

      let nextTriggerAt = ''
      if (!rule.enabled) {
        nextTriggerAt = ''
      } else if (todayItem && todayItem.visibleStatus === 'pending') {
        nextTriggerAt = todayItem.dueAt || todayItem.scheduledAt
      } else {
        for (let i = 1; i <= 14; i += 1) {
          const day = addDays(new Date(`${dateKey}T00:00:00`), i)
          const dayKey = toDateKey(day)
          if (!isRuleEnabledOnDate(rule, dayKey)) continue
          if (!medication || !isMedicationActiveOnDate(medication, dayKey)) continue
          nextTriggerAt = toDateTime(dayKey, rule.time)
          break
        }
      }

      return {
        ...rule,
        medication,
        todayItem,
        todayStatus: !rule.enabled
          ? 'off'
          : todayItem
            ? todayItem.visibleStatus
            : 'pending',
        nextTriggerAt,
      }
    })
    .filter((item) => item.medication)
    .sort((a, b) => compareIso(a.time, b.time))
}

export function getReminderQueueItems() {
  const store = getStore()
  const queueSet = new Set(store.reminderQueue || [])

  return (store.reminderInstances || [])
    .filter((instance) => queueSet.has(instance.id))
    .filter((instance) => instance.visibleStatus === 'pending' && instance.internalStatus === 'ringing')
    .map((instance) => {
      const enriched = enrichInstance(store, instance)
      const maxRetryCount = enriched.rule?.maxRetryCount ?? 3

      return {
        ...enriched,
        attemptNo: instance.retryCount + 1,
        remainingRetryCount: Math.max(maxRetryCount - instance.retryCount, 0),
      }
    })
    .sort((a, b) => compareIso(a.currentTriggerAt, b.currentTriggerAt))
}

export function addMedication(payload) {
  const store = getStore()

  const medication = normalizeMedication({
    id: `med-${Date.now()}`,
    ...payload,
  })

  setStore({
    ...store,
    medications: [medication, ...(store.medications || [])],
  })

  return medication
}

export function updateMedication(medicationId, payload) {
  const store = getStore()

  const medications = (store.medications || []).map((medication) =>
    medication.id === medicationId
      ? normalizeMedication({
          ...medication,
          ...payload,
          id: medication.id,
        })
      : medication
  )

  setStore({
    ...store,
    medications,
  })
}

export function deleteMedication(medicationId) {
  const store = getStore()

  const deletedRuleIds = new Set(
    (store.reminderRules || [])
      .filter((rule) => rule.medicationId === medicationId)
      .map((rule) => rule.id)
  )

  const deletedInstanceIds = new Set(
    (store.reminderInstances || [])
      .filter((instance) => instance.medicationId === medicationId || deletedRuleIds.has(instance.ruleId))
      .map((instance) => instance.id)
  )

  const nextStore = {
    ...store,
    medications: (store.medications || []).filter((item) => item.id !== medicationId),
    reminderRules: (store.reminderRules || []).filter((rule) => !deletedRuleIds.has(rule.id)),
    reminderInstances: (store.reminderInstances || []).filter((instance) => !deletedInstanceIds.has(instance.id)),
    intakeLogs: (store.intakeLogs || []).filter(
      (log) => log.medicationId !== medicationId && !deletedInstanceIds.has(log.reminderInstanceId)
    ),
    reminderQueue: (store.reminderQueue || []).filter((id) => !deletedInstanceIds.has(id)),
  }

  setStore(nextStore)
}

export function addReminderRule(payload) {
  const store = getStore()

  const medication = (store.medications || []).find((item) => item.id === payload.medicationId)
  if (!medication) return null

  const createdAt = nowIso()

  const rule = normalizeReminderRule({
    id: `rule-${Date.now()}`,
    medicationId: payload.medicationId,
    time: payload.time,
    enabled: payload.enabled,
    repeatDays: payload.repeatDays,
    retryIntervalMinutes: payload.retryIntervalMinutes,
    maxRetryCount: payload.maxRetryCount,
    createdAt,
    updatedAt: createdAt,
  })

  const nextStore = {
    ...store,
    reminderRules: [rule, ...(store.reminderRules || [])],
  }

  const synced = syncInstancesForDate(nextStore, getTodayDateKey())
  setStore(synced.nextStore)

  return rule
}

export function updateReminderRule(ruleId, payload) {
  const store = getStore()

  const reminderRules = (store.reminderRules || []).map((rule) =>
    rule.id === ruleId
      ? normalizeReminderRule({
          ...rule,
          ...payload,
          id: rule.id,
          updatedAt: nowIso(),
        })
      : rule
  )

  const synced = syncInstancesForDate({ ...store, reminderRules }, getTodayDateKey())
  setStore(synced.nextStore)
}

export function toggleReminderRule(ruleId, enabled) {
  updateReminderRule(ruleId, { enabled })
}

export function deleteReminderRule(ruleId) {
  const store = getStore()

  const deletedInstanceIds = new Set(
    (store.reminderInstances || [])
      .filter((instance) => instance.ruleId === ruleId)
      .map((instance) => instance.id)
  )

  setStore({
    ...store,
    reminderRules: (store.reminderRules || []).filter((rule) => rule.id !== ruleId),
    reminderInstances: (store.reminderInstances || []).filter((instance) => instance.ruleId !== ruleId),
    intakeLogs: (store.intakeLogs || []).filter((log) => !deletedInstanceIds.has(log.reminderInstanceId)),
    reminderQueue: (store.reminderQueue || []).filter((id) => !deletedInstanceIds.has(id)),
  })
}

export function processReminderCycle() {
  const currentStore = ensureTodayReminderInstances()
  const todayKey = getTodayDateKey()
  const now = new Date()
  const nowValue = nowIso()

  const queueSet = new Set(currentStore.reminderQueue || [])
  const notifiedItems = []
  const missedInstances = []

  let changed = false

  const reminderInstances = (currentStore.reminderInstances || []).map((rawInstance) => {
    if (!(rawInstance.scheduledAt || '').startsWith(todayKey)) return rawInstance

    const instance = normalizeReminderInstance(rawInstance)
    const rule = (currentStore.reminderRules || []).find((item) => item.id === instance.ruleId)

    if (!rule || !rule.enabled) {
      if (instance.visibleStatus === 'pending') {
        changed = true
        queueSet.delete(instance.id)

        return {
          ...instance,
          visibleStatus: 'off',
          status: 'off',
          reminderStatus: 'off',
          internalStatus: 'expired',
          currentTriggerAt: instance.scheduledAt,
        }
      }

      queueSet.delete(instance.id)
      return instance
    }

    if (instance.visibleStatus !== 'pending') {
      queueSet.delete(instance.id)
      return instance
    }

    if (instance.internalStatus === 'ringing') {
      const notifiedAt = parseDateLike(instance.lastNotifiedAt || instance.notifiedAt || instance.currentTriggerAt)
      const ringingSince = notifiedAt ? notifiedAt.getTime() : now.getTime()
      const elapsedMs = now.getTime() - ringingSince

      if (elapsedMs < RING_ACK_TIMEOUT_MS) {
        queueSet.add(instance.id)
        return instance
      }

      const nextRetryCount = toNonNegativeInt(instance.retryCount, 0) + 1

      if (nextRetryCount >= rule.maxRetryCount) {
        const missed = {
          ...instance,
          retryCount: nextRetryCount,
          visibleStatus: 'missed',
          status: 'missed',
          reminderStatus: 'missed',
          internalStatus: 'expired',
          completedAt: nowValue,
        }

        changed = true
        queueSet.delete(instance.id)
        missedInstances.push(missed)
        return missed
      }

      const retrying = {
        ...instance,
        retryCount: nextRetryCount,
        internalStatus: 'retrying',
        currentTriggerAt: addMinutesToNow(rule.retryIntervalMinutes || 5),
        snoozeUntil: '',
      }

      changed = true
      queueSet.delete(instance.id)
      return retrying
    }

    const dueAt = parseDateLike(instance.currentTriggerAt || instance.scheduledAt)
    if (!dueAt) {
      queueSet.delete(instance.id)
      return instance
    }
    if (now < dueAt) {
      queueSet.delete(instance.id)
      return instance
    }

    if (instance.retryCount >= rule.maxRetryCount) {
      const next = {
        ...instance,
        visibleStatus: 'missed',
        status: 'missed',
        reminderStatus: 'missed',
        internalStatus: 'expired',
        completedAt: nowValue,
      }

      changed = true
      queueSet.delete(instance.id)
      missedInstances.push(next)
      return next
    }

    const ringing = {
      ...instance,
      internalStatus: 'ringing',
      lastNotifiedAt: nowValue,
      notifiedAt: nowValue,
      reminderStatus: 'pending',
      status: 'pending',
    }

    queueSet.add(instance.id)
    changed = true

    const medication = (currentStore.medications || []).find((item) => item.id === instance.medicationId)

    notifiedItems.push({
      instanceId: instance.id,
      medId: instance.medicationId,
      drugName: medication?.drugName || '药品',
    })

    return ringing
  })

  if (!changed) {
    return {
      store: currentStore,
      notifiedItems,
      changed: false,
    }
  }

  let nextStore = {
    ...currentStore,
    reminderInstances,
    reminderQueue: Array.from(queueSet),
  }

  missedInstances.forEach((instance) => {
    nextStore = upsertFinalLogForInstance(nextStore, instance)
  })

  setStore(nextStore)

  return {
    store: nextStore,
    notifiedItems,
    changed: true,
  }
}

export function triggerReminderNow(reminderId) {
  const store = getStore()
  const queueSet = new Set(store.reminderQueue || [])
  const nowValue = nowIso()

  const { changed, nextStore } = withInstanceUpdate(store, reminderId, (instance) => ({
    ...instance,
    visibleStatus: 'pending',
    status: 'pending',
    reminderStatus: 'pending',
    internalStatus: 'ringing',
    currentTriggerAt: nowValue,
    lastNotifiedAt: nowValue,
    notifiedAt: nowValue,
  }))

  if (!changed) return

  queueSet.add(reminderId)
  setStore({
    ...nextStore,
    reminderQueue: Array.from(queueSet),
  })
}

export function postponeReminderBeforeRing(reminderId, minutes = 5) {
  const store = getStore()

  const target = (store.reminderInstances || []).find((instance) => instance.id === reminderId)
  if (!target) return false

  if (target.visibleStatus !== 'pending') return false
  if (target.internalStatus === 'ringing') return false

  const base = new Date(target.currentTriggerAt || target.scheduledAt)
  const nextTriggerAt = toLocalDateTime(new Date(base.getTime() + Number(minutes || 5) * 60 * 1000))

  const { changed, nextStore } = withInstanceUpdate(store, reminderId, (instance) => ({
    ...instance,
    currentTriggerAt: nextTriggerAt,
    internalStatus: 'waiting',
    snoozeUntil: '',
    visibleStatus: 'pending',
    status: 'pending',
    reminderStatus: 'pending',
  }))

  if (!changed) return false

  setStore(nextStore)
  return true
}

export function markReminderTaken(reminderId) {
  const store = getStore()
  const queueSet = new Set(store.reminderQueue || [])
  const completedAt = nowIso()

  const { changed, updated, nextStore } = withInstanceUpdate(store, reminderId, (instance) => ({
    ...instance,
    visibleStatus: 'taken',
    status: 'taken',
    reminderStatus: 'taken',
    internalStatus: 'completed',
    completedAt,
    takenAt: completedAt,
  }))

  if (!changed || !updated) return

  queueSet.delete(reminderId)
  let mergedStore = {
    ...nextStore,
    reminderQueue: Array.from(queueSet),
  }

  mergedStore = upsertFinalLogForInstance(mergedStore, updated)
  setStore(mergedStore)
}

export function skipReminder(reminderId) {
  const store = getStore()
  const queueSet = new Set(store.reminderQueue || [])
  const completedAt = nowIso()

  const { changed, updated, nextStore } = withInstanceUpdate(store, reminderId, (instance) => ({
    ...instance,
    visibleStatus: 'skipped',
    status: 'skipped',
    reminderStatus: 'skipped',
    internalStatus: 'completed',
    completedAt,
  }))

  if (!changed || !updated) return

  queueSet.delete(reminderId)
  let mergedStore = {
    ...nextStore,
    reminderQueue: Array.from(queueSet),
  }

  mergedStore = upsertFinalLogForInstance(mergedStore, updated)
  setStore(mergedStore)
}

export function markReminderMissed(reminderId) {
  const store = getStore()
  const queueSet = new Set(store.reminderQueue || [])
  const completedAt = nowIso()

  const { changed, updated, nextStore } = withInstanceUpdate(store, reminderId, (instance) => ({
    ...instance,
    visibleStatus: 'missed',
    status: 'missed',
    reminderStatus: 'missed',
    internalStatus: 'expired',
    completedAt,
  }))

  if (!changed || !updated) return

  queueSet.delete(reminderId)
  let mergedStore = {
    ...nextStore,
    reminderQueue: Array.from(queueSet),
  }

  mergedStore = upsertFinalLogForInstance(mergedStore, updated)
  setStore(mergedStore)
}

export function resetReminderToPending(reminderId) {
  const store = getStore()
  const queueSet = new Set(store.reminderQueue || [])
  const target = (store.reminderInstances || []).find((instance) => instance.id === reminderId)
  if (!target) return { ok: false, reason: 'missing' }

  const rule = (store.reminderRules || []).find((item) => item.id === target.ruleId)
  if (!rule?.enabled) return { ok: false, reason: 'disabled' }

  const now = new Date()
  const scheduled = new Date(target.scheduledAt || nowIso())
  const retryMinutes = Math.max(1, Number(rule.retryIntervalMinutes || 5))
  const nextTriggerAt = scheduled.getTime() > now.getTime()
    ? toLocalDateTime(scheduled)
    : toLocalDateTime(new Date(now.getTime() + retryMinutes * 60 * 1000))

  const { changed, nextStore } = withInstanceUpdate(store, reminderId, (instance) => ({
    ...instance,
    visibleStatus: 'pending',
    status: 'pending',
    reminderStatus: 'pending',
    internalStatus: 'waiting',
    currentTriggerAt: nextTriggerAt,
    retryCount: 0,
    completedAt: '',
    takenAt: '',
    snoozeUntil: '',
  }))

  if (!changed) return { ok: false, reason: 'unchanged' }

  queueSet.delete(reminderId)

  setStore({
    ...nextStore,
    reminderQueue: Array.from(queueSet),
    intakeLogs: (nextStore.intakeLogs || []).filter((log) => log.reminderInstanceId !== reminderId),
  })

  return { ok: true }
}

export function snoozeReminder(reminderId, minutes) {
  const store = getStore()
  const queueSet = new Set(store.reminderQueue || [])

  const target = (store.reminderInstances || []).find((instance) => instance.id === reminderId)
  if (!target) return

  const rule = (store.reminderRules || []).find((item) => item.id === target.ruleId)
  const delayMinutes = Number(minutes || rule?.retryIntervalMinutes || 5)

  const nextRetryCount = toNonNegativeInt(target.retryCount, 0) + 1
  const nextTriggerAt = addMinutesToNow(delayMinutes)

  const { changed, nextStore } = withInstanceUpdate(store, reminderId, (instance) => ({
    ...instance,
    retryCount: nextRetryCount,
    internalStatus: 'retrying',
    currentTriggerAt: nextTriggerAt,
    snoozeUntil: nextTriggerAt,
    visibleStatus: 'pending',
    status: 'pending',
    reminderStatus: 'pending',
  }))

  if (!changed) return

  queueSet.delete(reminderId)
  setStore({
    ...nextStore,
    reminderQueue: Array.from(queueSet),
  })
}

export function markAllTodayTaken() {
  const store = ensureTodayReminderInstances()
  const todayKey = getTodayDateKey()
  const queueSet = new Set(store.reminderQueue || [])
  const completedAt = nowIso()

  let changed = false
  let nextStore = { ...store }

  const reminderInstances = (store.reminderInstances || []).map((instance) => {
    if (!(instance.scheduledAt || '').startsWith(todayKey)) return instance
    if (instance.visibleStatus !== 'pending') return instance

    changed = true
    queueSet.delete(instance.id)

    const next = {
      ...instance,
      visibleStatus: 'taken',
      status: 'taken',
      reminderStatus: 'taken',
      internalStatus: 'completed',
      completedAt,
      takenAt: completedAt,
    }

    nextStore = upsertFinalLogForInstance(nextStore, next)
    return next
  })

  if (!changed) return

  setStore({
    ...nextStore,
    reminderInstances,
    reminderQueue: Array.from(queueSet),
  })
}

export function upsertIntakeLog(payload) {
  const store = getStore()

  const nextLog = normalizeIntakeLog(payload)
  const existingIndex = (store.intakeLogs || []).findIndex((item) => item.id === nextLog.id)

  const intakeLogs = [...(store.intakeLogs || [])]
  if (existingIndex >= 0) {
    intakeLogs[existingIndex] = nextLog
  } else {
    intakeLogs.unshift(nextLog)
  }

  setStore({
    ...store,
    intakeLogs,
  })
}

export function updateMedicationStock(medicationId, addQty) {
  const store = getStore()

  const medications = (store.medications || []).map((medication) =>
    medication.id === medicationId
      ? {
          ...medication,
          stockQty: Number(medication.stockQty || 0) + Number(addQty || 0),
        }
      : medication
  )

  setStore({
    ...store,
    medications,
  })
}

export function updateUserProfile(payload) {
  const store = getStore()

  const userProfile = normalizeUserProfile({
    ...(store.userProfile || {}),
    ...payload,
  })

  setStore({
    ...store,
    userProfile,
  })
}

export function getOnboardingProgress(storeArg) {
  const store = storeArg || getStore()
  const synced = applyOnboardingProgressToStore(store)

  return {
    completedCount: synced.progress.completedCount,
    onboardingCompleted: synced.progress.onboardingCompleted,
    recommendedStepIndex: synced.progress.recommendedStepIndex,
    currentStepIndex: synced.experienceState.currentOnboardingStep,
    onboardingDismissed: Boolean(synced.experienceState.onboardingDismissed),
    stepCompleted: synced.progress.stepCompleted,
  }
}

export function syncOnboardingProgress() {
  const store = getStore()
  const synced = applyOnboardingProgressToStore(store)

  if (synced.changed) {
    setStore(synced.nextStore)
    return synced.nextStore
  }

  return store
}

export function updateExperienceState(payload = {}) {
  const store = getStore()
  const current = normalizeExperienceState(store.experienceState || {})
  const merged = normalizeExperienceState({
    ...current,
    ...payload,
  })

  const synced = applyOnboardingProgressToStore({
    ...store,
    experienceState: merged,
  })

  setStore(synced.nextStore)
  return synced.nextStore.experienceState
}

export function setOnboardingDismissed(dismissed) {
  return updateExperienceState({
    onboardingDismissed: Boolean(dismissed),
  })
}

export function setCurrentOnboardingStep(step) {
  return updateExperienceState({
    currentOnboardingStep: Math.min(toNonNegativeInt(step, 0), ONBOARDING_STEP_COUNT - 1),
  })
}

export function markExperienceVisited(stepKey) {
  const keyMap = {
    consult: 'consultViewed',
    consultViewed: 'consultViewed',
    purchase: 'purchaseViewed',
    purchaseViewed: 'purchaseViewed',
  }

  const targetKey = keyMap[stepKey]
  if (!targetKey) return

  const store = syncOnboardingProgress()
  const experienceState = normalizeExperienceState(store.experienceState || {})

  if (experienceState[targetKey]) return

  updateExperienceState({
    [targetKey]: true,
  })
}

function buildDefenseDemoStore() {
  const now = new Date()
  const todayKey = toDateKey(now)
  const dayKeys = Array.from({ length: 7 }).map((_, index) => toDateKey(addDays(now, -6 + index)))

  const medications = [
    normalizeMedication({
      id: 'med-1',
      drugName: '缬沙坦片',
      spec: '80mg*14片',
      dose: 1,
      unit: '片',
      withMeal: '饭后',
      stockQty: 4,
      stockUnit: '片',
      startDate: dayKeys[0],
      endDate: '',
      sourceLabel: '处方导入',
    }),
    normalizeMedication({
      id: 'med-2',
      drugName: '二甲双胍片',
      spec: '500mg*60片',
      dose: 1,
      unit: '片',
      withMeal: '饭中',
      stockQty: 88,
      stockUnit: '片',
      startDate: dayKeys[0],
      endDate: '',
      sourceLabel: '处方导入',
    }),
    normalizeMedication({
      id: 'med-3',
      drugName: '阿托伐他汀钙片',
      spec: '20mg*7片',
      dose: 1,
      unit: '片',
      withMeal: '睡前',
      stockQty: 18,
      stockUnit: '片',
      startDate: dayKeys[0],
      endDate: '',
      sourceLabel: '手动录入',
    }),
  ]

  const reminderRules = [
    normalizeReminderRule({
      id: 'rule-1',
      medicationId: 'med-1',
      time: '08:00',
      enabled: true,
      repeatDays: DEFAULT_REPEAT_DAYS,
      retryIntervalMinutes: 5,
      maxRetryCount: 3,
    }),
    normalizeReminderRule({
      id: 'rule-2',
      medicationId: 'med-2',
      time: '08:00',
      enabled: true,
      repeatDays: DEFAULT_REPEAT_DAYS,
      retryIntervalMinutes: 10,
      maxRetryCount: 3,
    }),
    normalizeReminderRule({
      id: 'rule-3',
      medicationId: 'med-2',
      time: '20:00',
      enabled: true,
      repeatDays: DEFAULT_REPEAT_DAYS,
      retryIntervalMinutes: 10,
      maxRetryCount: 3,
    }),
    normalizeReminderRule({
      id: 'rule-4',
      medicationId: 'med-3',
      time: '21:00',
      enabled: true,
      repeatDays: DEFAULT_REPEAT_DAYS,
      retryIntervalMinutes: 15,
      maxRetryCount: 5,
    }),
  ]

  const missedKeys = new Set([
    `${dayKeys[2]}|rule-1`,
    `${dayKeys[4]}|rule-3`,
  ])

  const intakeLogs = []
  const reminderInstances = []

  let seq = 1

  reminderRules.forEach((rule) => {
    dayKeys.forEach((dateKey) => {
      const scheduledAt = toDateTime(dateKey, rule.time)
      const key = `${dateKey}|${rule.id}`

      let visibleStatus = 'taken'
      let internalStatus = 'completed'
      let currentTriggerAt = scheduledAt
      let completedAt = scheduledAt

      if (missedKeys.has(key)) {
        visibleStatus = 'missed'
        internalStatus = 'expired'
        completedAt = scheduledAt
      }

      if (dateKey === todayKey) {
        if (rule.id === 'rule-1') {
          visibleStatus = 'taken'
          internalStatus = 'completed'
          completedAt = toDateTime(todayKey, '08:03')
        } else if (rule.id === 'rule-2') {
          visibleStatus = 'pending'
          internalStatus = 'waiting'
          currentTriggerAt = addMinutesToNow(3)
          completedAt = ''
        } else if (rule.id === 'rule-3') {
          visibleStatus = 'pending'
          internalStatus = 'waiting'
          currentTriggerAt = addMinutesToNow(25)
          completedAt = ''
        } else if (rule.id === 'rule-4') {
          visibleStatus = 'skipped'
          internalStatus = 'completed'
          completedAt = addMinutesToNow(-30)
        }
      }

      const instance = normalizeReminderInstance({
        id: `demo-instance-${seq}`,
        ruleId: rule.id,
        medicationId: rule.medicationId,
        scheduledAt,
        currentTriggerAt,
        retryCount: 0,
        internalStatus,
        visibleStatus,
        completedAt,
        lastNotifiedAt: '',
      })

      reminderInstances.push(instance)

      if (FINAL_VISIBLE_STATUS_SET.has(visibleStatus)) {
        intakeLogs.push(
          normalizeIntakeLog({
            id: `demo-log-${seq}`,
            medicationId: rule.medicationId,
            medId: rule.medicationId,
            reminderInstanceId: instance.id,
            scheduledAt,
            takenAt: visibleStatus === 'taken' ? completedAt : '',
            status: visibleStatus,
            reason: visibleStatus === 'missed' && key === `${dayKeys[4]}|rule-3`
              ? '晚间外出，未及时服药'
              : '',
          })
        )
      }

      seq += 1
    })
  })

  return normalizeStoreSchema({
    medications,
    reminderRules,
    reminderInstances,
    intakeLogs,
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
      note: '近3个月血压与空腹血糖波动，需规律复诊。',
    },
    adverseEvents: [
      {
        id: 'ae-1',
        medId: 'med-3',
        eventTime: `${dayKeys[5]}T21:20`,
        symptom: '轻微头晕，已自行缓解',
        severity: 'mild',
        note: '未影响次日活动。',
      },
    ],
    demoMeta: {
      mode: 'defense',
      generatedAt: nowIso(),
      label: '答辩演示数据',
    },
  })
}

export function clearStoreForDemo() {
  window.localStorage.removeItem(STORAGE_KEY)
  initStore()
  emitStoreUpdated()
}

export function generateDefenseDemoData() {
  const store = buildDefenseDemoStore()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  emitStoreUpdated()
}

export function restoreReminderDemoData() {
  generateDefenseDemoData()
  ensureTodayReminderInstances()
  processReminderCycle()
}
