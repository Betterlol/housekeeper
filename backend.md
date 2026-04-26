# Backend 说明（本项目为前端内后端）

> 本项目没有独立服务端，数据层由 `localStorage + storage.js` 承担。

## 1. 数据存储
- 存储键：`housekeeper-med-app-v1`
- 事件：`housekeeper-store-updated`
- 核心文件：`src/utils/storage.js`

## 2. Schema（v2）
`mockStore` 见 `src/data/mock.js`，默认是空业务数据（便于新手引导）：
- `schemaVersion`
- `medications[]`
- `reminderRules[]`
- `reminderInstances[]`
- `intakeLogs[]`
- `reminderQueue[]`
- `experienceState`
- `userProfile`
- `adverseEvents[]`
- `demoMeta`

### 2.1 实体定义
1. Medication（药品）
- `id, drugName, spec, dose, unit, withMeal, stockQty, stockUnit, startDate, endDate, sourceLabel, frequencyPerDay, times`

2. ReminderRule（闹钟规则）
- `id, medicationId, time, enabled, repeatDays, retryIntervalMinutes, maxRetryCount, createdAt, updatedAt`

3. ReminderInstance（每日实例）
- `id, ruleId, medicationId, scheduledAt, currentTriggerAt, retryCount`
- `internalStatus`: `waiting/ringing/snoozed/retrying/completed/expired`
- `visibleStatus`: `off/pending/taken/missed/skipped`
- `lastNotifiedAt, notifiedAt, completedAt, snoozeUntil, takenAt`

4. IntakeLog（结果日志）
- `id, medicationId, medId, reminderInstanceId, scheduledAt, takenAt, status, reason`

## 3. 状态与调度规则

### 3.1 用户可见状态（页面展示）
- `off` 关闭
- `pending` 待服药
- `taken` 已服药
- `missed` 已漏服
- `skipped` 已跳过

### 3.2 内部状态（调度）
- `waiting -> ringing -> retrying -> (taken/skipped/missed)`

### 3.3 核心调度函数
- `processReminderCycle()`
  - 扫描今日实例
  - 到点进入 `ringing`
  - 超过 `RING_ACK_TIMEOUT_MS` 未处理则进入重试
  - 达到 `maxRetryCount` 自动 `missed`
  - 维护 `reminderQueue`（弹窗队列）

### 3.4 用户动作函数
- `markReminderTaken` / `skipReminder` / `markReminderMissed`
- `snoozeReminder`（响铃后稍后提醒）
- `postponeReminderBeforeRing`（未响铃前延后）
- `resetReminderToPending`（误操作恢复）
- `triggerReminderNow`（手动触发）

## 4. 时间与时区策略
- 全部转为本地时间字符串（非 UTC 切片）
- 使用 `toLocalDateTime / parseDateLike / compareIso` 等工具
- 目的：减少“显示时间和触发时间不一致”的问题

## 5. 初始化、迁移、兼容
- `initStore()` 首次写入 `mockStore`
- `normalizeStoreSchema()` 做 schema 归一化和旧数据迁移
- 兼容 legacy `status/reminderStatus` 字段
- 自动补全缺失 Rule/Instance/Log 的关联关系

## 6. Onboarding & Experience
- `experienceState` 记录引导状态：
  - `onboardingDismissed`
  - `onboardingCompleted`
  - `currentOnboardingStep`
  - `consultViewed`
  - `purchaseViewed`
- `syncOnboardingProgress()` 根据真实数据自动推进步骤

## 7. 演示模式
- `generateDefenseDemoData()` 生成完整答辩数据
- `clearStoreForDemo()` 重置到基础数据
- `restoreReminderDemoData()` 生成演示数据并同步提醒实例

## 8. 通知系统
- 文件：`src/utils/notification.js`
- `ensureNotificationPermission()` 请求权限
- `sendMedicationNotification(drugName)` 发送浏览器通知
- 拒绝权限时自动降级为站内弹层

## 9. 给下一位AI的改造建议
1. 改数据结构只在 `normalizeStoreSchema` 统一处理，避免页面散改。
2. 提醒相关新增行为先写在 `storage.js`，再暴露给页面调用。
3. 涉及日期比较请复用本地时间工具，不要再用 `toISOString().slice(...)`。
