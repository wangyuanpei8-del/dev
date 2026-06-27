# Users 模块 — 用户管理（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-002 |
| 视图 | `src/views/settings/users/index.vue` |
| API | `src/api/users.js` |
| 权限 | 仅 `SYSTEM_ADMIN` |

---

## 1. 模块职责

应用账号一覧；**el-dialog** 新增/编辑；`is_active` 停用（无 DELETE API）。

---

## 2. 页面

| 路由 | 文件 | 说明 |
|------|------|------|
| `/settings/users` | `views/settings/users/index.vue` | 一覧 + Dialog CRUD |

一覧：`el-table` + 筛选（role、isActive）+ `el-pagination`。

---

## 3. API（`src/api/users.js`）

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 一覧 | GET | `/users` | `userList` |
| 创建 | POST | `/users` | refreshList |
| 更新 | PATCH | `/users/:id` | refreshList |

---

## 4. 表单校验 rules

```javascript
export const userRules = {
  email: [{ required: true, type: 'email', trigger: 'blur' }],
  displayName: [{ required: true, message: '表示名を入力', trigger: 'blur' }],
  password: [{ min: 10, message: '10文字以上', trigger: 'blur' }],
  role: [{ required: true, message: 'ロールを選択', trigger: 'change' }],
};
```

---

## 5. 权限

侧栏「ユーザー」：`role === SYSTEM_ADMIN`；`v-permission` 写按钮。

---

## 6. 交互

- 停用：`ElMessageBox.confirm` → PATCH `isActive: false`
- Dialog 关闭：`resetFields()`

---

## 7. 列表刷新

`fetchUserList()` 在 create/update/停用后调用。
