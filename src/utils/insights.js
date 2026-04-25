function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function toDateFromKey(key) {
  return new Date(`${key}T00:00:00`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isMedActiveOnDate(medication, dateKey) {
  const startOk = !medication.startDate || medication.startDate <= dateKey;
  const endOk = !medication.endDate || medication.endDate >= dateKey;
  return startOk && endOk;
}

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function formatMonthDay(dateKey) {
  const date = toDateFromKey(dateKey);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}/${day}`;
}

function getDefaultProfile() {
  return {
    name: '张先生',
    age: 58,
    gender: '男',
    diseases: ['高血压', '2型糖尿病'],
    diagnosisDate: '待补充',
    note: '当前为基础 mock 数据。',
  };
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function buildTodaySchedule(medications, logs) {
  const today = toDateKey(new Date());
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const rows = medications
    .filter((medication) => isMedActiveOnDate(medication, today))
    .flatMap((medication) =>
      medication.times.map((time) => {
        const scheduledAt = `${today}T${time}`;
        const matchedLog = logs.find(
          (log) => log.medId === medication.id && log.scheduledAt === scheduledAt
        );

        let status = 'pending';
        if (matchedLog?.status === 'taken') {
          status = 'taken';
        } else if (matchedLog?.status === 'missed') {
          status = 'missed';
        } else {
          const diff = nowMinutes - toMinutes(time);
          status = diff >= 120 ? 'missed' : 'pending';
        }

        return {
          id: `${medication.id}-${time}`,
          medId: medication.id,
          drugName: medication.drugName,
          doseText: `${medication.dose}${medication.unit}`,
          withMeal: medication.withMeal,
          time,
          scheduledAt,
          status,
          takenAt: matchedLog?.takenAt || '',
        };
      })
    )
    .sort((a, b) => (a.time > b.time ? 1 : -1));

  return rows;
}

export function getRecentLogs(logs, days = 7) {
  const endDate = new Date();
  const startDate = addDays(endDate, -(days - 1));
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  return logs.filter((log) => {
    const dateKey = log.scheduledAt.slice(0, 10);
    return dateKey >= startKey && dateKey <= endKey;
  });
}

export function calculateSevenDayAdherence(medications, logs) {
  const endDate = new Date();
  const startDate = addDays(endDate, -6);

  let expected = 0;
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(startDate, i);
    const dayKey = toDateKey(day);

    medications.forEach((medication) => {
      if (!isMedActiveOnDate(medication, dayKey)) return;
      expected += medication.times.length;
    });
  }

  const recentLogs = getRecentLogs(logs, 7);
  const takenCount = recentLogs.filter((log) => log.status === 'taken').length;
  const missedCount = recentLogs.filter((log) => log.status === 'missed').length;
  const resolvedExpected = Math.max(expected, takenCount + missedCount);

  const adherence = resolvedExpected === 0 ? 100 : Math.round((takenCount / resolvedExpected) * 100);

  return {
    expected: resolvedExpected,
    takenCount,
    missedCount: Math.max(resolvedExpected - takenCount, missedCount),
    adherence,
  };
}

export function getSevenDayTrendData(medications, logs) {
  const endDate = new Date();
  const startDate = addDays(endDate, -6);

  const rows = [];
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(startDate, i);
    const dateKey = toDateKey(day);

    let expected = 0;
    medications.forEach((medication) => {
      if (!isMedActiveOnDate(medication, dateKey)) return;
      expected += medication.times.length;
    });

    const dayLogs = logs.filter((log) => log.scheduledAt.slice(0, 10) === dateKey);
    const taken = dayLogs.filter((log) => log.status === 'taken').length;
    const missedFromLogs = dayLogs.filter((log) => log.status === 'missed').length;
    const missed = Math.max(missedFromLogs, Math.max(0, expected - taken));
    const adherence = expected === 0 ? 100 : Math.round((taken / expected) * 100);

    rows.push({
      dateKey,
      label: formatMonthDay(dateKey),
      expected,
      taken,
      missed,
      adherence,
    });
  }

  return rows;
}

export function getLateNightMissedCount(logs) {
  const recentLogs = getRecentLogs(logs, 7);
  return recentLogs.filter((log) => {
    if (log.status !== 'missed') return false;
    const time = log.scheduledAt.slice(11, 16);
    return toMinutes(time) >= 20 * 60;
  }).length;
}

export function getAiSuggestion(medications, logs) {
  const { adherence, missedCount } = calculateSevenDayAdherence(medications, logs);
  const lateNightMissed = getLateNightMissedCount(logs);

  if (lateNightMissed >= 2) {
    return '最近7天晚间漏服较多，建议开启睡前提醒并将药盒放在床头可见位置。';
  }

  if (adherence < 80) {
    return '近期总体依从率偏低，建议固定早晚两个闹钟并关联家属提醒。';
  }

  if (missedCount > 0) {
    return '近期存在偶发漏服，建议在早餐后立即打卡，形成固定行为习惯。';
  }

  return '过去7天用药表现稳定，建议继续保持，并在复诊前导出用药记录。';
}

export function getUpcomingRefill(medications) {
  const enriched = medications
    .map((medication) => {
      const dailyUse = Number(medication.dose) * Number(medication.frequencyPerDay || medication.times.length || 1);
      const safeDailyUse = dailyUse > 0 ? dailyUse : 1;
      const remainingDays = Math.max(0, Math.floor(Number(medication.stockQty || 0) / safeDailyUse));

      return {
        ...medication,
        remainingDays,
      };
    })
    .sort((a, b) => a.remainingDays - b.remainingDays);

  return enriched[0] || null;
}

export function getMockHealthMetrics(adherence) {
  const today = new Date();
  const daySeed = Number(toDateKey(today).replace(/-/g, '').slice(-2));
  const systolic = 118 + (daySeed % 7);
  const diastolic = 73 + (daySeed % 6);
  const glucose = (5.2 + ((daySeed % 8) * 0.12)).toFixed(1);

  return {
    bloodPressure: `${systolic}/${diastolic}`,
    bloodSugar: `${glucose} mmol/L`,
    adherence: `${adherence}%`,
  };
}

export function getConsultSummary(medications, logs) {
  const sevenDay = calculateSevenDayAdherence(medications, logs);
  const recentLogs = getRecentLogs(logs, 7);

  const adverseKeywords = ['头晕', '恶心', '不适', '皮疹', '过敏', '心慌', '乏力'];
  const adverseLogs = recentLogs.filter((log) =>
    adverseKeywords.some((keyword) => (log.reason || '').includes(keyword))
  );

  const latestMissedDate = recentLogs
    .filter((log) => log.status === 'missed')
    .map((log) => log.scheduledAt.slice(0, 10))
    .sort()
    .pop();

  const nextVisit = addDays(new Date(), sevenDay.adherence < 80 ? 5 : 14);

  const summaryText =
    sevenDay.adherence < 80
      ? '近7天依从率偏低，建议尽快复诊评估当前方案，重点沟通晚间漏服场景与提醒策略。'
      : '近7天用药整体平稳，建议按计划复诊并携带本报告，便于医生快速评估疗效。';

  return {
    ...sevenDay,
    adverseCount: adverseLogs.length,
    adverseText:
      adverseLogs.length > 0
        ? adverseLogs.map((log) => `${log.scheduledAt.slice(0, 10)} ${log.reason}`).join('；')
        : '近7天未记录明确不良反应。',
    latestMissedDate: latestMissedDate || '无',
    nextVisitDate: toDateKey(nextVisit),
    aiSummary: summaryText,
  };
}

export function getDoctorReadableReport(store) {
  const medications = store.medications || [];
  const logs = store.intakeLogs || [];
  const summary = getConsultSummary(medications, logs);
  const refill = getUpcomingRefill(medications);
  const lateNightMissed = getLateNightMissedCount(logs);

  const profile = store.userProfile || getDefaultProfile();

  let missedRisk = '低风险';
  let missedRiskDesc = '近7日漏服风险可控，继续维持现有提醒策略。';

  if (summary.adherence < 80 || lateNightMissed >= 2) {
    missedRisk = '中高风险';
    missedRiskDesc = '漏服主要集中在晚间场景，建议与患者讨论提醒方式和家属协同监督。';
  } else if (summary.missedCount > 0 || summary.adherence < 90) {
    missedRisk = '中等风险';
    missedRiskDesc = '存在零星漏服，建议复盘具体诱因并优化日常服药触发点。';
  }

  const refillAdvice = refill
    ? `${refill.drugName} 预计剩余 ${refill.remainingDays} 天，建议在 3-5 天内完成复诊续方，避免断药。`
    : '当前暂无明确续方风险。';

  const communicationFocus = [
    '确认晚间服药执行障碍（外出、遗忘、睡前作息不固定）并制定替代提醒方案。',
    '复核现有血压/血糖控制目标，结合依从率变化评估是否需要调整剂量。',
    '明确续方时间节点与购药计划，减少重复购药与断药并存的风险。',
  ];

  return {
    profile,
    adherence: summary.adherence,
    adverseText: summary.adverseText,
    missedRisk,
    missedRiskDesc,
    refillAdvice,
    communicationFocus,
    summary,
  };
}

export function buildConsultCopyText(store) {
  const report = getDoctorReadableReport(store);
  const diseases = (report.profile.diseases || []).join('、');

  return [
    '【AI复诊摘要】',
    `患者：${report.profile.name}，${report.profile.age}岁，${report.profile.gender}`,
    `慢病：${diseases}`,
    `近7日依从率：${report.adherence}%`,
    `漏服风险：${report.missedRisk}（${report.missedRiskDesc}）`,
    `不良反应：${report.adverseText}`,
    `续方建议：${report.refillAdvice}`,
    '医生沟通重点：',
    `1. ${report.communicationFocus[0]}`,
    `2. ${report.communicationFocus[1]}`,
    `3. ${report.communicationFocus[2]}`,
  ].join('\n');
}

export function getPurchaseInsights(medications) {
  return medications.map((medication) => {
    const frequency = Number(medication.frequencyPerDay || medication.times.length || 1);
    const dailyUse = Math.max(1, Number(medication.dose || 1) * frequency);
    const stock = Number(medication.stockQty || 0);
    const remainingDays = Math.floor(stock / dailyUse);

    const lowStock = remainingDays <= 7;
    const duplicateRisk = remainingDays >= 20;

    return {
      ...medication,
      dailyUse,
      remainingDays,
      lowStock,
      duplicateRisk,
      riskMessage: duplicateRisk
        ? '当前库存仍可覆盖较长周期，重复购药风险较高。'
        : '库存消耗节奏正常，可按需补货。',
    };
  });
}

export function updateMedicationStockList(medications, medId, addQty) {
  return medications.map((medication) =>
    medication.id === medId
      ? {
          ...medication,
          stockQty: Number(medication.stockQty || 0) + addQty,
        }
      : medication
  );
}

export function getWeekWindowLabel() {
  const end = new Date();
  const start = addDays(end, -6);
  const monthDay = (date) => {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${month}-${day}`;
  };

  return `${monthDay(start)} ~ ${monthDay(end)}`;
}

export function isDueSoonDate(dateKey, days = 7) {
  if (!dateKey) return false;
  const target = toDateFromKey(dateKey);
  const today = toDateFromKey(toDateKey(new Date()));
  const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= days;
}
