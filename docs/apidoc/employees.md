# Employees API

| Method | Path | 前端函数 | Query / Body |
|--------|------|----------|--------------|
| GET | `/employees` | `getEmployees(params)` | `q`, `employeeType`, `gender`, `page`, `pageSize` |
| GET | `/employees/:id` | `getEmployee(id)` | — |
| POST | `/employees` | `createEmployee(data)` | `fullName`, `employeeCode`, `employeeType`, `gender`, `departmentId?`, … |
| PATCH | `/employees/:id` | `updateEmployee(id, data)` | 同上 + `version`（乐观锁） |
| DELETE | `/employees/:id` | `deleteEmployee(id)` | 软删除 |
| PATCH | `/employees/:id/first-dorm-use-date` | `updateFirstDormUseDate(id, data)` | `{ firstDormUseDate }` |

**所属**：使用 `departmentId`（UUID），不再使用自由文本 `department`。后端仍接受 legacy `department` 文本用于解析。

**调用链（编辑）**：`views/employees/index.vue` `openDialog` → `getEmployee(id)` → `updateEmployee(id, { …, version })` → `EmployeesController.update`
