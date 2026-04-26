export const riskLevelStyle = {
  high: {
    label: '高风险',
    textClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/20 text-rose-300',
  },
  medium: {
    label: '中风险',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-300',
  },
  low: {
    label: '低风险',
    textClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
  },
}

export const riskCardStyle = {
  high: {
    wrap: 'bg-rose-50',
    tag: 'bg-rose-200 text-rose-700',
    action: 'bg-rose-500 text-white',
    icon: 'from-rose-500 to-red-600',
  },
  medium: {
    wrap: 'bg-amber-50',
    tag: 'bg-amber-200 text-amber-700',
    action: 'bg-amber-500 text-white',
    icon: 'from-amber-500 to-orange-500',
  },
  low: {
    wrap: 'bg-emerald-50',
    tag: 'bg-emerald-200 text-emerald-700',
    action: 'bg-emerald-500 text-white',
    icon: 'from-emerald-500 to-green-500',
  },
}

export const summaryPointStyle = {
  warning: {
    icon: 'alert',
    iconClass: 'text-amber-300',
  },
  success: {
    icon: 'adherence',
    iconClass: 'text-emerald-300',
  },
  info: {
    icon: 'consult',
    iconClass: 'text-cyan-300',
  },
}
