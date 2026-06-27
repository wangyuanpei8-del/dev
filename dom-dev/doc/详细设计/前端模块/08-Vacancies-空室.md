# Vacancies 模块 — 空室（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-008 |
| 视图 | `src/views/vacancies/index.vue` |
| API | `src/api/vacancies.js` |

---

## 1. 模块职责

按寮 `el-collapse` / Card 展示部屋状态 Badge。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/vacancies` | `views/vacancies/index.vue` |

筛选：`el-date-picker`、`el-select`（location、genderType）。

> `location` 取值统一为 `TOKYO|OSAKA|NAGOYA|OTHER`（与最新要件定義書一致）。

---

## 3. UI

| Badge | status |
|-------|--------|
| 空室 success | VACANT |
| 在室 info + 氏名 | OCCUPIED |
| 予定 warning | RESERVED |

---

## 4. API

| 操作 | 方法 | 路径 | 列表 Key |
|------|------|------|----------|
| 空室 | GET | `/vacancies` | `vacancyList` |
| 可入居 | GET | `/vacancies/assignable-rooms` | `assignableRooms` |

---

## 5. 权限

`vacancies:read` — 只读。

---

## 6. 列表刷新

筛选变更 `@change` → `fetchVacancies()`。
