import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/home', label: '今日用药', icon: '药' },
  { to: '/plan', label: '用药计划', icon: '计' },
  { to: '/profile', label: '我的', icon: '我' },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto w-full max-w-md border-t border-slate-200 bg-white/95 px-2 pb-4 pt-2 backdrop-blur">
      <ul className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-xl py-2 text-xs transition ${
                  isActive
                    ? 'bg-medical-50 text-medical-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`
              }
            >
              <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold">
                {tab.icon}
              </span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
