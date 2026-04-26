import { riskLevelStyle } from './constants'

function parseDateSafe(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function parseHour(value) {
  const date = parseDateSafe(value)
  if (date) return date.getHours()

  const time = String(value || '').split('T')[1] || ''
  const hour = Number(time.slice(0, 2))
  return Number.isNaN(hour) ? 0 : hour
}

function toRate(taken, expected) {
  if (!expected) return 0
  return Math.round((taken / expected) * 100)
}

export function copyByExecCommand(text) {
  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', 'true')
  input.style.position = 'fixed'
  input.style.left = '-9999px'
  document.body.appendChild(input)
  input.select()
  const result = document.execCommand('copy')
  document.body.removeChild(input)
  return result
}

export function deriveRiskLevel(summary, lateNightMissed) {
  if (summary.adherence < 75 || lateNightMissed >= 3 || summary.missedCount >= 3) return 'high'
  if (summary.adherence < 90 || lateNightMissed >= 1 || summary.missedCount >= 1) return 'medium'
  return 'low'
}

export function buildRiskMeta(summary, lateNightMissed) {
  const level = deriveRiskLevel(summary, lateNightMissed)
  const style = riskLevelStyle[level]
  const scoreRaw = Math.round(summary.adherence - summary.missedCount * 6 - lateNightMissed * 4 + 8)
  const score = Math.max(45, Math.min(scoreRaw, 98))

  return {
    level,
    score,
    ...style,
  }
}

export function buildRiskItems({ summary, lateNightMissed, refill }) {
  const items = []

  if (lateNightMissed >= 1) {
    items.push({
      id: 'night-missed',
      level: lateNightMissed >= 2 ? 'high' : 'medium',
      icon: 'clock',
      title: '晚间漏服风险',
      desc: `近7天晚间漏服 ${lateNightMissed} 次，建议调整睡前提醒节奏。`,
      actionLabel: '调整提醒',
      target: '/reminders',
    })
  }

  if (summary.adherence < 90) {
    items.push({
      id: 'adherence-down',
      level: summary.adherence < 80 ? 'high' : 'medium',
      icon: 'adherence',
      title: '依从率下滑',
      desc: `近7日依从率 ${summary.adherence}%，建议复盘漏服诱因并优化提醒策略。`,
      actionLabel: '查看提醒',
      target: '/reminders',
    })
  }

  if (refill && refill.remainingDays <= 7) {
    items.push({
      id: 'refill-risk',
      level: refill.remainingDays <= 3 ? 'high' : 'medium',
      icon: 'purchase',
      title: '续方购药风险',
      desc: `${refill.drugName} 预计剩余 ${refill.remainingDays} 天，建议尽快续方补货。`,
      actionLabel: '去购药',
      target: '/purchase',
    })
  }

  if (items.length === 0) {
    items.push({
      id: 'stable',
      level: 'low',
      icon: 'ai',
      title: '当前风险可控',
      desc: '近7天服药表现稳定，建议维持当前计划并按期复诊。',
      actionLabel: '查看报告',
      target: '/consult',
    })
  }

  return items.slice(0, 3)
}

export function buildTimeDistribution(events) {
  const buckets = {
    morning: { label: '早间', expected: 0, taken: 0, tone: 'bg-emerald-500' },
    noon: { label: '中午', expected: 0, taken: 0, tone: 'bg-cyan-500' },
    evening: { label: '晚间', expected: 0, taken: 0, tone: 'bg-amber-500' },
  }

  ;(events || []).forEach((event) => {
    const hour = parseHour(event.scheduledAt)
    const key = hour < 11 ? 'morning' : hour < 17 ? 'noon' : 'evening'
    const bucket = buckets[key]
    if (!bucket) return

    if (event.status !== 'off') bucket.expected += 1
    if (event.status === 'taken') bucket.taken += 1
  })

  return Object.values(buckets).map((bucket) => ({
    ...bucket,
    rate: toRate(bucket.taken, bucket.expected),
  }))
}

export function resolveWeakestBucket(buckets) {
  if (!Array.isArray(buckets) || buckets.length === 0) return '暂无数据'

  const withData = buckets.filter((item) => item.expected > 0)
  if (withData.length === 0) return '暂无数据'

  const weakest = withData.reduce((acc, current) => (current.rate < acc.rate ? current : acc), withData[0])
  return weakest.label
}

export function buildSummaryPoints({ summary, refill }) {
  const points = []

  if (summary.missedCount > 0) {
    points.push({
      type: 'warning',
      text: `近7天共漏服 ${summary.missedCount} 次，最近漏服日期：${summary.latestMissedDate}。`,
    })
  } else {
    points.push({
      type: 'success',
      text: '近7天未出现漏服，当前服药执行稳定。',
    })
  }

  points.push({
    type: summary.adherence >= 90 ? 'success' : 'warning',
    text: `整体依从率 ${summary.adherence}%，${summary.adherence >= 90 ? '建议保持当前计划。' : '建议优化提醒时段并增加复盘。'}`,
  })

  points.push({
    type: summary.adverseCount > 0 ? 'warning' : 'info',
    text: summary.adverseCount > 0
      ? `记录到 ${summary.adverseCount} 条不良反应，请复诊时重点说明。`
      : '近7天未记录明确不良反应。',
  })

  if (refill) {
    points.push({
      type: refill.remainingDays <= 7 ? 'warning' : 'info',
      text: `${refill.drugName} 预计剩余 ${refill.remainingDays} 天用量。`,
    })
  }

  return points
}
