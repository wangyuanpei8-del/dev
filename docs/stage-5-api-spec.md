# Stage 5：API 设计规格

Base URL: `/api/v1`  
认证: `Authorization: Bearer <access_token>`（除 login/refresh）

## 5.1 统一响应

**成功**

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

**失败**

```json
{
  "code": 40001,
  "message": "該当部屋は指定期间内に既に入居者が存在します",
  "data": null
}
```

## 5.2 错误码表

| HTTP | code | 含义 |
|------|------|------|
| 400 | 40001 | 请求参数校验失败 |
| 401 | 40100 | 未认证 |
| 403 | 40300 | 无权限 |
| 404 | 40400 | 资源不存在 |
| 409 | 40901 | OCCUPANCY_OVERLAP 入居期间重叠 |
| 409 | 40902 | GENDER_MISMATCH 性别与寮不一致 |
| 409 | 40903 | DORM_CAPACITY_EXCEEDED 户内人数超限 |
| 409 | 40904 | FEE_ALREADY_CONFIRMED 寮費已确定 |
| 409 | 40910 | VERSION_CONFLICT 乐观锁冲突（同時編集） |
| 422 | 42201 | IMPORT_VALIDATION_FAILED 导入校验失败 |

---

## 5.2.1 业务日期与在室判定（重要统一口径）

- 业务日期一律 `YYYY-MM-DD`，仅 DATE（不含时刻）
- 在室判定（查询日 `D`）：
  - `move_in_date <= D`
  - 且 (`move_out_date` 为 `NULL` 或 `move_out_date >= D`)
  - `move_out_date = NULL` 视为无期限入居（等价 `9999-12-31`）

该口径用于：空室判定、重叠检测、寮割カレンダー涂色、寮費日割、警告计算、导入校验。

---

## 5.3 Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | 登录 |
| POST | `/auth/refresh` | 刷新 Token |
| GET | `/auth/me` | 当前用户 |

**POST /auth/login Request**

```json
{
  "email": "admin@example.com",
  "password": "string"
}
```

**Response data**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "displayName": "管理者",
    "role": "SYSTEM_ADMIN"
  }
}
```

---

## 5.4 Employees

| Method | Path | Description |
|--------|------|-------------|
| GET | `/employees` | 一覧（query: `q`, `employeeType`, `gender`, `page`, `pageSize`） |
| GET | `/employees/:id` | 详情 |
| POST | `/employees` | 创建 |
| PATCH | `/employees/:id` | 更新 |
| DELETE | `/employees/:id` | 软删除 |
| PATCH | `/employees/:id/first-dorm-use-date` | Admin 修正初回入寮日 |

**POST Request**

```json
{
  "employeeCode": "E001",
  "fullName": "山田 太郎",
  "employeeType": "JAPAN",
  "gender": "MALE",
  "departmentId": "uuid",
  "email": "yamada@example.com"
}
```

---

## 5.5 Dorms & Rooms

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dorms` | 寮一覧 |
| POST | `/dorms` | 创建寮 |
| GET | `/dorms/:id` | 详情含部屋数 |
| PATCH | `/dorms/:id` | 更新（`genderType` 仅 Admin 特例） |
| DELETE | `/dorms/:id` | 软删除寮 |
| GET | `/dorms/:dormId/rooms` | 部屋一覧 |
| POST | `/dorms/:dormId/rooms` | 创建部屋 |
| PATCH | `/rooms/:id` | 更新部屋 |
| DELETE | `/rooms/:id` | 软删除 |

**POST /dorms Request**

```json
{
  "code": "OYAMA-C",
  "name": "大島C寮",
  "address": "東京都江東区大島6-1-5号棟519号室",
  "postalCode": "136-0072",
  "layoutType": "3DK",
  "genderType": "MALE_DORM",
  "location": "TOKYO",
  "responsibleEmployeeId": null
}
```

**PATCH /dorms/:id** 可更新 `responsibleEmployeeId`（責任者，0~1 名；须为有效 `employees.id`）。

**详情 Response** 建议包含：

```json
{
  "responsibleEmployeeId": "uuid-or-null",
  "responsibleEmployee": { "id": "uuid", "fullName": "山田 太郎" }
}
```

---

## 5.5.1 Departments（所属マスタ）

| Method | Path | Description |
|--------|------|-------------|
| GET | `/departments` | 所属一覧（query: `q`, `page`, `pageSize`） |
| GET | `/departments/:id` | 详情 |
| POST | `/departments` | 创建（Admin/Manager） |
| PATCH | `/departments/:id` | 更新 |
| DELETE | `/departments/:id` | 软删除 |

社員 `POST/PATCH /employees` 使用 `departmentId`（UUID），不再使用自由文本 `department`。

---

## 5.6 Occupancy（入退寮）

| Method | Path | Description |
|--------|------|-------------|
| GET | `/occupancy-histories` | 一覧（filters: `q`, `employeeId`, `roomId`, `dormId`, `activeOn`） |
| GET | `/occupancy-histories/:id` | 详情 |
| POST | `/occupancy-histories` | 入居登记 |
| PATCH | `/occupancy-histories/:id` | 更新（未退寮前） |
| POST | `/occupancy-histories/:id/move-out` | 退寮 |
| GET | `/occupancy-histories/long-term-warnings` | 通算 ≥ 阈值年 |
| GET | `/occupancy-histories/occupied-count` | 指定日在室人数（query: `activeOn`, `dormId?`） |

---

## 5.6.1 寮割カレンダー（追加：最新要件定義書の中心画面）

> **目的**：Excel 寮割表に相当する「寮割カレンダー画面」を支える集計 API。  
> 地域・月を指定し、寮→部屋→入居者の在籍情報を返す。UI は日粒度で黄色塗り・制約違反セルを赤背景表示する。

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dorm-allocation-calendar` | 地域 + 月の寮割カレンダー集計 |

**Query**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `yearMonth` | string | yes | `YYYY-MM`（例：`2026-04`） |
| `location` | string | no | `TOKYO|OSAKA|NAGOYA|OTHER` |
| `q` | string | no | 氏名の部分一致検索（追加要件） |
| `sort` | string | no | `dormNameAsc`（寮名昇順、追加要件） |

**Response data（概略）**

```json
{
  "yearMonth": "2026-04",
  "daysInMonth": 30,
  "items": [
    {
      "dormId": "uuid",
      "dormName": "豊洲Ｉ寮",
      "location": "TOKYO",
      "rows": [
        {
          "roomId": "uuid",
          "roomName": "手前洋室",
          "employeeId": "uuid",
          "employeeName": "山田 太郎",
          "isLeader": true,
          "department": "本社 DX",
          "moveInDate": "2026-03-20",
          "moveOutDate": null,
          "occupiedDays": [1,2,3,4,5],
          "conflicts": [
            { "day": 15, "type": "ROOM_OVERLAP", "message": "同一部屋に同一期間で複数人" }
          ],
          "warnings": [
            { "type": "MOVE_OUT_DUE_SOON", "daysLeft": 10 }
          ]
        }
      ]
    }
  ]
}
```

说明：
- `occupiedDays` 为 1..月末的“在室日”集合（按 **闭区间** 口径计算）
- `isLeader`：`row.employeeId === dorm.responsibleEmployeeId`（数据来自 `dorms.responsible_employee_id`）
- `department`：来自 `departments.name`（经 `employees.department_id`）
- `conflicts` 用于前端红底 + tooltip 详细说明

### 乐观锁（version）

涉及更新的接口（例如 `PATCH /occupancy-histories/:id`、`POST /occupancy-histories/:id/move-out`）建议在 Request 中携带 `version`。  
若服务端检测到版本不一致，则返回 `409` + `code=40910 (VERSION_CONFLICT)`。

**POST 入居 Request**

```json
{
  "employeeId": "uuid",
  "roomId": "uuid",
  "moveInDate": "2026-04-01",
  "moveOutDate": null,
  "moveOutReason": null
}
```

**Response data**

```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "roomId": "uuid",
  "moveInDate": "2026-04-01",
  "moveOutDate": null,
  "employee": {
    "fullName": "山田 太郎",
    "firstDormUseDate": "2026-04-01"
  }
}
```

**POST move-out Request**

```json
{
  "version": 1,
  "moveOutDate": "2026-12-31",
  "moveOutReason": "転勤"
}
```

---

## 5.7 Dorm Fees

| Method | Path | Description |
|--------|------|-------------|
| GET | `/fee-rates` | 费率一覧 |
| POST | `/fee-rates` | 新增费率（Admin） |
| PATCH | `/fee-rates/:id` | 更新费率（`version` 乐观锁） |
| GET | `/dorm-fees` | 月次一覧（`yearMonth`, `employeeId`） |
| POST | `/dorm-fees/calculate` | 批量算定 |
| POST | `/dorm-fees/:id/confirm` | 确定 |
| GET | `/dorm-fees/:id` | 详情含 calculationBasis |

**POST /dorm-fees/calculate Request**

```json
{
  "yearMonth": "2026-04",
  "employeeIds": ["uuid1", "uuid2"]
}
```

**Response item**

```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "yearMonth": "2026-04",
  "amountYen": 45000,
  "status": "DRAFT",
  "calculationBasis": {
    "areaSqm": 8.5,
    "roomType": "WESTERN",
    "dailyRateYen": 500,
    "occupiedDays": 30,
    "daysInMonth": 30
  }
}
```

---

## 5.8 Vacancies

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vacancies` | 空室一覧（`asOfDate`, `location`, `genderType`） |
| GET | `/vacancies/assignable-rooms` | 可入居部屋（`employeeId` 或 `gender` + `asOfDate`） |

> `location` 的取值统一为 `TOKYO | OSAKA | NAGOYA | OTHER`（与最新要件定義書一致）。

**Response `/vacancies`**

```json
{
  "items": [
    {
      "dormId": "uuid",
      "dormName": "豊洲Ｉ寮",
      "genderType": "FEMALE_DORM",
      "vacantRooms": [
        {
          "roomId": "uuid",
          "roomName": "手前洋室",
          "status": "VACANT"
        }
      ]
    }
  ]
}
```

---

## 5.9 Equipment

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | `/equipment-items` | 备品マスタ |
| GET/POST/PATCH/DELETE | `/storage-locations` | 保管场所 |

---

## 5.10 Import

| Method | Path | Description |
|--------|------|-------------|
| POST | `/import/upload` | multipart 上传（`.xlsx` / `.xls` / `.csv`），返回 `jobId` + 检测到的列 |
| POST | `/import/:jobId/mapping` | 提交列映射 |
| GET | `/import/:jobId/preview` | 预览校验结果 |
| POST | `/import/:jobId/execute` | 执行导入 |
| GET | `/import/:jobId` | 查询导入任务状态（轮询） |

**列映射示例（mapping）**

```json
{
  "dormName": "寮名",
  "roomName": "使用部屋",
  "employeeName": "氏名",
  "moveInDate": "入寮日",
  "moveOutDate": "退寮日",
  "firstDormUseDate": "初めて寮を使用した入寮日",
  "currentRoomMoveInDate": "現在の部屋への入寮日",
  "feeReference": "寮費(6月以降)"
}
```

---

## 5.11 Audit

| Method | Path | Description |
|--------|------|-------------|
| GET | `/audit-logs` | 分页查询（`entityType`, `fromDate`, `toDate`, `page`, `pageSize`） |

---

## 5.12 Users（Admin）

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | 用户一覧 |
| POST | `/users` | 创建用户 |
| PATCH | `/users/:id` | 更新角色/启用 |

---

## 5.13 Export（CSV 导出）

> 对齐最新要件定義書 §8.5：寮費・入退寮履歴等を CSV として出力可能とする。  
> 响应为 **文件下载**（`Content-Type: text/csv; charset=utf-8`），文件名建议带 `yearMonth` 与时间戳。

| Method | Path | Description |
|--------|------|-------------|
| GET | `/exports/occupancy-histories` | 入退寮履歴 CSV |
| GET | `/exports/dorm-fees` | 寮費一覧 CSV |
| GET | `/exports/dorm-allocation-calendar` | 寮割カレンダー（当月网格）CSV |

**共通 Query**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `yearMonth` | string | 视导出类型 | `YYYY-MM` |
| `location` | string | no | `TOKYO\|OSAKA\|NAGOYA\|OTHER` |
| `q` | string | no | 氏名部分一致（履歴・カレンダー导出） |
| `employeeId` | uuid | no | 寮費导出筛选 |
| `status` | string | no | 寮費：`DRAFT\|CONFIRMED` |

**CSV 列（最小集，实现时可扩展）**

| 导出类型 | 列（顺序） |
|----------|------------|
| occupancy-histories | 寮名, 部屋名, 氏名, 所属, 入寮日, 退寮日, 退寮理由 |
| dorm-fees | 氏名, 年月, 金额(円), 状态, 利用日数, 部屋种别, 面积 |
| dorm-allocation-calendar | 寮名, 部屋名, 氏名, 責任者(★), 所属, 1日…月末（在室=1） |

编码：UTF-8 with BOM（Excel 打开友好）；日期列 `YYYY-MM-DD`。

---

## 5.14 Print（印刷）

> 对齐最新要件定義書 §10：横方向 1 ヶ月固定、ページ単位=寮ごと、A4/A3 対応。  
> **MVP 推荐**：前端基于 `/allocation-calendar` 同数据渲染 **印刷专用 DOM** + `window.print()`（`@media print` CSS），不强制后端生成 PDF。

| 方式 | 说明 |
|------|------|
| 前端印刷（推荐 MVP） | `GET /dorm-allocation-calendar` 取得数据 → 印刷预览页按寮分页 |
| 后端 PDF（Phase 2） | `GET /prints/dorm-allocation-calendar.pdf` 可选 |

**前端印刷 Query（路由或对话框参数）**

| Name | Values | Description |
|------|--------|-------------|
| `paperSize` | `A4` \| `A3` | 纸张 |
| `orientation` | `landscape` | 固定横向（1 ヶ月） |
| `dormId` | uuid | 可选；省略则印刷当前筛选下全部寮（每寮一页） |

**版式规则**

- 每寮独立一页（`page-break-after: always`）
- 表头：寮名、対象月、印刷日
- 横轴：1〜月末；纵轴：入居者行（氏名、★、所属、部屋）
- 在室日：黄色底（屏幕）/ 印刷可用浅灰或保持黄色（`print-color-adjust: exact`）
- 冲突单元：红底（与画面一致）

---

## 5.15 System Settings（系统参数）

| Method | Path | Description |
|--------|------|-------------|
| GET | `/system-settings/move-out-warning-days` | 退寮警告阈值（默认 14） |
| PATCH | `/system-settings/move-out-warning-days` | Admin 修改阈值 |

**PATCH Request**

```json
{ "days": 14 }
```

---

## 5.16 Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | 健康检查（无需认证） |

**Response data**

```json
{
  "status": "ok",
  "db": "connected"
}
```

`db` 取值：`connected` | `disconnected`

---

## 5.17 分页 Response 示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 120,
    "page": 1,
    "pageSize": 20
  }
}
```
