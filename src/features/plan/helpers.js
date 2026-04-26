const MEDICATION_COLORS = ['#E8B4B8', '#A8D5BA', '#B4C7E8', '#D7C8EB', '#F2CEA2', '#A9D8E6']

function toPositiveNumber(value, fallback = 1) {
  const next = Number(value)
  if (Number.isNaN(next) || next <= 0) return fallback
  return next
}

function toDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function hashText(input = '') {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function resolveDailyFrequency(medication, reminderRules) {
  const enabledRules = (reminderRules || []).filter((rule) => rule.enabled && rule.medicationId === medication.id)
  if (enabledRules.length > 0) {
    const daily = enabledRules.reduce((sum, rule) => {
      const repeatDays = Array.isArray(rule.repeatDays) && rule.repeatDays.length > 0 ? rule.repeatDays.length : 7
      return sum + repeatDays / 7
    }, 0)
    return toPositiveNumber(daily, 1)
  }

  if (Number(medication.frequencyPerDay) > 0) return Number(medication.frequencyPerDay)
  if (Array.isArray(medication.times) && medication.times.length > 0) return medication.times.length
  return 1
}

function buildRecentWindowRange() {
  const now = new Date()
  const start = addDays(now, -6)
  return {
    startKey: toDateKey(start),
    endKey: toDateKey(now),
  }
}

function buildMedicationAdherenceMap(store) {
  const { startKey, endKey } = buildRecentWindowRange()
  const stats = new Map()

  ;(store.reminderInstances || []).forEach((instance) => {
    const dateKey = (instance.scheduledAt || '').slice(0, 10)
    if (!dateKey || dateKey < startKey || dateKey > endKey) return
    if (!instance.medicationId) return
    if (instance.visibleStatus === 'off') return

    const current = stats.get(instance.medicationId) || { expected: 0, taken: 0, missed: 0 }
    current.expected += 1

    if (instance.visibleStatus === 'taken') current.taken += 1
    if (instance.visibleStatus === 'missed') current.missed += 1

    stats.set(instance.medicationId, current)
  })

  return stats
}

export function getMedicationColor(medication) {
  const seed = hashText(`${medication.id}|${medication.drugName}`)
  return MEDICATION_COLORS[seed % MEDICATION_COLORS.length]
}

export function enrichMedications(store) {
  const adherenceMap = buildMedicationAdherenceMap(store)
  const medications = store.medications || []
  const reminderRules = store.reminderRules || []

  return medications.map((medication) => {
    const frequency = resolveDailyFrequency(medication, reminderRules)
    const dailyUse = toPositiveNumber(medication.dose, 1) * frequency
    const stockQty = Number(medication.stockQty || 0)
    const stockDays = Math.max(0, Math.floor(stockQty / toPositiveNumber(dailyUse, 1)))

    const adherenceStat = adherenceMap.get(medication.id) || { expected: 0, taken: 0, missed: 0 }
    const adherence = adherenceStat.expected > 0
      ? Math.round((adherenceStat.taken / adherenceStat.expected) * 100)
      : 100

    let status = 'normal'
    if (stockDays <= 7) {
      status = 'low-stock'
    } else if (adherence < 85 || adherenceStat.missed > 0) {
      status = 'missed'
    }

    let aiTip = ''
    if (status === 'low-stock') {
      aiTip = `库存仅剩 ${stockDays} 天用量，建议提前续方`
    } else if (status === 'missed') {
      aiTip = `近7日依从率 ${adherence}%，建议优化提醒时间并复盘漏服原因`
    }

    const lastMissed = adherenceStat.missed > 0 ? `近7日漏服 ${adherenceStat.missed} 次` : ''

    return {
      ...medication,
      color: getMedicationColor(medication),
      dailyUse: Number(dailyUse.toFixed(2)),
      stockDays,
      adherence,
      status,
      aiTip,
      lastMissed,
    }
  })
}

export function splitMedicationGroups(enrichedMedications) {
  const attention = enrichedMedications.filter((medication) => medication.status === 'low-stock' || medication.status === 'missed')
  const normal = enrichedMedications.filter((medication) => medication.status === 'normal')

  return { attention, normal }
}

export function getPlanSummary(enrichedMedications) {
  const needsAttention = enrichedMedications.filter((medication) => medication.status !== 'normal').length
  const avgAdherence = enrichedMedications.length > 0
    ? Math.round(enrichedMedications.reduce((sum, item) => sum + item.adherence, 0) / enrichedMedications.length)
    : 100

  return {
    totalMedications: enrichedMedications.length,
    needsAttention,
    avgAdherence,
  }
}

export function getTopInsight(enrichedMedications) {
  const lowStock = enrichedMedications.find((medication) => medication.status === 'low-stock')
  if (lowStock) {
    return `${lowStock.drugName}库存不足，建议提前续方`
  }

  const missed = enrichedMedications.find((medication) => medication.status === 'missed')
  if (missed) {
    return `${missed.drugName}近期依从率偏低，建议调整提醒时间`
  }

  if (enrichedMedications.length > 0) {
    return '当前用药执行稳定，建议维持现有药品计划'
  }

  return '暂无药品数据，建议先新增药品或导入处方'
}

export function mapMedicationToForm(medication, fallbackDate) {
  return {
    drugName: medication.drugName || '',
    spec: medication.spec || '',
    dose: medication.dose || 1,
    unit: medication.unit || '片',
    withMeal: medication.withMeal || '饭后',
    stockQty: medication.stockQty || 0,
    stockUnit: medication.stockUnit || '片',
    startDate: medication.startDate || fallbackDate,
    endDate: medication.endDate || '',
    sourceLabel: medication.sourceLabel || '手动录入',
  }
}
