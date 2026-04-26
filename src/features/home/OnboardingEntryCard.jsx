export default function OnboardingEntryCard({
  onboardingProgress,
  activeOnboardingStep,
  onboardingSteps,
  activeStepData,
  onOpen,
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-medical-100 bg-white/95 px-4 py-3 text-left shadow-card backdrop-blur"
    >
      <p className="text-xs font-semibold text-medical-700">首次使用引导</p>
      <p className="mt-1 text-xs text-slate-500">
        {onboardingProgress.onboardingCompleted
          ? '已完成全部引导，点击可查看完成提示'
          : `当前进度 ${Math.min(activeOnboardingStep + 1, onboardingSteps.length)}/${onboardingSteps.length} · 推荐：${activeStepData?.title || '完成引导'}`}
      </p>
    </button>
  )
}
