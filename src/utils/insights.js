function toDateKey(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDateFromKey(key) {
  return new Date(`${key}T00:00:00`)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toMinutes(time) {
  const [hour, minute] = (time || '00:00').split(':').map(Number)
  return hour * 60 + minute
}

function formatMonthDay(dateKey) {
  const date = toDateFromKey(dateKey)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
}

function getDefaultProfile() {
  return {
    name: '张先生',
    age: 58,
    gender: '男',
    diseases: ['高血压', '2型糖尿病'],
    diagnosisDate: '待补充',
    note: '当前为基础 mock 数据。',
  }
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
    : [0, 1, 2, 3, 4, 5, 6]

  return repeatDays.includes(day)
}

function resolveContext(input, logsInput) {
  if (input && typeof input === 'object' && Array.isArray(input.medications)) {
    return {
      medications: input.medications || [],
      reminderRules: input.reminderRules || [],
      reminderInstances: input.reminderInstances || [],
      intakeLogs: input.intakeLogs || [],
      adverseEvents: input.adverseEvents || [],
      userProfile: input.userProfile || getDefaultProfile(),
    }
  }

  return {
    medications: Array.isArray(input) ? input : [],
    reminderRules: [],
    reminderInstances: [],
    intakeLogs: Array.isArray(logsInput) ? logsInput : [],
    adverseEvents: [],
    userProfile: getDefaultProfile(),
  }
}

function normalizeEventStatus(status) {
  if (status === 'scheduled' || status === 'notified' || status === 'snoozed' || status === 'pending') return 'pending'
  if (status === 'off' || status === 'closed') return 'off'
  if (status === 'taken') return 'taken'
  if (status === 'missed') return 'missed'
  if (status === 'skipped') return 'skipped'
  return 'pending'
}

function collectReminderEvents(context) {
  const fromInstances = (context.reminderInstances || []).map((instance) => ({
    medicationId: instance.medicationId || instance.medId || '',
    reminderInstanceId: instance.id,
    scheduledAt: instance.scheduledAt,
    status: normalizeEventStatus(instance.visibleStatus || instance.status || instance.reminderStatus),
    reason: '',
  }))

  const existingInstanceIdSet = new Set(fromInstances.map((item) => item.reminderInstanceId))

  const fromLogs = (context.intakeLogs || []).map((log) => ({
    medicationId: log.medicationId || log.medId || '',
    reminderInstanceId: log.reminderInstanceId || '',
    scheduledAt: log.scheduledAt,
    status: normalizeEventStatus(log.status || log.reminderStatus),
    reason: log.reason || '',
  }))

  const merged = [...fromInstances]

  fromLogs.forEach((log) => {
    if (log.reminderInstanceId && existingInstanceIdSet.has(log.reminderInstanceId)) {
      const targetIndex = merged.findIndex((item) => item.reminderInstanceId === log.reminderInstanceId)
      if (targetIndex >= 0) {
        merged[targetIndex] = {
          ...merged[targetIndex],
          status: log.status,
          reason: log.reason,
        }
      }
      return
    }

    merged.push(log)
  })

  return merged.filter((item) => item.scheduledAt)
}

function expectedCountByRules(context, dateKey) {
  const medications = context.medications || []

  return (context.reminderRules || []).reduce((sum, rule) => {
    if (!rule.enabled) return sum
    const medication = medications.find((item) => item.id === rule.medicationId)
    if (!medication) return sum
    if (!isMedicationActiveOnDate(medication, dateKey)) return sum
    if (!isRuleEnabledOnDate(rule, dateKey)) return sum
    return sum + 1
  }, 0)
}

function getWeekDateKeys() {
  const endDate = new Date()
  const startDate = addDays(endDate, -6)

  return Array.from({ length: 7 }).map((_, index) => toDateKey(addDays(startDate, index)))
}

function getDailyStats(context, dateKey, events) {
  const dayEvents = events.filter((item) => (item.scheduledAt || '').startsWith(dateKey))

  const expectedFromEvents = dayEvents.filter((item) => item.status !== 'off').length
  const expectedFromRules = expectedCountByRules(context, dateKey)
  const expected = Math.max(expectedFromEvents, expectedFromRules)

  const taken = dayEvents.filter((item) => item.status === 'taken').length
  const missed = dayEvents.filter((item) => item.status === 'missed').length
  const skipped = dayEvents.filter((item) => item.status === 'skipped').length
  const pending = Math.max(0, expected - taken - missed - skipped)
  const adherence = expected === 0 ? 100 : Math.round((taken / expected) * 100)

  return {
    dateKey,
    expected,
    taken,
    missed,
    skipped,
    pending,
    adherence,
  }
}

function resolveMedicationFrequency(medication, rulesForMedication = []) {
  if (rulesForMedication.length > 0) {
    const dailyCount = rulesForMedication.reduce((sum, rule) => {
      const repeatDays = Array.isArray(rule.repeatDays) && rule.repeatDays.length > 0
        ? rule.repeatDays.length
        : 7

      return sum + repeatDays / 7
    }, 0)

    return dailyCount > 0 ? dailyCount : 1
  }

  if (Number(medication.frequencyPerDay) > 0) return Number(medication.frequencyPerDay)
  if (Array.isArray(medication.times) && medication.times.length > 0) return medication.times.length
  return 1
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function buildTodaySchedule(input, logsInput) {
  const context = resolveContext(input, logsInput)
  const todayKey = toDateKey(new Date())
  const events = collectReminderEvents(context)

  const rows = (context.reminderRules || []).map((rule) => {
    const medication = (context.medications || []).find((item) => item.id === rule.medicationId)
    if (!medication) return null
    if (!isMedicationActiveOnDate(medication, todayKey)) return null
    if (!isRuleEnabledOnDate(rule, todayKey)) return null

    const scheduledAt = `${todayKey}T${rule.time}`

    const event = events.find(
      (item) => item.medicationId === medication.id && item.scheduledAt === scheduledAt
    )

    const status = rule.enabled ? (event?.status || 'pending') : 'off'

    return {
      id: `${rule.id}-${todayKey}`,
      medId: medication.id,
      drugName: medication.drugName,
      doseText: `${medication.dose}${medication.unit}`,
      withMeal: medication.withMeal,
      time: rule.time,
      scheduledAt,
      status,
      takenAt: event?.status === 'taken' ? (event.takenAt || '') : '',
    }
  }).filter(Boolean)

  return rows.sort((a, b) => (a.time > b.time ? 1 : -1))
}

export function getRecentLogs(input, logsInput, days = 7) {
  const context = resolveContext(input, logsInput)
  const events = collectReminderEvents(context)

  const endDate = new Date()
  const startDate = addDays(endDate, -(days - 1))
  const startKey = toDateKey(startDate)
  const endKey = toDateKey(endDate)

  return events.filter((event) => {
    const dateKey = (event.scheduledAt || '').slice(0, 10)
    return dateKey >= startKey && dateKey <= endKey
  })
}

export function calculateSevenDayAdherence(input, logsInput) {
  const context = resolveContext(input, logsInput)
  const events = collectReminderEvents(context)
  const dayKeys = getWeekDateKeys()

  const totals = dayKeys.reduce((acc, dateKey) => {
    const stat = getDailyStats(context, dateKey, events)
    return {
      expected: acc.expected + stat.expected,
      takenCount: acc.takenCount + stat.taken,
      missedCount: acc.missedCount + stat.missed,
      skippedCount: acc.skippedCount + stat.skipped,
      pendingCount: acc.pendingCount + stat.pending,
    }
  }, {
    expected: 0,
    takenCount: 0,
    missedCount: 0,
    skippedCount: 0,
    pendingCount: 0,
  })

  const adherence = totals.expected === 0
    ? 100
    : Math.round((totals.takenCount / totals.expected) * 100)

  return {
    expected: totals.expected,
    takenCount: totals.takenCount,
    missedCount: totals.missedCount,
    skippedCount: totals.skippedCount,
    pendingCount: totals.pendingCount,
    adherence,
  }
}

export function getSevenDayTrendData(input, logsInput) {
  const context = resolveContext(input, logsInput)
  const events = collectReminderEvents(context)

  return getWeekDateKeys().map((dateKey) => {
    const stat = getDailyStats(context, dateKey, events)

    return {
      dateKey,
      label: formatMonthDay(dateKey),
      expected: stat.expected,
      taken: stat.taken,
      missed: stat.missed,
      adherence: stat.adherence,
    }
  })
}

export function getLateNightMissedCount(input, logsInput) {
  const context = resolveContext(input, logsInput)
  const events = collectReminderEvents(context)

  return events.filter((event) => {
    if (event.status !== 'missed') return false
    const parsed = new Date(event.scheduledAt || '')
    const time = Number.isNaN(parsed.getTime())
      ? (event.scheduledAt || '').slice(11, 16)
      : `${`${parsed.getHours()}`.padStart(2, '0')}:${`${parsed.getMinutes()}`.padStart(2, '0')}`
    return toMinutes(time) >= 20 * 60
  }).length
}

export function getAiSuggestion(input, logsInput) {
  const summary = calculateSevenDayAdherence(input, logsInput)
  const lateNightMissed = getLateNightMissedCount(input, logsInput)

  if (lateNightMissed >= 2) {
    return '最近7天晚间漏服较多，建议开启睡前提醒并将药盒放在床头可见位置。'
  }

  if (summary.adherence < 80) {
    return '近期总体依从率偏低，建议固定早晚两个闹钟并关联家属提醒。'
  }

  if (summary.missedCount > 0) {
    return '近期存在偶发漏服，建议在早餐后立即打卡，形成固定行为习惯。'
  }

  return '过去7天用药表现稳定，建议继续保持，并在复诊前导出用药记录。'
}

export function getUpcomingRefill(input, maybeRules = []) {
  const context = Array.isArray(input)
    ? { medications: input, reminderRules: maybeRules }
    : resolveContext(input)

  const medications = context.medications || []
  const reminderRules = context.reminderRules || []

  const enriched = medications
    .map((medication) => {
      const rulesForMedication = reminderRules.filter((rule) => rule.medicationId === medication.id && rule.enabled)
      const dailyUse = Number(medication.dose || 1) * resolveMedicationFrequency(medication, rulesForMedication)
      const safeDailyUse = dailyUse > 0 ? dailyUse : 1
      const remainingDays = Math.max(0, Math.floor(Number(medication.stockQty || 0) / safeDailyUse))

      return {
        ...medication,
        dailyUse: Number(safeDailyUse.toFixed(2)),
        remainingDays,
      }
    })
    .sort((a, b) => a.remainingDays - b.remainingDays)

  return enriched[0] || null
}

export function getMockHealthMetrics(adherence) {
  const today = new Date()
  const daySeed = Number(toDateKey(today).replace(/-/g, '').slice(-2))
  const systolic = 118 + (daySeed % 7)
  const diastolic = 73 + (daySeed % 6)
  const glucose = (5.2 + ((daySeed % 8) * 0.12)).toFixed(1)

  return {
    bloodPressure: `${systolic}/${diastolic}`,
    bloodSugar: `${glucose} mmol/L`,
    adherence: `${adherence}%`,
  }
}

export function getConsultSummary(input, logsInput) {
  const context = resolveContext(input, logsInput)
  const sevenDay = calculateSevenDayAdherence(context)
  const recentEvents = getRecentLogs(context, undefined, 7)

  const adverseFromEvents = recentEvents
    .filter((event) => Boolean(event.reason))
    .map((event) => `${event.scheduledAt.slice(0, 10)} ${event.reason}`)

  const adverseFromRecords = (context.adverseEvents || [])
    .map((event) => `${(event.eventTime || '').slice(0, 10)} ${event.symptom}`)
    .filter((line) => line.trim().length > 0)

  const adverseList = [...adverseFromRecords, ...adverseFromEvents]

  const latestMissedDate = recentEvents
    .filter((event) => event.status === 'missed')
    .map((event) => event.scheduledAt.slice(0, 10))
    .sort()
    .pop()

  const nextVisit = addDays(new Date(), sevenDay.adherence < 80 ? 5 : 14)

  const summaryText =
    sevenDay.adherence < 80
      ? '近7天依从率偏低，建议尽快复诊评估当前方案，重点沟通晚间漏服场景与提醒策略。'
      : '近7天用药整体平稳，建议按计划复诊并携带本报告，便于医生快速评估疗效。'

  return {
    ...sevenDay,
    adverseCount: adverseList.length,
    adverseText: adverseList.length > 0 ? adverseList.join('；') : '近7天未记录明确不良反应。',
    latestMissedDate: latestMissedDate || '无',
    nextVisitDate: toDateKey(nextVisit),
    aiSummary: summaryText,
  }
}

export function getDoctorReadableReport(store) {
  const context = resolveContext(store)
  const summary = getConsultSummary(context)
  const refill = getUpcomingRefill(context)
  const lateNightMissed = getLateNightMissedCount(context)

  const profile = context.userProfile || getDefaultProfile()

  let missedRisk = '低风险'
  let missedRiskDesc = '近7日漏服风险可控，继续维持现有提醒策略。'

  if (summary.adherence < 80 || lateNightMissed >= 2) {
    missedRisk = '中高风险'
    missedRiskDesc = '漏服主要集中在晚间场景，建议与患者讨论提醒方式和家属协同监督。'
  } else if (summary.missedCount > 0 || summary.adherence < 90) {
    missedRisk = '中等风险'
    missedRiskDesc = '存在零星漏服，建议复盘具体诱因并优化日常服药触发点。'
  }

  const refillAdvice = refill
    ? `${refill.drugName} 预计剩余 ${refill.remainingDays} 天，建议在 3-5 天内完成复诊续方，避免断药。`
    : '当前暂无明确续方风险。'

  const communicationFocus = [
    '确认晚间服药执行障碍（外出、遗忘、睡前作息不固定）并制定替代提醒方案。',
    '复核现有血压/血糖控制目标，结合依从率变化评估是否需要调整剂量。',
    '明确续方时间节点与购药计划，减少重复购药与断药并存的风险。',
  ]

  return {
    profile,
    adherence: summary.adherence,
    adverseText: summary.adverseText,
    missedRisk,
    missedRiskDesc,
    refillAdvice,
    communicationFocus,
    summary,
  }
}

export function buildConsultCopyText(store) {
  const report = getDoctorReadableReport(store)
  const diseases = (report.profile.diseases || []).join('、')

  return [
    '【AI复诊摘要】',
    `患者：${report.profile.name}，${report.profile.age}岁，${report.profile.gender}`,
    `慢病：${diseases}`,
    `近7日依从率：${report.adherence}%`,
    `漏服风险：${report.missedRisk}（${report.missedRiskDesc}）`,
    `不良反应：${report.adverseText}`,
    `续方建议：${report.refillAdvice}`,
    '医生沟通重点：',
    `1. ${report.communicationFocus[0]}`,
    `2. ${report.communicationFocus[1]}`,
    `3. ${report.communicationFocus[2]}`,
  ].join('\n')
}

function hashText(input = '') {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function inferUnitPerPack(spec = '') {
  const matched = String(spec).match(/[xX*×](\d+)\s*片/)
  if (matched?.[1]) return Number(matched[1])
  return 14
}

function formatPrice(seed) {
  const integer = 18 + (seed % 35)
  const decimal = (seed % 10)
  return `¥${integer}.${decimal}`
}

export function getPurchaseInsights(input, maybeRules = []) {
  const context = Array.isArray(input)
    ? { medications: input, reminderRules: maybeRules }
    : resolveContext(input)

  const medications = context.medications || []
  const reminderRules = context.reminderRules || []

  return medications.map((medication) => {
    const seed = hashText(`${medication.id}|${medication.drugName}|${medication.spec}`)
    const rulesForMedication = reminderRules.filter((rule) => rule.medicationId === medication.id && rule.enabled)
    const frequency = resolveMedicationFrequency(medication, rulesForMedication)
    const dailyUse = Math.max(1, Number(medication.dose || 1) * frequency)
    const stock = Number(medication.stockQty || 0)
    const remainingDays = Math.floor(stock / dailyUse)
    const unitPerPack = inferUnitPerPack(medication.spec)

    const lowStock = remainingDays <= 7
    const duplicateRisk = remainingDays >= 20
    const recommendPurchase = lowStock || (remainingDays > 7 && remainingDays <= 14)
    const targetDays = lowStock ? 30 : 20
    const recommendPurchaseQty = recommendPurchase
      ? Math.max(unitPerPack, Math.ceil((targetDays * dailyUse - stock) / unitPerPack) * unitPerPack)
      : 0

    const pharmacyStockStates = ['库存充足', '库存紧张', '仅剩少量']
    const etaOptions = ['预计30分钟送达', '预计45分钟送达', '预计60分钟送达']
    const pharmacyStock = lowStock
      ? pharmacyStockStates[seed % 2]
      : pharmacyStockStates[seed % pharmacyStockStates.length]
    const deliveryEta = etaOptions[seed % etaOptions.length]

    const tags = ['慢病常备']
    if (lowStock) {
      tags.push('即将不足')
      tags.push('AI推荐补货')
    } else if (duplicateRisk) {
      tags.push('重复购药风险')
    } else {
      tags.push('库存稳态')
    }

    const riskLabel = lowStock
      ? '建议补货'
      : duplicateRisk
        ? '暂不建议购买'
        : '可按需备药'

    return {
      ...medication,
      dailyUse: Number(dailyUse.toFixed(2)),
      remainingDays,
      lowStock,
      duplicateRisk,
      recommendPurchase,
      recommendPurchaseQty,
      unitPerPack,
      mockPrice: formatPrice(seed),
      pharmacyStock,
      deliveryEta,
      riskLabel,
      tags,
      riskMessage: lowStock
        ? `${medication.drugName} 预计 ${Math.max(remainingDays, 0)} 天后用完，建议优先补货并发起续方。`
        : duplicateRisk
          ? `${medication.drugName} 当前库存可用 ${remainingDays} 天，暂不建议重复购药。`
          : `${medication.drugName} 库存预计可用 ${remainingDays} 天，当前购药风险较低。`,
    }
  })
}

export function getWeekWindowLabel() {
  const end = new Date()
  const start = addDays(end, -6)

  const startText = `${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
  const endText = `${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`

  return `${startText} ~ ${endText}`
}
