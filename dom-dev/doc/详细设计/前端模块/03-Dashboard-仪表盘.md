# Dashboard 模块 — 仪表盘（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-003 |
| 视图 | `src/views/dashboard/index.vue` |
| 图表 | Echarts（`components/charts/`） |

---

## 1. 模块职责

KPI 四卡片（Echarts 可选迷你图）+ 快捷操作 + 最近操作ログ + `el-table` 10 条。

---

## 2. 页面布局

| 区域 | 组件 |
|------|------|
| KPI | 4× `el-card` 或 Echarts gauge |
| 快捷 | `el-button` → router-link |
| ログ | `el-table` 精简列 |

---

## 3. API（`src/api/dashboard.js` 或分模块调用）

| 指标 | API |
|------|-----|
| 長期警告 | `GET /occupancy-histories/long-term-warnings` |
| 空室 | `GET /vacancies?asOfDate=` 累加 |
| DRAFT 寮費 | `GET /dorm-fees?status=DRAFT` → total |
| 在室 | `GET /occupancy-histories/occupied-count?activeOn=`（或备选） |
| 最近ログ | `GET /audit-logs?pageSize=10` |

`onMounted` 并行 `Promise.all` 加载；`v-loading` 整页。

---

## 4. Echarts

- 可选：长期警告趋势折线图（Phase 2）
- KPI 数字为主，MVP 可不绑图表

---

## 5. 权限

快捷按钮 `v-permission` 控制显示。

---

## 6. 列表刷新

进入页面 `loadDashboard()`；从子页返回 `onActivated` 可选刷新。
