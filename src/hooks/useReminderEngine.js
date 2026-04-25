import { useEffect, useState } from 'react';
import {
  ensureTodayReminderLogs,
  getReminderQueueItems,
  markReminderTaken,
  processReminderCycle,
  skipReminder,
  snoozeReminder,
  subscribeStoreUpdates,
} from '../utils/storage';
import {
  ensureNotificationPermission,
  sendMedicationNotification,
} from '../utils/notification';

export default function useReminderEngine() {
  const [activeReminders, setActiveReminders] = useState([]);
  const [permissionState, setPermissionState] = useState('default');

  useEffect(() => {
    let mounted = true;

    const refreshQueue = () => {
      if (!mounted) return;
      setActiveReminders(getReminderQueueItems().filter((item) => item.status === 'notified'));
    };

    const runCycle = () => {
      const { notifiedItems } = processReminderCycle();

      notifiedItems.forEach((item) => {
        sendMedicationNotification(item.drugName);
      });

      refreshQueue();
    };

    ensureTodayReminderLogs();

    ensureNotificationPermission().then((permission) => {
      if (!mounted) return;
      setPermissionState(permission);
      runCycle();
    });

    const interval = setInterval(runCycle, 15000);
    const unsubscribe = subscribeStoreUpdates(refreshQueue);

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      runCycle();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return {
    activeReminders,
    permissionState,
    takeReminder: (reminderId) => markReminderTaken(reminderId),
    snoozeReminder: (reminderId) => snoozeReminder(reminderId, 5),
    skipReminder: (reminderId) => skipReminder(reminderId),
  };
}
