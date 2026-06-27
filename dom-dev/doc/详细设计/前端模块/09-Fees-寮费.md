# Fees 模块 — 寮费（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-009 |
| 视图 | `src/views/fees/index.vue`, `calculate.vue`, `rates.vue` |
| API | `src/api/fees.js` |

---

## 1. 模块职责

寮費一覧、算定页、费率维护（Admin）；`JsonViewer` 展示 calculationBasis。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/fees` | `views/fees/index.vue` |
| `/fees/calculate` | `views/fees/calculate.vue` |
| `/fees/rates` | `views/fees/rates.vue` |

確定：`ElMessageBox.confirm` → POST confirm。

一覧页工具栏：**CSV 导出** → `GET /exports/dorm-fees`（携带当前 `yearMonth`、筛选条件）。

---

## 3. API

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 一覧 | GET | `/dorm-fees` | `feeList` |
| 算定 | POST | `/dorm-fees/calculate` | refresh |
| 確定 | POST | `/dorm-fees/:id/confirm` | refresh |
| 费率 | GET/POST | `/fee-rates` | `feeRateList` |

---

## 4. 表单校验 rules

```javascript
export const calculateRules = {
  yearMonth: [{ required: true, pattern: /^\d{4}-\d{2}$/, trigger: 'blur' }],
};
```

---

## 5. 权限

`fees:read` / `fees:write` / `fees:confirm` / `fee-rates:write`。

---

## 6. 列表刷新

算定/確定后 `fetchFeeList()` + dashboard refresh。
