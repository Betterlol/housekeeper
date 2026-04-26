# 慢病用药小管家（Housekeeper）

这是一个基于 **React + Vite + Tailwind + localStorage** 的前端单页应用，定位为慢病患者用药管理与比赛演示项目。

项目当前重点：
- 真实提醒流程（规则 + 实例 + 重试 +漏服判定）
- 闭环体验（问诊/复诊 -> 购药 -> 用药 -> 续方）
- 演示模式（可一键生成答辩数据）
- UI 模块化重构（`home/consult/plan/profile` 已拆分）

## 技术栈
- React 18
- Vite 5
- React Router v6
- Tailwind CSS
- localStorage（无后端服务）

## 本地运行
```bash
npm install
npm run dev
```

如果 5173 端口被占用，Vite 会自动切到下一个端口（如 5174）。

## 打包
```bash
npm run build
npm run preview
```

## 路由
- `/home` 首页（今日用药、流程、引导入口）
- `/plan` 用药计划（药品管理、处方导入）
- `/reminders` 提醒中心（闹钟规则管理）
- `/consult` AI复诊（报告、趋势、风险、动作）
- `/purchase` 购药建议（动态补货分析）
- `/profile` 个人健康账户（档案、入口、演示模式）

## 当前核心能力
1. 用药计划（Medication）：新增/编辑/删除药品，处方导入（mock AI 解析）。
2. 提醒规则（ReminderRule）：绑定药品、设置时间、开关、重试间隔、最大次数。
3. 提醒实例（ReminderInstance）：按天生成，支持 ringing/retrying/missed 等内部调度。
4. 服药记录（IntakeLog）：taken/skipped/missed 结果沉淀。
5. 提醒弹窗 + 浏览器通知：到点弹层，支持已服药/稍后提醒/跳过。
6. AI复诊：7日趋势、医生可读报告、摘要复制、演示问答与动作。
7. 购药页：根据当前 medications + rules 动态生成库存风险和补货建议。
8. 新手引导：空数据首次进入触发，按步骤推进并记录状态。
9. 演示模式：在“我的”页一键生成/重置答辩数据。

## 文档导航
- [backend.md](./backend.md)：本项目“前端内后端（localStorage）”数据与提醒引擎说明。
- [fontend.md](./fontend.md)：前端页面与组件分层、UI 结构与二开建议。

## 交接建议（给下一位AI）
1. 先看 `src/utils/storage.js`：所有关键业务状态都在这里。
2. 再看 `src/hooks/useReminderEngine.js`：提醒循环与通知入口。
3. 页面扩展优先走 `src/features/*` 模块，不要把逻辑堆回 page。
4. 修改涉及时间逻辑时，统一使用 `storage.js` 内本地时间工具，避免时区回归。
