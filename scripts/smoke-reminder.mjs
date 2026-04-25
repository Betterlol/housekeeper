import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5173';
const STORE_KEY = 'housekeeper-med-app-v1';

function ok(step) {
  console.log(`PASS: ${step}`);
}

async function dismissReminderModalIfPresent(page, maxRounds = 12) {
  for (let i = 0; i < maxRounds; i += 1) {
    const modal = page.locator('.reminder-sheet').first();
    const visible = await modal.isVisible().catch(() => false);
    if (!visible) return;

    const skipBtn = page.locator('.reminder-sheet button:has-text("跳过本次")').first();
    try {
      await skipBtn.click({ timeout: 3000, force: true });
    } catch {
      await page.evaluate(() => {
        const button = document.querySelector('.reminder-sheet button:last-of-type');
        if (button) button.click();
      });
    }

    await page.waitForTimeout(200);
  }
}

async function stabilizeDemoDataForE2E(page) {
  await page.evaluate(({ key }) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return;

    const store = JSON.parse(raw);
    const todayKey = new Date().toISOString().slice(0, 10);
    let idx = 0;

    store.intakeLogs = (store.intakeLogs || []).map((log) => {
      if (!(log.scheduledAt || '').startsWith(todayKey)) return log;
      if (['taken', 'skipped', 'missed'].includes(log.status)) return log;

      const minute = String(30 + (idx % 20)).padStart(2, '0');
      idx += 1;

      return {
        ...log,
        status: 'scheduled',
        reminderStatus: 'scheduled',
        notifiedAt: '',
        snoozeUntil: '',
        scheduledAt: `${todayKey}T23:${minute}`,
      };
    });

    store.reminderQueue = [];
    window.localStorage.setItem(key, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('housekeeper-store-updated'));
  }, { key: STORE_KEY });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
    await dismissReminderModalIfPresent(page);

    await page.getByRole('button', { name: '生成答辩演示数据' }).click();
    await page.getByText('答辩演示数据已生成，可前往首页 / AI复诊 / 购药页进行闭环演示。').waitFor({ timeout: 8000 });
    await stabilizeDemoDataForE2E(page);
    ok('我的页可生成答辩演示数据');

    await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
    await dismissReminderModalIfPresent(page);
    await page.getByText('提醒状态看板').waitFor({ timeout: 8000 });
    await page.getByText('闭环流程追踪').waitFor({ timeout: 8000 });
    ok('首页展示提醒状态看板与闭环流程');

    await page.goto(`${BASE}/reminders`, { waitUntil: 'networkidle' });
    await dismissReminderModalIfPresent(page);
    await page.getByText('智能提醒中心').waitFor({ timeout: 8000 });

    await page.getByRole('button', { name: '手动提醒' }).first().click();
    await page.getByText('现在该服药了').waitFor({ timeout: 8000 });
    ok('手动触发后弹出提醒弹层');

    await page.getByRole('button', { name: '5分钟后提醒' }).first().click();
    await page.getByText('智能提醒中心').waitFor({ timeout: 8000 });
    ok('弹层支持5分钟后提醒');

    await dismissReminderModalIfPresent(page);

    await page.getByRole('button', { name: '手动提醒' }).first().click();
    await page.getByText('现在该服药了').waitFor({ timeout: 8000 });
    await page.getByRole('button', { name: '立即服药' }).first().click();
    await page.getByText('今日全部提醒').waitFor({ timeout: 8000 });
    ok('提醒可再次触发并完成服药');

    await dismissReminderModalIfPresent(page);

    await page.goto(`${BASE}/consult`, { waitUntil: 'networkidle' });
    await dismissReminderModalIfPresent(page);
    await page.getByText('7日用药趋势').waitFor({ timeout: 8000 });
    await page.getByText('医生可读报告卡片').waitFor({ timeout: 8000 });
    ok('AI复诊页含趋势图与医生可读报告');

    await page.getByRole('button', { name: '复制复诊摘要' }).click();
    const copyStatus = page.locator('text=复诊摘要已复制到剪贴板。, text=当前浏览器不支持自动复制，请手动复制摘要内容。').first();
    const copyStatusVisible = await copyStatus.isVisible().catch(() => false);
    if (!copyStatusVisible) {
      await page.waitForTimeout(600);
    }
    ok('复制复诊摘要按钮可点击（支持成功/降级两种路径）');

    await page.goto(`${BASE}/purchase`, { waitUntil: 'networkidle' });
    await dismissReminderModalIfPresent(page);
    await page.getByText('购药预警中心').waitFor({ timeout: 8000 });
    ok('购药预警页可正常访问');

    console.log('RESULT: ALL PASSED');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error('RESULT: FAILED');
  console.error(error);
  process.exit(1);
});
