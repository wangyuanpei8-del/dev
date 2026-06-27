# Employees 模块 — 社员管理（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-004 |
| 视图 | `src/views/employees/index.vue` |
| API | `src/api/employees.js` |

---

## 1. 模块职责

社員マスタ一覧 + Dialog CRUD；初回入寮日 Admin 修正 Dialog。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/employees` | `views/employees/index.vue` |

一覧 + 筛选（`q`, `employeeType`, `gender`）+ Dialog 新增/编辑。  
初回入寮日：`v-permission:role="'SYSTEM_ADMIN'"` 打开修正 Dialog。

---

## 3. API（`src/api/employees.js`）

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 一覧 | GET | `/employees` | `employeeList` |
| 创建 | POST | `/employees` | refreshList |
| 更新 | PATCH | `/employees/:id` | refreshList |
| 删除 | DELETE | `/employees/:id` | refreshList |
| 初回日 | PATCH | `/employees/:id/first-dorm-use-date` | refreshList |

---

## 4. 表单校验 rules

```javascript
export const employeeRules = {
  fullName: [{ required: true, message: '氏名を入力', trigger: 'blur' }],
  employeeType: [{ required: true, trigger: 'change' }],
  gender: [{ required: true, trigger: 'change' }],
};
```

---

## 5. 权限

`employees:read` / `employees:write`；初回日 `SYSTEM_ADMIN`。

---

## 6. 列表刷新

`fetchEmployeeList()`；初回日修正后 refresh + 提示 `ElMessage.success`。
