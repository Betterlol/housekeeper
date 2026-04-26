import { useState } from 'react'
import MedicalIcon from '../../components/MedicalIcon'
import { summaryPointStyle } from './constants'

export default function ConsultSummaryCard({
  points,
  doctorQuestions,
  copyStatus,
  onCopy,
  onSendDoctor,
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="px-1">
      <article className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <MedicalIcon name="consult" className="h-4 w-4 text-white" />
              </span>
              <span className="font-medium text-white">AI 已帮你准备复诊</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs text-white/90">
              <MedicalIcon name="ai" className="h-3 w-3" />
              AI 生成
            </span>
          </div>

          <div className="mb-4 space-y-2">
            {points.map((point, index) => {
              const style = summaryPointStyle[point.type] || summaryPointStyle.info
              return (
                <div key={`${point.type}-${index}`} className="flex items-start gap-2 rounded-lg bg-white/10 p-2">
                  <MedicalIcon name={style.icon} className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClass}`} />
                  <p className="text-sm text-white/90">{point.text}</p>
                </div>
              )
            })}
          </div>

          {expanded ? (
            <div className="mb-4 rounded-xl bg-white/10 p-3">
              <div className="mb-2 flex items-center gap-2">
                <MedicalIcon name="consult" className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium text-white">AI 建议问医生</p>
              </div>
              <div className="space-y-2">
                {doctorQuestions.map((question, index) => (
                  <div key={question} className="flex items-center gap-2 text-sm text-white/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">
                      {index + 1}
                    </span>
                    {question}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full text-sm text-white/75"
          >
            {expanded ? '收起' : '展开完整摘要'}
          </button>
        </div>

        <div className="flex gap-2 border-t border-white/10 bg-white/5 p-3">
          <button
            type="button"
            onClick={onSendDoctor}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-indigo-600"
          >
            <MedicalIcon name="consult" className="h-4 w-4" />
            发送给医生
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/20 py-3 text-sm font-medium text-white"
          >
            <MedicalIcon name="plan" className="h-4 w-4" />
            复制摘要
          </button>
        </div>
      </article>

      {copyStatus ? (
        <p className="mt-2 text-xs text-medical-700">{copyStatus}</p>
      ) : null}
    </section>
  )
}
