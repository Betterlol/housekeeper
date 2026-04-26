import MedicalIcon from '../MedicalIcon'

export default function ProfileListSection({
  title,
  items,
  onPress,
}) {
  return (
    <section className="space-y-2">
      <p className="px-1 text-xs font-medium tracking-wide text-slate-500">{title}</p>

      <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_30px_-28px_rgba(15,23,42,0.9)] ring-1 ring-slate-100">
        {items.map((item, index) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPress(item)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
              index !== items.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconBg || 'bg-slate-100'}`}>
              <MedicalIcon name={item.icon || 'profile'} className={`h-4 w-4 ${item.iconColor || 'text-slate-700'}`} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800">{item.title}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
            </span>

            <span className="text-slate-300">›</span>
          </button>
        ))}
      </article>
    </section>
  )
}
