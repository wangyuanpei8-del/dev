# Occupancy 模块 — 入退寮（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-007 |
| 视图 | `src/views/occupancy/*.vue` |
| API | `src/api/occupancy.js` |

---

## 1. 模块职责

履歴一覧、入居向导（`el-steps`）、退寮页、長期利用一覧。  
（中心业务视图以 **寮割カレンダー** `/allocation-calendar` 为准；本模块提供 CRUD/向导入口。）

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/occupancy` | `views/occupancy/index.vue` |
| `/occupancy/create` | `views/occupancy/create.vue` |
| `/occupancy/:id/move-out` | `views/occupancy/move-out.vue` |
| `/occupancy/long-term` | `views/occupancy/long-term.vue` |

---

## 3. 入居向导（`el-steps`）

Step1 社員 → Step2 部屋（`assignable-rooms`）→ Step3 日期 → Step4 確認 POST。

空室文案：「該当する空室がありません」。

---

## 4. API

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 一覧 | GET | `/occupancy-histories` | `occupancyList` |
| 入居 | POST | `/occupancy-histories` | refresh |
| 退寮 | POST | `/occupancy-histories/:id/move-out` | refresh |
| 長期 | GET | `/occupancy-histories/long-term-warnings` | `longTermList` |
| 导出 CSV | GET | `/exports/occupancy-histories` | 文件下载 |

---

## 5. 表单校验 rules

```javascript
export const occupancyRules = {
  employeeId: [{ required: true, trigger: 'change' }],
  roomId: [{ required: true, trigger: 'change' }],
  moveInDate: [{ required: true, trigger: 'change' }],
};
// moveOut >= moveIn 自定义 validator
```

---

## 6. 权限

`occupancy:read` / `occupancy:write` — `v-permission`。

---

## 7. 列表刷新

入居/退寮成功后 `router.push('/occupancy')` 并 refresh；invalidate vacancies、dorms、dashboard。
