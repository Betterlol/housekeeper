export function formatTime(iso) {
  if (!iso) return '--:--'
  const parsed = new Date(iso)
  if (!Number.isNaN(parsed.getTime())) {
    const hh = `${parsed.getHours()}`.padStart(2, '0')
    const mm = `${parsed.getMinutes()}`.padStart(2, '0')
    return `${hh}:${mm}`
  }
  return iso.slice(11, 16)
}

export function formatDistance(targetIso) {
  if (!targetIso) return '暂无'
  const diffMs = new Date(targetIso).getTime() - Date.now()
  if (diffMs <= 0) return '即将触发'
  return `${Math.ceil(diffMs / 60000)} 分钟后`
}

export function formatTodayLabel() {
  const now = new Date()
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekday}`
}

export function toMinutes(targetIso) {
  if (!targetIso) return 0
  const diffMs = new Date(targetIso).getTime() - Date.now()
  return Math.max(Math.ceil(diffMs / 60000), 0)
}

export function getTimelineState(item, nextPendingId) {
  if (item.visibleStatus === 'taken') return 'done'
  if (item.visibleStatus === 'missed') return 'missed'
  if (item.visibleStatus === 'skipped') return 'skipped'
  if (item.visibleStatus === 'off') return 'off'
  if (item.id === nextPendingId) return 'current'
  return 'upcoming'
}

export function parsePressureValue(value) {
  const numbers = `${value || ''}`.match(/\d+/g) || []
  return Number(numbers[0] || 120)
}

export function parseSugarValue(value) {
  const match = `${value || ''}`.match(/\d+(\.\d+)?/)
  return Number(match?.[0] || 6.0)
}

export function mapNumberToBars(value, min, max) {
  const normalized = Math.max(0, Math.min(1, (value - min) / Math.max(max - min, 1)))
  return Array.from({ length: 7 }).map((_, index) => {
    const threshold = (index + 1) / 7
    if (normalized >= threshold) return 90 - index * 6
    return 38 + index * 4
  })
}

export function mapAdherenceToBars(adherence, trendData) {
  if (trendData.length === 7) {
    return trendData.map((day) => 32 + Math.round((day.adherence / 100) * 60))
  }
  return mapNumberToBars(adherence, 0, 100)
}
