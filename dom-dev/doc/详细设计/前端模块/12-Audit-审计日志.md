# Audit 模块 — 审计日志（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-012 |
| 视图 | `src/views/audit/index.vue` |
| API | `src/api/audit.js` |

---

## 1. 模块职责

操作ログ只读；`el-drawer` + `JsonViewer` 展示 before/after JSON。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/audit` | `views/audit/index.vue` |

筛选：entityType、日期范围、`el-pagination`。

---

## 3. AuditAction

CREATE | UPDATE | DELETE | CONFIRM | IMPORT

---

## 4. API

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 一覧 | GET | `/audit-logs` | `auditLogList` |

---

## 5. 权限

`audit:read`（VIEWER 无）。

---

## 6. 列表刷新

筛选/翻页 `fetchAuditLogs()`。
