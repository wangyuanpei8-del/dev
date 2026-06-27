# Rooms 模块 — 部屋管理（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-006 |
| 视图 | 嵌入 `views/dorms/detail.vue` Tab；Dialog 编辑 |
| API | `src/api/rooms.js` |

---

## 1. 模块职责

部屋マスタ；在寮详情 Tab 维护；Dialog 新增/编辑。

---

## 2. 页面

- `/dorms/:id` → Tab「部屋一覧」`el-table`
- 部屋编辑：`el-dialog`（或 `/dorms/:dormId/rooms/:roomId` 可选）

---

## 3. API

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 一覧 | GET | `/dorms/:dormId/rooms` | `roomList` |
| 创建 | POST | `/dorms/:dormId/rooms` | refresh |
| 更新 | PATCH | `/rooms/:id` | refresh |
| 删除 | DELETE | `/rooms/:id` | refresh |

---

## 4. 表单校验 rules

```javascript
export const roomRules = {
  code: [{ required: true, trigger: 'blur' }],
  name: [{ required: true, trigger: 'blur' }],
  areaSqm: [{ required: true, type: 'number', trigger: 'blur' }],
  roomType: [{ required: true, trigger: 'change' }],
};
```

---

## 5. 权限

`rooms:read` / `rooms:write`。

---

## 6. 列表刷新

`fetchRoomList(dormId)` 后 refresh vacancies。
