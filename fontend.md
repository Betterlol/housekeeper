# Frontend 说明

## 1. 总体架构
- 入口：`src/main.jsx`
- 路由壳：`src/App.jsx`
- 全局样式：`src/index.css`
- 页面：`src/pages/*`
- 模块化 UI：`src/features/*`
- 通用组件：`src/components/*`

当前采用“Page 容器 + Feature 组件”的分层：
- Page 负责数据读取、事件编排、路由跳转
- Feature 负责纯 UI + 局部交互

## 2. 页面与模块映射

### 2.1 Home
- 页面：`src/pages/HomePage.jsx`
- 模块：`src/features/home/*`
- 功能：健康总览、今日任务流、提醒中心、引导弹层入口

### 2.2 Plan（用药计划）
- 页面：`src/pages/PlanPage.jsx`
- 模块：`src/features/plan/*`
- 功能：
  - 药品管理（增删改）
  - 处方导入（mock AI 解析）
  - ActionSheet 操作入口（编辑/续方/提醒/删除）

### 2.3 Reminders
- 页面：`src/pages/RemindersPage.jsx`
- 功能：规则管理、状态管理、延后、手动触发、一键已服药、演示提醒恢复

### 2.4 Consult
- 页面：`src/pages/ConsultPage.jsx`
- 模块：`src/features/consult/*`
- 功能：
  - AI Hero 驾驶舱
  - 风险控制台（可标记已处理）
  - 行为分析趋势
  - 复诊摘要（复制/发送医生）
  - 演示问答与建议行动

### 2.5 Purchase
- 页面：`src/pages/PurchasePage.jsx`
- 功能：智能匹配 loading、动态购药建议、模拟下单流程

### 2.6 Profile
- 页面：`src/pages/ProfilePage.jsx`
- 组件：`src/components/profile/*`
- 功能：
  - 个人健康账户卡
  - 慢病档案卡
  - 健康数据入口（部分真实跳转）
  - 比赛演示模式（生成/重置）
  - 编辑档案 & 导入报告弹层

## 3. 导航
底部 Tab（`src/components/TabBar.jsx`）：
- 首页 `/home`
- 用药计划 `/plan`
- 提醒 `/reminders`
- AI复诊 `/consult`
- 购药 `/purchase`
- 我的 `/profile`

## 4. 提醒弹层
- 组件：`src/components/ReminderModal.jsx`
- 来源：`useReminderEngine()` 返回的 `activeReminders`
- 动作：已服药 / 稍后提醒 / 跳过本次

## 5. 样式与交互约定
- 移动端优先，最大宽度容器在 `AppShell`。
- BottomSheet 样式统一使用：
  - `.sheet-overlay`
  - `.sheet-panel`
- 视觉方向：医疗健康、克制、可答辩展示。

## 6. 数据读取模式
- 页面统一用 `useStoreSnapshot()` 订阅 store
- 需要今日实例自动同步时：`useStoreSnapshot({ ensureToday: true })`

## 7. 新功能开发建议
1. 先扩 `storage.js` 行为函数，再在页面挂按钮。
2. 新页面/大块改造优先拆 `features/<domain>/`。
3. 跳转入口尽量真实可达，无法完成时再用 alert 占位。
4. 比赛演示相关能力（demo 按钮、mock loading、mock 结果）保留，不要删除。

## 8. 已知注意点
- 项目无后端，所有状态刷新后来自 localStorage。
- 若本地状态异常，可在“我的”页点“重置演示数据”回到基础状态。
- 如果 dev 端口占用，Vite 会自动切换端口（看终端输出）。
