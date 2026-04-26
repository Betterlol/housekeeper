import { useEffect, useMemo, useState } from 'react'
import MedicalIcon from '../components/MedicalIcon'
import useStoreSnapshot from '../hooks/useStoreSnapshot'
import {
  buildConsultCopyText,
  getConsultSummary,
  getDoctorReadableReport,
  getLateNightMissedCount,
  getSevenDayTrendData,
  getWeekWindowLabel,
} from '../utils/insights'
import { markExperienceVisited } from '../utils/storage'

function copyByExecCommand(text) {
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

export default function ConsultPage() {
  const [copyStatus, setCopyStatus] = useState('')

  const store = useStoreSnapshot({ ensureToday: true })

  useEffect(() => {
    markExperienceVisited('consult')
  }, [])

  const summary = getConsultSummary(store)
  const lateNightMissed = getLateNightMissedCount(store)
  const trend = getSevenDayTrendData(store)
  const doctorReport = useMemo(() => getDoctorReadableReport(store), [store])

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

  return (
    <section className="space-y-4">
      <article className="rounded-3xl bg-gradient-to-br from-sky-700 via-cyan-700 to-teal-700 p-5 text-white shadow-[0_22px_44px_-20px_rgba(3,105,161,0.85)]">
        <p className="text-xs text-sky-100">互联网医院 · AI复诊摘要</p>
        <h1 className="mt-1 text-xl font-semibold">慢病复诊报告</h1>
        <p className="mt-2 text-xs text-sky-100">统计周期：{getWeekWindowLabel()}</p>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <p className="text-sm font-semibold text-slate-900">核心指标</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">用药依从率</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">{summary.adherence}%</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">漏服次数</p>
            <p className="mt-1 text-xl font-semibold text-rose-600">{summary.missedCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">晚间漏服</p>
            <p className="mt-1 text-xl font-semibold text-amber-600">{lateNightMissed}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">建议复诊时间</p>
            <p className="mt-1 text-sm font-semibold text-medical-700">{summary.nextVisitDate}</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">7日用药趋势</p>
          <span className="text-[11px] text-slate-500">应服 / 实服 / 漏服 / 依从率</span>
        </div>

        <div className="space-y-3">
          {trend.map((day) => {
            const takenWidth = day.expected === 0 ? 0 : Math.round((day.taken / day.expected) * 100)
            const missedWidth = day.expected === 0 ? 0 : Math.round((day.missed / day.expected) * 100)

            return (
              <div key={day.dateKey} className="rounded-xl bg-slate-50 p-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{day.label}</span>
                  <span className="text-slate-500">{day.adherence}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>应服 {day.expected}</span>
                  <span>实服 {day.taken}</span>
                  <span>漏服 {day.missed}</span>
                </div>

                <div className="mt-1 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${takenWidth}%` }} />
                </div>

                <div className="mt-1 h-1.5 rounded-full bg-rose-100">
                  <div className="h-1.5 rounded-full bg-rose-500" style={{ width: `${missedWidth}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </article>

      <article className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-medical-50 p-4 shadow-[0_12px_28px_-20px_rgba(15,118,110,0.7)]">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 rounded-lg bg-medical-100 p-1 text-medical-700">
            <MedicalIcon name="ai" className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">AI生成问诊摘要</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{summary.aiSummary}</p>
            <p className="mt-2 text-xs text-slate-500">最近漏服日期：{summary.latestMissedDate}</p>

            <button
              type="button"
              onClick={handleCopySummary}
              className="mt-3 rounded-lg bg-medical-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-medical-700"
            >
              复制复诊摘要
            </button>

            {copyStatus ? <p className="mt-2 text-xs text-medical-700">{copyStatus}</p> : null}
          </div>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
        <p className="text-sm font-semibold text-slate-900">医生可读报告卡片</p>

        <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
          <p>
            <span className="font-medium text-slate-800">患者基本情况：</span>
            {doctorReport.profile.name}，{doctorReport.profile.gender}，{doctorReport.profile.age}岁，慢病诊断
            {(doctorReport.profile.diseases || []).join('、')}。
          </p>
          <p>
            <span className="font-medium text-slate-800">近7日用药依从率：</span>
            {doctorReport.adherence}% ，总体执行
            {doctorReport.adherence >= 90 ? '较稳定' : doctorReport.adherence >= 80 ? '中等' : '偏低'}。
          </p>
          <p>
            <span className="font-medium text-slate-800">漏服风险：</span>
            {doctorReport.missedRisk}，{doctorReport.missedRiskDesc}
          </p>
          <p>
            <span className="font-medium text-slate-800">不良反应：</span>
            {doctorReport.adverseText}
          </p>
          <p>
            <span className="font-medium text-slate-800">续方建议：</span>
            {doctorReport.refillAdvice}
          </p>
          <p>
            <span className="font-medium text-slate-800">医生沟通重点：</span>
          </p>
          <p>1. {doctorReport.communicationFocus[0]}</p>
          <p>2. {doctorReport.communicationFocus[1]}</p>
          <p>3. {doctorReport.communicationFocus[2]}</p>
        </div>
      </article>
    </section>
  )
}
