# Calendar 模块 — 寮割カレンダー（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-014 |
| 视图 | `src/views/allocation-calendar/index.vue` |
| API | `src/api/calendar.js` |
| 关联 | 最新要件定義書（詳細版）A（寮割カレンダー中心画面）、`docs/stage-5-api-spec.md` `GET /dorm-allocation-calendar` |

---

## 1. 模块职责

以 Excel 寮割表为原型的中心画面：

- 地域过滤（`TOKYO|OSAKA|NAGOYA|OTHER`）
- 月切替（前月/翌月，跨年）
- 氏名部分一致搜索（追加要件）
- 寮名昇顺排序（追加要件）
- 日粒度可视化（在室黄色）
- 规则冲突提示（同室同日多人的 cell 红底 + tooltip）
- 退寮警告（默认 14 天，`/system-settings/move-out-warning-days` 可配置）
- CSV 导出、印刷（A4/A3、寮ごと分页）

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/allocation-calendar` | `views/allocation-calendar/index.vue` |

页面结构参考 `docs/stage-6-page-design.md`「寮割カレンダー」章节。

---

## 3. 关键业务口径（必须与后端一致）

### 3.1 在室判定（闭区间）

在目标月某日 `D`（DATE）：

- `moveInDate <= D`
- 且（`moveOutDate` 为 `NULL` 或 `moveOutDate >= D`）
- `moveOutDate = NULL` 视为无期限（等价 `9999-12-31`）

### 3.2 显示对象

“目标月有任意 1 天在籍”的入居者必须显示。

---

## 4. API

| 操作 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取日历 | GET | `/dorm-allocation-calendar` | `yearMonth` + 可选 `location/q/sort` |
| 导出 CSV | GET | `/exports/dorm-allocation-calendar` | 与日历相同 query，文件下载 |
| 退寮警告天数 | GET/PATCH | `/system-settings/move-out-warning-days` | 默认 14（PATCH 仅 Admin） |

查询参数：

- `yearMonth=YYYY-MM` 必填
- `location`：`TOKYO|OSAKA|NAGOYA|OTHER`
- `q`：氏名部分一致
- `sort=dormNameAsc`

响应中 `occupiedDays`/`conflicts`/`warnings` 直接驱动 UI 渲染。

- **`isLeader`**：后端根据 `dorms.responsible_employee_id === row.employeeId` 计算，前端只负责显示 ★。
- **`department`**：来自 `departments.name`（`employees.department_id`），禁止前端写死所属文本。

---

## 5. 交互与状态

- loading：表格骨架屏
- empty：提示“該当するデータがありません”
- error：显示 API message + 重试按钮

---

## 6. 印刷（前端 MVP）

| 项 | 约定 |
|----|------|
| 触发 | 工具栏「印刷」→ `window.print()` 或 `/allocation-calendar/print` 子路由 |
| 纸张 | `paperSize`: `A4` \| `A3`（`@page size`） |
| 方向 | `landscape` 固定 |
| 分页 | 每个 `dormId` 一页（`break-after: page`） |
| 样式 | 独立 `@media print`；`print-color-adjust: exact` 保留黄/红 |

印刷数据与 `fetchCalendar()` 使用相同 API，避免二次口径。

---

## 7. 文件结构建议

```text
views/allocation-calendar/
├── index.vue          # 主画面
├── components/
│   ├── CalendarGrid.vue
│   ├── CalendarToolbar.vue
│   └── PrintLayout.vue   # 印刷专用（可选独立路由）
└── composables/
    └── useAllocationCalendar.js
```

`src/api/calendar.js`：`fetchCalendar`, `exportCalendarCsv`, `fetchMoveOutWarningDays`。

