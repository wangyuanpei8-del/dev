# Users API（Admin）

| Method | Path | 前端函数 | Query / Body |
|--------|------|----------|--------------|
| GET | `/users` | `getUsers(params)` | `role?`, `isActive?`, `page`, `pageSize` |
| POST | `/users` | `createUser(data)` | `{ email, displayName, password, role }` |
| PATCH | `/users/:id` | `updateUser(id, data)` | 角色/启用；停用 `{ isActive: false }` |

**页面**：`/settings/users`（仅 `SYSTEM_ADMIN`）
