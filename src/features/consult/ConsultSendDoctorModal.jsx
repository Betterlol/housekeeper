export default function ConsultSendDoctorModal({
  open,
  onClose,
  onConfirm,
  sending,
}) {
  if (!open) return null

  return (
    <div className="sheet-overlay z-40">
      <article className="sheet-panel">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">发送复诊摘要</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
            disabled={sending}
          >
            关闭
          </button>
        </div>

        <div className="space-y-3">
          <article className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">目标医生</p>
            <p className="mt-1 text-xs text-slate-600">互联网医院 · 心血管内科 王医生（演示）</p>
          </article>

          <article className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">发送内容</p>
            <p className="mt-1 text-xs text-slate-600">AI复诊摘要 + 医生沟通重点 + 近7日趋势结果</p>
          </article>

          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {sending ? '发送中...' : '确认发送'}
          </button>
        </div>
      </article>
    </div>
  )
}
