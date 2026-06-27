# Departments API（所属マスタ）

| Method | Path | 前端函数 | Query / Body |
|--------|------|----------|--------------|
| GET | `/departments` | `getDepartments(params)` | `q`, `page`, `pageSize` |
| GET | `/departments/:id` | `getDepartment(id)` | — |
| POST | `/departments` | `createDepartment(data)` | `{ name, code? }` |
| PATCH | `/departments/:id` | `updateDepartment(id, data)` | `{ name?, code? }` |
| DELETE | `/departments/:id` | `deleteDepartment(id)` | 软删除 |

**页面**：`/settings/departments` → `views/settings/departments/index.vue`（仅 `SYSTEM_ADMIN`）

**调用链**：员工表单 `departmentId` 下拉 ← `getDepartments({ page:1, pageSize:500 })`
