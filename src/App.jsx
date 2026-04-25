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
    <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 px-4 pb-32 pt-4">
      {children}
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
