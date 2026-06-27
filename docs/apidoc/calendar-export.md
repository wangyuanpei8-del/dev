# Calendar / Export / System Settings API

## 寮割カレンダー

| Method | Path | 前端函数 | Query |
|--------|------|----------|-------|
| GET | `/dorm-allocation-calendar` | `fetchCalendar(params)` | `yearMonth`, `sort`, `location?`, `q?` |

## 系统参数

| Method | Path | 前端函数 | Body |
|--------|------|----------|------|
| GET | `/system-settings/move-out-warning-days` | `fetchMoveOutWarningDays()` | — |
| PATCH | `/system-settings/move-out-warning-days` | `patchMoveOutWarningDays(days)` | `{ days }` |

## CSV 导出（`responseType: blob`）

| Method | Path | 前端函数 | Query |
|--------|------|----------|-------|
| GET | `/exports/dorm-allocation-calendar` | `exportCalendarCsv(params)` | `yearMonth`, `sort`, `location?`, `q?` |
| GET | `/exports/occupancy-histories` | `exportOccupancyHistories(params)` | `yearMonth?`, `q?`, `dormId?` |
| GET | `/exports/dorm-fees` | `exportDormFees(params)` | `yearMonth?`, `status?`, `employeeId?` |

**页面导出按钮**：`views/occupancy/index.vue`、`views/fees/index.vue`、`allocation-calendar`（日历 CSV + 印刷）
