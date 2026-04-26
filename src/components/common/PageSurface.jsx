const surfaceClassMap = {
  home: 'page-surface-home',
  reminders: 'page-surface-reminders',
  purchase: 'page-surface-purchase',
  consult: 'page-surface-consult',
  plan: 'page-surface-plan',
  profile: 'page-surface-profile',
}

export default function PageSurface({
  children,
  className = '',
  variant = 'home',
  surfaceInsetClassName = 'inset-x-0 -top-4 h-[calc(100%+2rem)]',
}) {
  const sectionClassName = ['relative', className].filter(Boolean).join(' ')
  const surfaceClassName = surfaceClassMap[variant] || surfaceClassMap.home

  return (
    <section className={sectionClassName}>
      <div className={`${surfaceClassName} pointer-events-none absolute ${surfaceInsetClassName} -z-10 rounded-[32px]`} />
      {children}
    </section>
  )
}
