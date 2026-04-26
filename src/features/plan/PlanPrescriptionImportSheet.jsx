export default function PlanPrescriptionImportSheet({
  open,
  importStep,
  importFile,
  importMode,
  parseHint,
  parsedPrescription,
  onClose,
  onPickFile,
  onStartParse,
  onChangeMode,
  onConfirm,
}) {
  if (!open) return null

  const stepMap = { upload: 0, parsing: 1, result: 2, success: 3 }

  return (
    <div className="sheet-overlay z-40">
      <div className="sheet-panel">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">导入处方（AI解析演示）</p>
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
            const active = index <= stepMap[importStep]
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

        {importStep === 'upload' ? (
          <div className="space-y-3">
            <label className="block rounded-2xl border border-dashed border-medical-200 bg-medical-50 p-4 text-center">
              <p className="text-sm font-medium text-medical-700">上传处方文件（jpg/png/pdf/txt）</p>
              <p className="mt-1 text-xs text-slate-500">仅做 AI 解析架构展示，不进行真实 OCR</p>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.txt"
                className="mt-3 block w-full text-xs text-slate-600"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  onPickFile(file)
                }}
              />
            </label>

            {importFile ? (
              <p className="text-xs text-slate-600">已选择文件：{importFile.name}</p>
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

        {importStep === 'parsing' ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-medical-200 border-t-medical-600" />
            <p className="mt-3 text-sm font-medium text-slate-700">AI解析中...</p>
            <p className="mt-1 text-xs text-slate-500">{parseHint}</p>
          </div>
        ) : null}

        {importStep === 'result' ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">mock 处方结果</p>
              <div className="mt-2 space-y-2">
                {parsedPrescription.map((item, index) => (
                  <article key={`${item.drugName}-${index}`} className="rounded-xl bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">{item.drugName}</p>
                    <p className="mt-1 text-xs text-slate-500">规格：{item.spec}</p>
                    <p className="mt-1 text-xs text-slate-500">剂量：{item.dose}{item.unit}</p>
                    <p className="mt-1 text-xs text-slate-500">用药方式：{item.withMeal}</p>
                    <p className="mt-1 text-xs text-medical-700">建议提醒时间：{item.suggestedReminderTime}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-medical-100 bg-medical-50 p-3 text-xs text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'plan_only'}
                  onChange={() => onChangeMode('plan_only')}
                />
                仅加入用药计划
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'plan_and_reminder'}
                  onChange={() => onChangeMode('plan_and_reminder')}
                />
                同时生成提醒规则
              </label>
            </div>

            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
            >
              确认导入
            </button>
          </div>
        ) : null}

        {importStep === 'success' ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">导入成功</p>
            <p className="mt-1 text-xs text-emerald-700">已完成处方解析与数据写入。</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
