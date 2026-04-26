import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage';
import RemindersPage from './pages/RemindersPage';
import ConsultPage from './pages/ConsultPage';
import PurchasePage from './pages/PurchasePage';
import ProfilePage from './pages/ProfilePage';
import TabBar from './components/TabBar';
import ReminderModal from './components/ReminderModal';
import useReminderEngine from './hooks/useReminderEngine';
import { initStore } from './utils/storage';

function AppShell({ children }) {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden px-4 pb-32 pt-4">
      <div className="app-shell-bg pointer-events-none absolute inset-0 -z-10" />
      <div className="app-shell-frame pointer-events-none absolute inset-x-2 bottom-28 top-2 -z-10 rounded-[30px]" />
      <div className="app-shell-glow-cyan pointer-events-none absolute -left-16 top-20 -z-10 h-56 w-56 rounded-full bg-cyan-300/35 blur-3xl" />
      <div className="app-shell-glow-teal pointer-events-none absolute -right-20 top-96 -z-10 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />
      <div className="relative z-10">{children}</div>
      <TabBar />
    </div>
  );
}

export default function App() {
  const reminderEngine = useReminderEngine();

  useEffect(() => {
    initStore();
  }, []);

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/consult" element={<ConsultPage />} />
          <Route path="/purchase" element={<PurchasePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AppShell>

      <ReminderModal
        reminders={reminderEngine.activeReminders}
        permissionState={reminderEngine.permissionState}
        onTake={reminderEngine.takeReminder}
        onSnooze={reminderEngine.snoozeReminder}
        onSkip={reminderEngine.skipReminder}
      />
    </>
  );
}
