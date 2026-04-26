export default function ProfileReportImportSheet({
  open,
  reportStep,
  reportFile,
  reportResult,
  parseHint,
  onClose,
  onPickFile,
  onStartParse,
  onConfirm,
}) {
  if (!open) return null

  const stepMap = { upload: 0, parsing: 1, result: 2, success: 3 }

  return (
    <div className="sheet-overlay z-40">
      <div className="sheet-panel">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">导入报告（AI解析演示）</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
          >
            关闭
          </button>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-1 text-[11px]">
          {['上传文件', 'AI解析中', '结果预览', '确认完成'].map((label, index) => {
            const active = index <= stepMap[reportStep]
            return (
              <span
                key={label}
                className={`rounded-lg px-2 py-1 text-center ${active ? 'bg-medical-100 text-medical-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {label}
              </span>
            )
          })}
        </div>

        {reportStep === 'upload' ? (
          <div className="space-y-3">
            <label className="block rounded-2xl border border-dashed border-medical-200 bg-medical-50 p-4 text-center">
              <p className="text-sm font-medium text-medical-700">上传报告（pdf/excel/jpg/png/txt）</p>
              <p className="mt-1 text-xs text-slate-500">仅做 AI 解析架构展示，不进行真实解析</p>
              <input
                type="file"
                accept=".pdf,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
                className="mt-3 block w-full text-xs text-slate-600"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  onPickFile(file)
                }}
              />
            </label>

            {reportFile ? (
              <p className="text-xs text-slate-600">已选择文件：{reportFile.name}</p>
            ) : (
              <p className="text-xs text-slate-500">尚未选择文件</p>
            )}

            <button
              type="button"
              onClick={onStartParse}
              className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
            >
              开始AI解析
            </button>
          </div>
        ) : null}

        {reportStep === 'parsing' ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-medical-200 border-t-medical-600" />
            <p className="mt-3 text-sm font-medium text-slate-700">AI解析中...</p>
            <p className="mt-1 text-xs text-slate-500">{parseHint}</p>
          </div>
        ) : null}

        {reportStep === 'result' && reportResult ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">mock 报告解析结果</p>
              <p className="mt-2">慢病类型：{reportResult.diseases.join('、')}</p>
              <p className="mt-1">血压：{reportResult.bloodPressure}</p>
              <p className="mt-1">血糖：{reportResult.bloodSugar}</p>
              <p className="mt-1">医生建议：{reportResult.doctorAdvice}</p>
              <p className="mt-1">建议复诊时间：{reportResult.nextVisitDate}</p>
            </div>

            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
            >
              确认更新档案
            </button>
          </div>
        ) : null}

        {reportStep === 'success' ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">导入成功</p>
            <p className="mt-1 text-xs text-emerald-700">报告解析结果已写入用户档案。</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
