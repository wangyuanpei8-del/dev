# Import API

| Method | Path | 前端函数 | 说明 |
|--------|------|----------|------|
| POST | `/import/upload` | `uploadImport(file)` | multipart；支持 `.xlsx` `.xls` `.csv` |
| POST | `/import/:jobId/mapping` | `setMapping(jobId, data)` | 列映射 |
| GET | `/import/:jobId/preview` | `getPreview(jobId)` | 预览校验 |
| POST | `/import/:jobId/execute` | `executeImport(jobId)` | 执行导入 |
| GET | `/import/:jobId` | `getImportJob(jobId)` | 任务状态轮询 |

**页面**：`views/import/index.vue`（4 步向导）
