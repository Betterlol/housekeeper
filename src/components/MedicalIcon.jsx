const iconMap = {
  home: (
    <path
      d="M12 3l8 7v10a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V10l8-7z"
      fill="currentColor"
    />
  ),
  plan: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  consult: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16.5" cy="16.5" r="2.5" fill="currentColor" />
    </>
  ),
  purchase: (
    <>
      <path d="M4 7h16l-1.5 10a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 7z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  pressure: (
    <>
      <path d="M12 20s-6.5-4.6-8.2-8a4.8 4.8 0 0 1 8.2-4.6A4.8 4.8 0 0 1 20.2 12C18.5 15.4 12 20 12 20z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  sugar: (
    <>
      <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    </>
  ),
  adherence: (
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12.5l2.2 2.2 4.8-5.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  ai: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l8 14H4l8-14z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

export default function MedicalIcon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {iconMap[name] || iconMap.home}
    </svg>
  );
}
