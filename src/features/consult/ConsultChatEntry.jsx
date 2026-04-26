import { useState } from 'react'
import MedicalIcon from '../../components/MedicalIcon'

const quickQuestions = ['最近头晕怎么办？', '漏服后要补吗？', '血压偏高怎么办？']

export default function ConsultChatEntry({ onAsk, messages = [], isLoading = false }) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (!value.trim()) return
    onAsk(value.trim())
    setValue('')
  }

  return (
    <section className="px-1">
      <article className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <MedicalIcon name="ai" className="h-4 w-4 text-white" />
          </span>
          <div>
            <p className="font-medium text-white">AI 健康助手</p>
            <p className="text-xs text-white/50">结合你的用药记录智能回答（演示模式）</p>
          </div>
        </div>

        <div className="mb-3 max-h-52 space-y-2 overflow-y-auto rounded-xl bg-white/5 p-2">
          {messages.length === 0 ? (
            <p className="text-xs text-white/60">输入问题后，AI 将结合你的用药记录生成建议。</p>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  item.role === 'user'
                    ? 'ml-8 bg-violet-500/30 text-white'
                    : 'mr-8 bg-white/10 text-white/90'
                }`}
              >
                {item.text}
              </div>
            ))
          )}

          {isLoading ? (
            <div className="mr-8 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80">
              AI 正在分析你的问题...
            </div>
          ) : null}
        </div>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="问我任何复诊问题..."
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-white/30"
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
          />
          <button
            type="button"
            onClick={submit}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600"
          >
            <MedicalIcon name="consult" className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onAsk(question)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20"
            >
              {question}
            </button>
          ))}
        </div>
      </article>
    </section>
  )
}
