export default function OnboardingGuideModal({
  open,
  activeOnboardingStep,
  onboardingSteps,
  onboardingProgress,
  activeStepData,
  onSetStep,
  onGoComplete,
  onNextStep,
  onCloseTemporarily,
  onNeverShow,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-sm">
      <article className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">首次使用引导</p>
          <span className="rounded-full bg-medical-100 px-2 py-1 text-xs font-medium text-medical-700">
            {activeOnboardingStep + 1}/{onboardingSteps.length}
          </span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-medical-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${((activeOnboardingStep + 1) / onboardingSteps.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-medical-100 bg-cyan-50/50 p-3">
          {onboardingProgress.onboardingCompleted ? (
            <>
              <p className="text-sm font-semibold text-emerald-700">恭喜！你已完成新手引导！</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                AI健康管理已启用，你可以继续使用提醒、AI复诊与购药建议完成日常慢病管理。
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">{activeStepData?.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{activeStepData?.description}</p>
            </>
          )}
        </div>

        <div className="mt-3 grid grid-cols-6 gap-1">
          {onboardingSteps.map((item, index) => {
            const isCurrent = index === activeOnboardingStep
            const isDone = onboardingProgress.stepCompleted[index]
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSetStep(index)}
                className={`rounded-lg px-1 py-1.5 text-[11px] ${
                  isCurrent
                    ? 'bg-medical-600 text-white'
                    : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isDone ? '已完成' : `${index + 1}`}
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onGoComplete}
            className="rounded-xl bg-medical-600 px-3 py-2 text-sm font-medium text-white"
          >
            {onboardingProgress.onboardingCompleted ? '开始使用' : '去完成'}
          </button>
          <button
            type="button"
            onClick={onNextStep}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
          >
            {onboardingProgress.onboardingCompleted ? '关闭' : '下一步'}
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCloseTemporarily}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600"
          >
            跳过引导
          </button>
          <button
            type="button"
            onClick={onNeverShow}
            className="rounded-xl border border-rose-200 px-3 py-2 text-xs text-rose-600"
          >
            不再提示
          </button>
        </div>
      </article>
    </div>
  )
}
