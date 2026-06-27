# Dorms 模块 — 寮管理（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-005 |
| 视图 | `src/views/dorms/index.vue`, `detail.vue` |
| API | `src/api/dorms.js` |

---

## 1. 模块职责

寮一覧 + Dialog CRUD；详情页 `el-tabs`（基本 / 部屋 / 履歴）。  
基本情報 Tab：**責任者**（`el-select` 社員，0~1 名，对应 `responsibleEmployeeId` / カレンダー ★）。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/dorms` | `views/dorms/index.vue` |
| `/dorms/:id` | `views/dorms/detail.vue` |

---

## 3. API

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 一覧 | GET | `/dorms` | `dormList` |
| 详情 | GET | `/dorms/:id` | — |
| 创建/更新/删除 | POST/PATCH/DELETE | `/dorms` | refreshList |

---

## 4. 表单校验 rules

```javascript
export const dormRules = {
  code: [{ required: true, trigger: 'blur' }],
  name: [{ required: true, trigger: 'blur' }],
  address: [{ required: true, trigger: 'blur' }],
  layoutType: [{ required: true, trigger: 'blur' }],
  genderType: [{ required: true, trigger: 'change' }],
};
```

---

## 5. 权限

`dorms:read` / `dorms:write`；`genderType` 变更仅 Admin。

---

## 6. 列表刷新

`fetchDormList()`；详情 Tab 部屋见 [06-Rooms](./06-Rooms-部屋管理.md)。
