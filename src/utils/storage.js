import { mockStore } from '../data/mock';

const STORAGE_KEY = 'housekeeper-med-app-v1';
export const STORE_UPDATED_EVENT = 'housekeeper-store-updated';

export const REMINDER_STATUSES = [
  'scheduled',
  'notified',
  'snoozed',
  'taken',
  'skipped',
  'missed',
];

const FINAL_REMINDER_STATUS_SET = new Set(['taken', 'skipped', 'missed']);
const MISSED_THRESHOLD_MS = 2 * 60 * 60 * 1000;

const clone = (obj) => JSON.parse(JSON.stringify(obj));

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function emitStoreUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_UPDATED_EVENT));
}

function isValidReminderStatus(status) {
  return REMINDER_STATUSES.includes(status);
}

function normalizeReminderStatus(status) {
  if (status === 'pending') return 'scheduled';
  if (isValidReminderStatus(status)) return status;
  if (status === 'taken') return 'taken';
  if (status === 'missed') return 'missed';
  return 'scheduled';
}

function normalizeLog(log) {
  const normalizedStatus = normalizeReminderStatus(log?.reminderStatus || log?.status);

  return {
    ...log,
    status: normalizedStatus,
    reminderStatus: normalizedStatus,
    snoozeUntil: log?.snoozeUntil || '',
    notifiedAt: log?.notifiedAt || '',
    takenAt: log?.takenAt || '',
    reason: log?.reason || '',
  };
}

function normalizeStoreSchema(store) {
  return {
    ...store,
    medications: Array.isArray(store.medications) ? store.medications : [],
    intakeLogs: Array.isArray(store.intakeLogs) ? store.intakeLogs.map(normalizeLog) : [],
    reminderQueue: Array.isArray(store.reminderQueue) ? store.reminderQueue : [],
  };
}

function isMedActiveOnDate(medication, dateKey) {
  const startOk = !medication.startDate || medication.startDate <= dateKey;
  const endOk = !medication.endDate || medication.endDate >= dateKey;
  return startOk && endOk;
}

function compareBySchedule(a, b) {
  if (a.scheduledAt === b.scheduledAt) return a.id > b.id ? 1 : -1;
  return a.scheduledAt > b.scheduledAt ? 1 : -1;
}

function buildDefenseDemoStore() {
  const today = new Date();
  const todayKey = toDateKey(today);
  const dayKeys = Array.from({ length: 7 }).map((_, index) =>
    toDateKey(addDays(today, -6 + index))
  );

  const medications = [
    {
      id: 'med-1',
      drugName: '缬沙坦片',
      spec: '80mg*14片',
      dose: 1,
      unit: '片',
      frequencyPerDay: 1,
      times: ['08:00'],
      withMeal: '饭后',
      startDate: dayKeys[0],
      endDate: '',
      stockQty: 4,
      stockUnit: '片',
    },
    {
      id: 'med-2',
      drugName: '盐酸二甲双胍片',
      spec: '500mg*60片',
      dose: 1,
      unit: '片',
      frequencyPerDay: 2,
      times: ['08:00', '20:00'],
      withMeal: '饭中',
      startDate: dayKeys[0],
      endDate: '',
      stockQty: 72,
      stockUnit: '片',
    },
    {
      id: 'med-3',
      drugName: '阿托伐他汀钙片',
      spec: '20mg*7片',
      dose: 1,
      unit: '片',
      frequencyPerDay: 1,
      times: ['21:00'],
      withMeal: '睡前',
      startDate: dayKeys[0],
      endDate: '',
      stockQty: 11,
      stockUnit: '片',
    },
  ];

  const missedKeys = new Set([`${dayKeys[2]}|med-1|08:00`, `${dayKeys[4]}|med-2|20:00`]);
  const adverseEventKey = `${dayKeys[5]}|med-3|21:00`;

  let logCounter = 1;
  const intakeLogs = [];

  dayKeys.forEach((dayKey) => {
    medications.forEach((medication) => {
      medication.times.forEach((time) => {
        const key = `${dayKey}|${medication.id}|${time}`;
        const isMissed = missedKeys.has(key);

        let status = isMissed ? 'missed' : 'taken';
        if (
          dayKey === todayKey
          && !isMissed
          && medication.id !== 'med-1'
          && (time === '20:00' || time === '21:00')
        ) {
          status = 'scheduled';
        }

        intakeLogs.push({
          id: `log-demo-${logCounter}`,
          medId: medication.id,
          scheduledAt: `${dayKey}T${time}`,
          status,
          reminderStatus: status,
          notifiedAt: '',
          snoozeUntil: '',
          takenAt: status === 'taken' ? `${dayKey}T${time}` : '',
          reason: key === adverseEventKey ? '轻微头晕，已自行缓解' : '',
        });

        logCounter += 1;
      });
    });
  });

  return {
    medications,
    intakeLogs,
    reminderQueue: [],
    userProfile: {
      name: '张先生',
      age: 58,
      gender: '男',
      diseases: ['高血压', '2型糖尿病'],
      diagnosisDate: '2018-03-12',
      note: '近3个月血压和空腹血糖波动，需规律复诊。',
    },
    adverseEvents: [
      {
        id: 'ae-1',
        medId: 'med-3',
        eventTime: `${dayKeys[5]}T21:20`,
        symptom: '轻微头晕，已自行缓解',
        severity: 'mild',
        note: '未影响次日活动。',
      },
    ],
    demoMeta: {
      mode: 'defense',
      generatedAt: new Date().toISOString(),
      label: '答辩演示数据',
    },
  };
}

function addTodayReminderLogsToStore(store, dateKey = toDateKey(new Date())) {
  let created = 0;
  let sequence = 0;

  const existingSet = new Set(
    (store.intakeLogs || [])
      .filter((log) => (log.scheduledAt || '').startsWith(dateKey))
      .map((log) => `${log.medId}|${log.scheduledAt}`)
  );

  const nextLogs = [...(store.intakeLogs || [])];

  (store.medications || []).forEach((medication) => {
    if (!isMedActiveOnDate(medication, dateKey)) return;

    (medication.times || []).forEach((time) => {
      const scheduledAt = `${dateKey}T${time}`;
      const key = `${medication.id}|${scheduledAt}`;

      if (existingSet.has(key)) return;

      sequence += 1;
      created += 1;

      nextLogs.push({
        id: `log-auto-${Date.now()}-${sequence}`,
        medId: medication.id,
        scheduledAt,
        status: 'scheduled',
        reminderStatus: 'scheduled',
        notifiedAt: '',
        snoozeUntil: '',
        takenAt: '',
        reason: '',
      });
    });
  });

  if (created === 0) {
    return { nextStore: store, changed: false };
  }

  return {
    nextStore: {
      ...store,
      intakeLogs: nextLogs.sort(compareBySchedule),
    },
    changed: true,
  };
}

function findMedicationById(store, medId) {
  return (store.medications || []).find((medication) => medication.id === medId) || null;
}

function setQueueWithSet(store, queueSet) {
  return {
    ...store,
    reminderQueue: Array.from(queueSet),
  };
}

function updateSingleReminder(store, reminderId, updater) {
  let changed = false;
  let updatedLog = null;

  const intakeLogs = (store.intakeLogs || []).map((log) => {
    if (log.id !== reminderId) return log;

    const nextLog = normalizeLog(updater(log));
    if (JSON.stringify(nextLog) !== JSON.stringify(log)) changed = true;
    updatedLog = nextLog;
    return nextLog;
  });

  return {
    changed,
    updatedLog,
    nextStore: changed
      ? {
          ...store,
          intakeLogs,
        }
      : store,
  };
}

export function subscribeStoreUpdates(callback) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(STORE_UPDATED_EVENT, callback);
  return () => window.removeEventListener(STORE_UPDATED_EVENT, callback);
}

export function initStore() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const seeded = normalizeStoreSchema(mockStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }
}

export function getStore() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    initStore();
    return normalizeStoreSchema(clone(mockStore));
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeStoreSchema(parsed);

    const parsedText = JSON.stringify(parsed);
    const normalizedText = JSON.stringify(normalized);

    if (parsedText !== normalizedText) {
      window.localStorage.setItem(STORAGE_KEY, normalizedText);
    }

    return normalized;
  } catch (error) {
    const fallback = normalizeStoreSchema(clone(mockStore));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export function setStore(nextStore) {
  const normalized = normalizeStoreSchema(nextStore);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  emitStoreUpdated();
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function ensureTodayReminderLogs(dateKey = getTodayDateKey()) {
  const store = getStore();
  const { nextStore, changed } = addTodayReminderLogsToStore(store, dateKey);

  if (changed) {
    setStore(nextStore);
    return nextStore;
  }

  return store;
}

export function getMedications() {
  return getStore().medications || [];
}

export function getIntakeLogs() {
  return getStore().intakeLogs || [];
}

export function getTodayReminderItemsFromStore(store, dateKey = getTodayDateKey()) {
  const medicationMap = new Map((store.medications || []).map((medication) => [medication.id, medication]));

  return (store.intakeLogs || [])
    .filter((log) => (log.scheduledAt || '').startsWith(dateKey))
    .map((log) => ({
      ...normalizeLog(log),
      medication: medicationMap.get(log.medId) || null,
      dueAt: log.status === 'snoozed' && log.snoozeUntil ? log.snoozeUntil : log.scheduledAt,
    }))
    .sort(compareBySchedule);
}

export function getTodayReminderItems(dateKey = getTodayDateKey()) {
  const store = ensureTodayReminderLogs(dateKey);
  return getTodayReminderItemsFromStore(store, dateKey);
}

export function getReminderQueueItems() {
  const store = getStore();
  const queueSet = new Set(store.reminderQueue || []);
  const medicationMap = new Map((store.medications || []).map((medication) => [medication.id, medication]));

  return (store.intakeLogs || [])
    .filter((log) => queueSet.has(log.id))
    .map((log) => ({
      ...normalizeLog(log),
      medication: medicationMap.get(log.medId) || null,
    }))
    .sort(compareBySchedule);
}

export function addMedication(payload) {
  const store = getStore();
  const medication = {
    id: `med-${Date.now()}`,
    ...payload,
  };

  const nextStore = {
    ...store,
    medications: [medication, ...store.medications],
  };

  setStore(nextStore);
  return medication;
}

export function deleteMedication(medicationId) {
  const store = getStore();
  const queueSet = new Set(store.reminderQueue || []);

  const removedLogIds = store.intakeLogs
    .filter((item) => item.medId === medicationId)
    .map((item) => item.id);

  removedLogIds.forEach((id) => {
    queueSet.delete(id);
  });

  const remainedLogs = store.intakeLogs.filter((item) => item.medId !== medicationId);

  const nextStore = {
    ...store,
    medications: store.medications.filter((item) => item.id !== medicationId),
    intakeLogs: remainedLogs,
    reminderQueue: Array.from(queueSet),
  };

  setStore(nextStore);
}

export function upsertIntakeLog(payload) {
  const store = getStore();
  const normalizedStatus = normalizeReminderStatus(payload.status || payload.reminderStatus);
  const queueSet = new Set(store.reminderQueue || []);

  const existingIndex = store.intakeLogs.findIndex(
    (item) => item.medId === payload.medId && item.scheduledAt === payload.scheduledAt
  );

  const nextLogs = [...store.intakeLogs];
  const normalizedPayload = normalizeLog({
    ...payload,
    status: normalizedStatus,
    reminderStatus: normalizedStatus,
  });

  if (existingIndex === -1) {
    const id = `log-${Date.now()}`;
    nextLogs.push({ id, ...normalizedPayload });
    if (normalizedStatus === 'notified') queueSet.add(id);
  } else {
    const prev = nextLogs[existingIndex];
    const nextLog = {
      ...prev,
      ...normalizedPayload,
      status: normalizedStatus,
      reminderStatus: normalizedStatus,
    };

    nextLogs[existingIndex] = nextLog;

    if (normalizedStatus === 'notified') {
      queueSet.add(nextLog.id);
    } else if (FINAL_REMINDER_STATUS_SET.has(normalizedStatus) || normalizedStatus === 'snoozed') {
      queueSet.delete(nextLog.id);
    }
  }

  const nextStore = {
    ...store,
    intakeLogs: nextLogs,
    reminderQueue: Array.from(queueSet),
  };

  setStore(nextStore);
}

export function processReminderCycle() {
  const withTodayLogs = ensureTodayReminderLogs();
  const now = new Date();
  const nowIso = now.toISOString();
  const todayKey = getTodayDateKey();

  let changed = false;
  const queueSet = new Set(withTodayLogs.reminderQueue || []);
  const notifiedItems = [];

  const nextLogs = (withTodayLogs.intakeLogs || []).map((log) => {
    if (!(log.scheduledAt || '').startsWith(todayKey)) return log;

    const current = normalizeLog(log);
    let next = current;

    const dueAtIso = current.status === 'snoozed' && current.snoozeUntil
      ? current.snoozeUntil
      : current.scheduledAt;

    const dueAt = new Date(dueAtIso);

    if ((current.status === 'scheduled' || current.status === 'snoozed') && now >= dueAt) {
      next = {
        ...next,
        status: 'notified',
        reminderStatus: 'notified',
        notifiedAt: nowIso,
        snoozeUntil: '',
      };

      queueSet.add(next.id);
      changed = true;

      const medication = findMedicationById(withTodayLogs, next.medId);
      notifiedItems.push({
        logId: next.id,
        medId: next.medId,
        drugName: medication?.drugName || '药品',
      });
    }

    const overdueBaseIso = next.status === 'snoozed' && next.snoozeUntil
      ? next.snoozeUntil
      : next.scheduledAt;
    const overdueMs = now.getTime() - new Date(overdueBaseIso).getTime();

    if (
      (next.status === 'scheduled' || next.status === 'notified' || next.status === 'snoozed')
      && overdueMs >= MISSED_THRESHOLD_MS
    ) {
      next = {
        ...next,
        status: 'missed',
        reminderStatus: 'missed',
        snoozeUntil: '',
      };

      queueSet.delete(next.id);
      changed = true;
    }

    return next;
  });

  if (!changed) {
    return {
      store: withTodayLogs,
      notifiedItems,
      changed: false,
    };
  }

  const nextStore = {
    ...withTodayLogs,
    intakeLogs: nextLogs,
    reminderQueue: Array.from(queueSet),
  };

  setStore(nextStore);

  return {
    store: nextStore,
    notifiedItems,
    changed: true,
  };
}

export function triggerReminderNow(reminderId) {
  const store = getStore();
  const queueSet = new Set(store.reminderQueue || []);
  const nowIso = new Date().toISOString();

  const { changed, nextStore } = updateSingleReminder(store, reminderId, (log) => ({
    ...log,
    status: 'notified',
    reminderStatus: 'notified',
    notifiedAt: nowIso,
    snoozeUntil: '',
  }));

  if (!changed) return;

  queueSet.add(reminderId);
  setStore(setQueueWithSet(nextStore, queueSet));
}

export function markReminderTaken(reminderId) {
  const store = getStore();
  const queueSet = new Set(store.reminderQueue || []);
  const nowIso = new Date().toISOString();

  const { changed, nextStore } = updateSingleReminder(store, reminderId, (log) => ({
    ...log,
    status: 'taken',
    reminderStatus: 'taken',
    takenAt: nowIso,
    snoozeUntil: '',
  }));

  if (!changed) return;

  queueSet.delete(reminderId);
  setStore(setQueueWithSet(nextStore, queueSet));
}

export function snoozeReminder(reminderId, minutes = 5) {
  const store = getStore();
  const queueSet = new Set(store.reminderQueue || []);
  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const { changed, nextStore } = updateSingleReminder(store, reminderId, (log) => ({
    ...log,
    status: 'snoozed',
    reminderStatus: 'snoozed',
    snoozeUntil,
    notifiedAt: log.notifiedAt || nowIso,
  }));

  if (!changed) return;

  queueSet.delete(reminderId);
  setStore(setQueueWithSet(nextStore, queueSet));
}

export function skipReminder(reminderId) {
  const store = getStore();
  const queueSet = new Set(store.reminderQueue || []);

  const { changed, nextStore } = updateSingleReminder(store, reminderId, (log) => ({
    ...log,
    status: 'skipped',
    reminderStatus: 'skipped',
    snoozeUntil: '',
  }));

  if (!changed) return;

  queueSet.delete(reminderId);
  setStore(setQueueWithSet(nextStore, queueSet));
}

export function markAllTodayTaken() {
  const store = ensureTodayReminderLogs();
  const todayKey = getTodayDateKey();
  const nowIso = new Date().toISOString();

  let changed = false;
  const queueSet = new Set(store.reminderQueue || []);

  const nextLogs = (store.intakeLogs || []).map((log) => {
    if (!(log.scheduledAt || '').startsWith(todayKey)) return log;

    const normalized = normalizeLog(log);
    if (FINAL_REMINDER_STATUS_SET.has(normalized.status)) return normalized;

    changed = true;
    queueSet.delete(normalized.id);

    return {
      ...normalized,
      status: 'taken',
      reminderStatus: 'taken',
      takenAt: nowIso,
      snoozeUntil: '',
    };
  });

  if (!changed) return;

  setStore({
    ...store,
    intakeLogs: nextLogs,
    reminderQueue: Array.from(queueSet),
  });
}

export function clearStoreForDemo() {
  window.localStorage.removeItem(STORAGE_KEY);
  initStore();
  emitStoreUpdated();
}

export function generateDefenseDemoData() {
  const demoStore = normalizeStoreSchema(buildDefenseDemoStore());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoStore));
  emitStoreUpdated();
}

export function restoreReminderDemoData() {
  generateDefenseDemoData();
  ensureTodayReminderLogs();
  processReminderCycle();
}

export function updateMedicationStock(medicationId, addQty) {
  const store = getStore();
  const medications = store.medications.map((medication) =>
    medication.id === medicationId
      ? {
          ...medication,
          stockQty: Number(medication.stockQty || 0) + Number(addQty || 0),
        }
      : medication
  );

  const nextStore = {
    ...store,
    medications,
  };

  setStore(nextStore);
}
