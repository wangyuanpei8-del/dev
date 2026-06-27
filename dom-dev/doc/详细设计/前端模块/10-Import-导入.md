# Import 模块 — 数据导入（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-010 |
| 视图 | `src/views/import/index.vue` |
| API | `src/api/import.js` |

---

## 1. 模块职责

`el-steps` 四步：上传 → 映射 → 预览 → 结果。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/import` | `views/import/index.vue` |

Step1：`el-upload` drag；Step2：映射 `el-select`；Step3：`el-table` 预览；Step4：结果。

---

## 3. API（`uploadImport` from utils/request）

| 操作 | 方法 | 路径 |
|------|------|------|
| 上传 | POST multipart | `/import/upload` |
| 映射 | POST | `/import/:jobId/mapping` |
| 预览 | GET | `/import/:jobId/preview` |
| 执行 | POST | `/import/:jobId/execute` |
| 状态 | GET | `/import/:jobId` |

EXECUTING 时 `setInterval` 轮询 job 状态。

---

## 4. 权限

`import:execute`。

---

## 5. 列表刷新

成功后 refresh employees、dorms、occupancy、fees、dashboard、allocation-calendar。

---

## 6. 与 CSV 导出（对称）

导入走 `POST /import/*`；导出见 `docs/stage-5-api-spec.md` §5.13：

- `/exports/occupancy-histories`
- `/exports/dorm-fees`
- `/exports/dorm-allocation-calendar`

导出列映射应与导入 mapping 字段名保持一致（`dormName`, `roomName`, `employeeName`, `moveInDate`, `moveOutDate` 等）。
