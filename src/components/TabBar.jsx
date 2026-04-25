import { NavLink } from 'react-router-dom';
import MedicalIcon from './MedicalIcon';

const tabs = [
  { to: '/home', label: '首页', icon: 'home' },
  { to: '/plan', label: '用药计划', icon: 'plan' },
  { to: '/consult', label: 'AI复诊', icon: 'consult' },
  { to: '/purchase', label: '购药', icon: 'purchase' },
  { to: '/profile', label: '我的', icon: 'profile' },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto w-full max-w-md border-t border-medical-100 bg-white/95 px-2 pb-4 pt-2 shadow-2xl backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-xl py-2 text-[11px] font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-br from-medical-50 to-cyan-50 text-medical-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`
              }
            >
              <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <MedicalIcon name={tab.icon} className="h-4 w-4" />
              </span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
