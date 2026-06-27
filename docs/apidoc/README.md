# API 文档索引（apps/api）

> **Base URL**：`/api/v1`  
> **认证**：`Authorization: Bearer <access_token>`（除 `login` / `refresh` 外）  
> **统一响应**：`{ code: 0, message: "success", data }`；分页 `data: { items, total, page, pageSize }`  
> **详细规格**：`docs/stage-5-api-spec.md`（错误码、业务日期口径、乐观锁等）

## 模块文档

| 文档 | 后端 Controller | 前端 Api |
|------|-----------------|----------|
| [auth.md](./auth.md) | `AuthController` | `api/auth.js` |
| [employees.md](./employees.md) | `EmployeesController` | `api/employees.js` |
| [departments.md](./departments.md) | `DepartmentsController` | `api/departments.js` |
| [dorms-rooms.md](./dorms-rooms.md) | `DormsController` | `api/dorms.js` `api/rooms.js` |
| [occupancy.md](./occupancy.md) | `OccupancyController` | `api/occupancy.js` |
| [calendar-export.md](./calendar-export.md) | `CalendarController` `ExportController` `SystemSettingsController` | `api/calendar.js` `api/export.js` |
| [fees.md](./fees.md) | `DormFeesController` `FeeRatesController` | `api/fees.js` |
| [vacancies.md](./vacancies.md) | `VacanciesController` | `api/vacancies.js` |
| [import.md](./import.md) | `ImportController` | `api/import.js` |
| [equipment.md](./equipment.md) | `EquipmentItemsController` `StorageLocationsController` | `api/equipment.js` |
| [audit.md](./audit.md) | `AuditController` | `api/audit.js` |
| [users.md](./users.md) | `UsersController` | `api/users.js` |

## 快速对照

```
前端 view → api/{域}.js → NestJS modules/{域}/{域}.controller.ts → Prisma → PostgreSQL
```

维护规则：新增/修改 `apps/web/src/api/*.js` 或后端 Controller 时，同步更新对应 `docs/apidoc/*.md` 与本索引。
