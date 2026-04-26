import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  buildConsultCopyText,
  getConsultSummary,
  getDoctorReadableReport,
  getLateNightMissedCount,
  getRecentLogs,
  getSevenDayTrendData,
  getUpcomingRefill,
  getWeekWindowLabel,
} from '../utils/insights'
import { markExperienceVisited } from '../utils/storage'
import ConsultHeroCockpit from '../features/consult/ConsultHeroCockpit'
import ConsultRiskConsole from '../features/consult/ConsultRiskConsole'
import ConsultBehaviorAnalysis from '../features/consult/ConsultBehaviorAnalysis'
import ConsultSummaryCard from '../features/consult/ConsultSummaryCard'
import ConsultChatEntry from '../features/consult/ConsultChatEntry'
import ConsultActionCenter from '../features/consult/ConsultActionCenter'
import ConsultDoctorReportCard from '../features/consult/ConsultDoctorReportCard'
import ConsultSendDoctorModal from '../features/consult/ConsultSendDoctorModal'
import {
  buildRiskItems,
  buildRiskMeta,
  buildSummaryPoints,
  buildTimeDistribution,
  copyByExecCommand,
} from '../features/consult/helpers'

const CONSULT_RISK_RESOLVED_KEY = 'consult-risk-resolved-v1'

function buildAskReply(question, summary, refill) {
  if (question.includes('漏服') || question.includes('忘记')) {
    return `你近7日依从率为 ${summary.adherence}%，建议先把晚间提醒提前 20 分钟，并开启连续提醒，降低漏服概率。`
  }

  if (question.includes('头晕')) {
    return '建议记录头晕发生时间、持续时长和当时血压，并在复诊时与医生确认是否与用药时间有关。'
  }

  if (question.includes('血压')) {
    return '建议连续3天记录早晚血压并带去复诊；若持续高于目标值，可与医生评估是否需要调整方案。'
  }

  if (refill && refill.remainingDays <= 7) {
    return `${refill.drugName} 当前库存预计可用 ${refill.remainingDays} 天，建议优先完成续方，避免断药。`
  }

  return '建议继续保持当前节奏，重点观察晚间服药与作息同步性，复诊时携带近7日记录。'
}

export default function ConsultPage() {
  const navigate = useNavigate()
  const store = useStoreSnapshot({ ensureToday: true })

  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [pageTip, setPageTip] = useState('')
  const [resolvedRiskIds, setResolvedRiskIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem(CONSULT_RISK_RESOLVED_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  })
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'ai-welcome',
      role: 'ai',
      text: '你好，我是AI复诊助手。可以问我“漏服后怎么补服”“最近头晕怎么处理”等问题。',
    },
  ])
  const [chatLoading, setChatLoading] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)

  useEffect(() => {
    markExperienceVisited('consult')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnalysisComplete(true)
    }, 1600)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!copyStatus && !pageTip) return undefined

    const timer = setTimeout(() => {
      setCopyStatus('')
      setPageTip('')
    }, 2400)

    return () => clearTimeout(timer)
  }, [copyStatus, pageTip])

  useEffect(() => {
    window.localStorage.setItem(CONSULT_RISK_RESOLVED_KEY, JSON.stringify(resolvedRiskIds))
  }, [resolvedRiskIds])

  const summary = useMemo(() => getConsultSummary(store), [store])
  const lateNightMissed = useMemo(() => getLateNightMissedCount(store), [store])
  const trend = useMemo(() => getSevenDayTrendData(store), [store])
  const doctorReport = useMemo(() => getDoctorReadableReport(store), [store])
  const refill = useMemo(() => getUpcomingRefill(store), [store])
  const recentEvents = useMemo(() => getRecentLogs(store, undefined, 7), [store])

  const riskMeta = useMemo(
    () => buildRiskMeta(summary, lateNightMissed),
    [summary, lateNightMissed]
  )
  const riskItems = useMemo(
    () => buildRiskItems({ summary, lateNightMissed, refill }),
    [summary, lateNightMissed, refill]
  )
  const timeBuckets = useMemo(() => buildTimeDistribution(recentEvents), [recentEvents])
  const summaryPoints = useMemo(
    () => buildSummaryPoints({ summary, refill }),
    [summary, refill]
  )
  const activeResolvedRiskIds = useMemo(
    () => resolvedRiskIds.filter((id) => riskItems.some((risk) => risk.id === id)),
    [resolvedRiskIds, riskItems]
  )

  const actionCards = [
    {
      key: 'visit',
      icon: 'consult',
      title: '预约复诊',
      desc: `建议 ${summary.nextVisitDate} 前完成`,
      tone: 'emerald',
      primary: true,
      target: '/profile',
    },
    {
      key: 'reminder',
      icon: 'reminder',
      title: '调整提醒',
      desc: '优化晚间提醒',
      tone: 'amber',
      target: '/reminders',
    },
    {
      key: 'purchase',
      icon: 'purchase',
      title: '续方购药',
      desc: refill ? `剩余${refill.remainingDays}天` : '查看库存',
      tone: 'blue',
      target: '/purchase',
    },
    {
      key: 'export',
      icon: 'plan',
      title: '导出摘要',
      desc: '复制到剪贴板',
      tone: 'slate',
      action: 'copy',
    },
  ]

  const handleCopySummary = async () => {
    const text = buildConsultCopyText(store)

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const result = copyByExecCommand(text)
        if (!result) throw new Error('fallback copy failed')
      }

      setCopyStatus('复诊摘要已复制到剪贴板。')
    } catch (error) {
      setCopyStatus('当前浏览器不支持自动复制，请手动复制摘要内容。')
    }
  }

  const handleNavigateAction = (payload) => {
    if (payload?.target) {
      navigate(payload.target)
      return
    }

    if (payload?.action === 'copy') {
      handleCopySummary()
      return
    }

    setPageTip('该动作为演示能力，暂未接入实际医院系统。')
  }

  const handleSendDoctor = () => {
    setSendModalOpen(true)
  }

  const handleAsk = (question) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatLoading(true)

    window.setTimeout(() => {
      const reply = buildAskReply(question, summary, refill)
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: reply,
        },
      ])
      setChatLoading(false)
    }, 900)
  }

  const handleResolveRisk = (risk) => {
    setResolvedRiskIds((prev) => (
      prev.includes(risk.id)
        ? prev.filter((item) => item !== risk.id)
        : [...prev, risk.id]
    ))
  }

  const handleConfirmSendDoctor = () => {
    setSendLoading(true)
    window.setTimeout(() => {
      setSendLoading(false)
      setSendModalOpen(false)
      setPageTip('复诊摘要已模拟发送给医生。')
    }, 1000)
  }

  return (
    <section className="space-y-5 pb-2">
      <ConsultHeroCockpit
        analysisComplete={analysisComplete}
        riskMeta={riskMeta}
        summary={summary}
        weekWindowLabel={getWeekWindowLabel()}
      />

      {pageTip ? (
        <article className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-700">
          {pageTip}
        </article>
      ) : null}

      <ConsultRiskConsole
        items={riskItems}
        onAction={handleNavigateAction}
        resolvedIds={activeResolvedRiskIds}
        onResolve={handleResolveRisk}
      />
      <ConsultBehaviorAnalysis trend={trend} buckets={timeBuckets} />
      <ConsultSummaryCard
        points={summaryPoints}
        doctorQuestions={(doctorReport.communicationFocus || []).slice(0, 3)}
        copyStatus={copyStatus}
        onCopy={handleCopySummary}
        onSendDoctor={handleSendDoctor}
      />
      <ConsultChatEntry onAsk={handleAsk} messages={chatMessages} isLoading={chatLoading} />
      <ConsultActionCenter actions={actionCards} onAction={handleNavigateAction} />
      <ConsultDoctorReportCard doctorReport={doctorReport} />

      <ConsultSendDoctorModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        onConfirm={handleConfirmSendDoctor}
        sending={sendLoading}
      />
    </section>
  )
}
