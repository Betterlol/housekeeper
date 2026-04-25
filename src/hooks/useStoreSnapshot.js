import { useEffect, useState } from 'react';
import {
  ensureTodayReminderLogs,
  getStore,
  subscribeStoreUpdates,
} from '../utils/storage';

export default function useStoreSnapshot({ ensureToday = false } = {}) {
  const [store, setStore] = useState(() => getStore());

  useEffect(() => {
    if (ensureToday) {
      ensureTodayReminderLogs();
    }

    const sync = () => {
      setStore(getStore());
    };

    const unsubscribe = subscribeStoreUpdates(sync);
    sync();

    return unsubscribe;
  }, [ensureToday]);

  return store;
}
