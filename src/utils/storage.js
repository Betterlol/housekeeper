import { mockStore } from '../data/mock';

const STORAGE_KEY = 'housekeeper-med-app-v1';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDefenseDemoStore() {
  const today = new Date();
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

  const missedKeys = new Set([
    `${dayKeys[2]}|med-1|08:00`,
    `${dayKeys[4]}|med-2|20:00`,
  ]);
  const adverseEventKey = `${dayKeys[5]}|med-3|21:00`;

  let logCounter = 1;
  const intakeLogs = [];

  dayKeys.forEach((dayKey) => {
    medications.forEach((medication) => {
      medication.times.forEach((time) => {
        const key = `${dayKey}|${medication.id}|${time}`;
        const isMissed = missedKeys.has(key);

        intakeLogs.push({
          id: `log-demo-${logCounter}`,
          medId: medication.id,
          scheduledAt: `${dayKey}T${time}`,
          status: isMissed ? 'missed' : 'taken',
          takenAt: isMissed ? '' : `${dayKey}T${time}`,
          reason: key === adverseEventKey ? '轻微头晕，已自行缓解' : '',
        });

        logCounter += 1;
      });
    });
  });

  return {
    medications,
    intakeLogs,
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

export function generateDefenseDemoData() {
  const demoStore = buildDefenseDemoStore();
  setStore(demoStore);
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
