# Equipment 模块 — 备品・保管场所（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-011 |
| 视图 | `src/views/equipment/index.vue` |
| API | `src/api/equipment.js` |

---

## 1. 模块职责

`el-tabs`：备品マスタ + 保管场所；各 Tab 一覧 + Dialog CRUD。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/equipment` | `views/equipment/index.vue` |

---

## 3. API

### 备品 `/equipment-items`

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| CRUD | GET/POST/PATCH/DELETE | `/equipment-items` | `equipmentItems` |

### 保管 `/storage-locations`

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| CRUD | GET/POST/PATCH/DELETE | `/storage-locations` | `storageLocations` |

---

## 4. 表单校验 rules

```javascript
export const equipmentItemRules = {
  name: [{ required: true, trigger: 'blur' }],
};
export const storageLocationRules = {
  name: [{ required: true, trigger: 'blur' }],
};
```

---

## 5. 权限

`equipment:read` / `equipment:write`。

---

## 6. 列表刷新

各 Tab 独立 `fetchList()`。
