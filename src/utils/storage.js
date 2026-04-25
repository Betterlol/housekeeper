import { mockStore } from '../data/mock';

const STORAGE_KEY = 'housekeeper-med-app-v1';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

export function initStore() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockStore));
  }
}

export function getStore() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    initStore();
    return clone(mockStore);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mockStore));
    return clone(mockStore);
  }
}

export function setStore(nextStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
}

export function getMedications() {
  return getStore().medications || [];
}

export function getIntakeLogs() {
  return getStore().intakeLogs || [];
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
  const nextStore = {
    ...store,
    medications: store.medications.filter((item) => item.id !== medicationId),
    intakeLogs: store.intakeLogs.filter((item) => item.medId !== medicationId),
  };
  setStore(nextStore);
}

export function upsertIntakeLog(payload) {
  const store = getStore();
  const existingIndex = store.intakeLogs.findIndex(
    (item) => item.medId === payload.medId && item.scheduledAt === payload.scheduledAt
  );

  const nextLogs = [...store.intakeLogs];
  if (existingIndex === -1) {
    nextLogs.push({ id: `log-${Date.now()}`, ...payload });
  } else {
    nextLogs[existingIndex] = {
      ...nextLogs[existingIndex],
      ...payload,
    };
  }

  const nextStore = {
    ...store,
    intakeLogs: nextLogs,
  };

  setStore(nextStore);
}

export function clearStoreForDemo() {
  window.localStorage.removeItem(STORAGE_KEY);
  initStore();
}
