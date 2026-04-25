export default function PageHeader({ title, subtitle }) {
  return (
    <header className="mb-4">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </header>
  );
}
