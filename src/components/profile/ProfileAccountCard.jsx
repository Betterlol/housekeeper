function getAvatarText(name) {
  const value = String(name || '').trim()
  if (!value) return '张'
  return value.slice(0, 1)
}

export default function ProfileAccountCard({
  userProfile,
  updatedAtText,
}) {
  const diseases = userProfile?.diseases || []

  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.85)]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-semibold text-emerald-700">
          {getAvatarText(userProfile?.name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900">{userProfile?.name || '张先生'}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            {userProfile?.gender || '男'} · {userProfile?.age || 58}岁
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {diseases.length > 0 ? diseases.map((item) => (
              <span key={item} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                {item}
              </span>
            )) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">未设置慢病标签</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs">
        <div>
          <p className="text-slate-500">健康账户状态</p>
          <p className="mt-1 inline-flex items-center gap-1 font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            已启用
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">最近数据更新时间</p>
          <p className="mt-1 font-medium text-slate-700">{updatedAtText}</p>
        </div>
      </div>
    </article>
  )
}
