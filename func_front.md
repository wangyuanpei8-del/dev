# func_front.md —— 前端功能与结构清单（寮管理システム / apps/web）

> 本文档是 `.cursor/rules/front-check.mdc` 规则要求的**前端代码生成前置检查文档**。
> 在新增 / 修改任何前端业务代码前，必须先阅读本文件，确认是否已有可复用的页面、组件、接口、Store、工具函数。
> 完成开发后，必须**同步更新**本文件对应章节（Views / Components / Api / Store / Utils / Router / 调用链路）。

- **目标工程**：`apps/web`（pnpm workspace 成员，唯一线上前端）
- **技术栈**：Vue 3（`<script setup>`）+ Vite 6 + Vue Router 4 + Pinia 2 + Element Plus 2 + ECharts 5 + Axios
- **后端工程**：`apps/api`（NestJS + Prisma），按业务域划分 `modules/{域}`
- **⚠️ 注意**：`dom-dev/doc/` 为详细设计参考；**唯一线上前端**为 `apps/web`。新建文档同步以本文件为准。

---

## 0. 目录结构与命名规范（项目实际约定）

```
apps/web/src/
├── api/                # 接口模块（每个业务域一个扁平文件）
│   ├── auth.js  audit.js  calendar.js  dashboard.js  departments.js  dorms.js
│   ├── employees.js  equipment.js  export.js  fees.js  import.js  occupancy.js
│   ├── rooms.js  users.js  vacancies.js
├── assets/             # main.css + styles/（index.css / theme.css — ダークサイドバー＋ライトコンテンツ）
├── components/         # 公共组件（PascalCase）
│   ├── PageHeader.vue  PaginationBar.vue  JsonViewer.vue  FeeBasisPanel.vue  DataIssuePanel.vue
│   ├── ListLoadAlert.vue  AuditChangePanel.vue  LoginBrandMark.vue
│   ├── ActionHubCard.vue  StatusBadge.vue  AppBreadcrumb.vue
│   └── charts/{DashboardStatCard,BaseChart,KpiCard}.vue  useEChart.js
├── constants/enums.js  # 枚举与 *Labels 标签映射
├── directives/permission.js   # v-permission 指令
├── layout/             # 认证后外壳：index.vue + components/{Sidebar,Header}.vue
├── router/             # index.js（路由+守卫）、menus.js（分组侧边栏）、breadcrumbs.js（パンくず）
├── store/              # Pinia（setup 风格）：user.js、app.js
├── utils/              # request.js（axios 封装）、date.js、permission.js、feeBasis.js、auditDiff.js
└── views/{业务域}/...  # 页面视图
```

**命名规范（务必遵循现有模式）**

| 类别 | 实际约定 | 示例 |
|---|---|---|
| 页面视图 | `views/{业务域}/{功能}.vue` | `views/occupancy/create.vue` |
| 公共组件 | `components/{PascalCase}.vue` | `components/PaginationBar.vue` |
| 接口文件 | `api/{业务域}.js`（**扁平文件，非 `index.js`**），具名导出 `export function` | `api/employees.js` → `getEmployees()` |
| Store | `store/{业务域}.js`（**无 `modules/` 子目录**，setup 风格 `defineStore('x', () => {...})`） | `store/user.js` → `useUserStore` |
| 工具函数 | `utils/{功能}.js`，具名导出 | `utils/date.js` → `formatDate()` |
| 组合式函数 | `views/{域}/composables/use{X}.js` | `useAllocationCalendar()` |

> 与 `front-check.mdc` 示例的差异（以本项目为准）：接口文件用 `api/{域}.js` 而非 `api/{域}/index.js`；Store 用 `store/{域}.js` 而非 `store/modules/{域}.js`；**大多数页面直接在 view 内调用 api，不经过 Store**（Store 仅用于 `user`/`app` 全局状态）。

---

## 1. Views（页面视图）

| 路由 | 文件 | 主功能 | 关键方法 | 调用 Api |
|---|---|---|---|---|
| `/login` | `views/login/index.vue` | 邮箱密码登录 | `handleSubmit` | `useUserStore().login` |
| `/403` | `views/error/403.vue` | 无权限页 | — | — |
| `/404` | `views/error/404.vue` | 404 未找到 | — | — |
| `/` | `views/dashboard/index.vue` | **ホーム**（在室/空室 KPI・ToDo・快捷操作・整合警告） | `loadDashboard` / `onMounted` | `loadDashboardPayload` |
| `/allocation-calendar` | `views/allocation-calendar/index.vue` | 寮割月历，打印/CSV 导出 | `handlePrint`（逻辑在 composable） | `fetchCalendar`、`fetchMoveOutWarningDays`、`exportCalendarCsv` |
| `/employees` | `views/employees/index.vue` | 社员主数据 CRUD + 所属 FK + 乐观锁 + 初次入寮日修正 | `fetchList` `loadDepartments` `openDialog` `submitForm` `handleDelete` `openFirstDateDialog` `submitFirstDate` | `getEmployees` `getEmployee` `createEmployee` `updateEmployee` `deleteEmployee` `updateFirstDormUseDate` `getDepartments` |
| `/employees/:id` | `views/employees/detail.vue` | 社員 360°（基本情報・在室・履歴・寮費） | `onMounted` | `getEmployee` `getOccupancyHistories` `getDormFees` |
| `/dorms` | `views/dorms/index.vue` | 寮主数据列表 CRUD + 乐观锁 | `fetchList` `openDialog` `submitForm` `handleDelete` | `getDorms` `getDorm` `createDorm` `updateDorm` `deleteDorm` |
| `/dorms/:id` | `views/dorms/detail.vue` | 寮详情（信息/部屋 CRUD/履历）+ 部屋乐观锁 | `fetchDorm` `fetchRooms` `openRoomDialog` `submitRoom` `handleDeleteRoom` | `getDorm` `getRooms` `createRoom` `updateRoom` `deleteRoom` |
| `/occupancy` | `views/occupancy/index.vue` | 入退寮操作入口（入寮/退寮/履歴 三选一） | `onMounted` | `getOccupiedCount` |
| `/occupancy/history` | `views/occupancy/history.vue` | 入退寮履历列表 + 筛选 + CSV 导出 | `fetchList` `handleExport` `resetFilters` | `getOccupancyHistories` `exportOccupancyHistories` `getDorms` |
| `/occupancy/create` | `views/occupancy/create.vue` | 入寮向导（社員から／寮から 双路径） | `selectMode` `loadMoveInEmployees` `loadAssignableRooms` `nextStep` `submit` | `fetchMoveInEligibleEmployees` `getAssignableRooms` `getDorms` `getRooms` `createOccupancy` |
| `/occupancy/move-out` | `views/occupancy/move-out-wizard.vue` | 退寮向导（社員から／寮から 双路径） | `selectMode` `loadMoveOutEmployees` `nextStep` `submit` | `fetchMoveOutEligibleEmployees` `getOccupancyHistories` `moveOut` `getDorms` `getRooms` |
| `/occupancy/:id/move-out` | `views/occupancy/move-out.vue` | 退寮日期/备注 + version | `onMounted` `submit` | `getOccupancyHistory` `moveOut` |
| `/occupancy/long-term` | `views/occupancy/long-term.vue` | 长期利用警告列表 | `fetchList` | `getLongTermWarnings` |
| `/fees` | `views/fees/index.vue` | 寮费列表、CSV 导出、计算依据抽屉、确认草稿 | `fetchList` `handleExport` `showBasis` `handleConfirm` | `getDormFees` `confirmFee` `exportDormFees` |
| `/fees/calculate` | `views/fees/calculate.vue` | 指定年月批量计算寮费 | `handleCalculate` | `calculateFees` |
| `/fees/rates` | `views/fees/rates.vue` | 料率マスタ CRUD + 乐观锁（仅 SYSTEM_ADMIN） | `fetchList` `openDialog` `submit` | `getFeeRates` `createFeeRate` `updateFeeRate` |
| `/vacancies` | `views/vacancies/index.vue` | 指定日期空室状况 | `fetchList` `badgeClass` | `getVacancies` |
| `/import` | `views/import/index.vue` | 导入 4 步向导（上传→映射→预览→结果） | `onFileChange` `handleUpload` `saveMapping` `loadPreview` `handleExecute` `pollJobStatus` | `uploadImport` `setMapping` `getPreview` `executeImport` `getImportJob` |
| `/equipment` | `views/equipment/index.vue` | 备品 + 保管场所 双 Tab CRUD | `fetchItems` `fetchLocations` `openItemDialog` `openLocationDialog` `submitItem` `submitLocation` `deleteItem` `deleteLocation` | `getEquipmentItems` `createEquipmentItem` `updateEquipmentItem` `deleteEquipmentItem` `getStorageLocations` `createStorageLocation` `updateStorageLocation` `deleteStorageLocation` |
| `/audit` | `views/audit/index.vue` | 操作日志（只读，`AuditChangePanel` 可读 diff） | `fetchList` `onDateChange` `openDrawer` | `getAuditLogs` |
| `/settings/departments` | `views/settings/departments/index.vue` | 所属マスタ CRUD（仅 SYSTEM_ADMIN） | `fetchList` `openDialog` `submit` `handleDelete` | `getDepartments` `createDepartment` `updateDepartment` `deleteDepartment` |
| `/settings/users` | `views/settings/users/index.vue` | 应用用户账号管理（仅 SYSTEM_ADMIN） | `fetchList` `openDialog` `submit` `deactivate` | `getUsers` `createUser` `updateUser` |

---

## 2. Components（公共组件）

### 共享组件 `components/`
| 组件 | Props | Emits / Slots | 用途 |
|---|---|---|---|
| `PageHeader` | `title:String` `subtitle:String` | slot `actions` | 页面标题/副标题 + 操作区插槽 |
| `PaginationBar` | `page:Number` `pageSize:Number` `total:Number` | `update:page` `update:pageSize` `change` | Element Plus 分页封装 |
| `LoginBrandMark` | — | — | ログイン用 SVG ブランドロゴ（寮ビルアイコン） |
| `FeeBasisPanel` | `basis:Object` `feeContext?:{employeeName,yearMonth,totalAmount}` | — | 寮費算定根拠の可读内訳（部屋別・算式） |
| `ListLoadAlert` | `message:String` `showRetry?:Boolean` | `retry` | 列表加载失败提示 + 再読み込み |
| `DetailNotFound` | `title` `subTitle` `backTo` `backLabel` `showRetry?` | `retry` | 详情页 404 / 加载失败空状态 |
| `AuditChangePanel` | `before:Object` `after:Object` | — | 監査ログ変更内容の可读 diff 表 |
| `JsonViewer` | `data:Object/Array/...` | — | `<pre>` 美化展示 JSON（監査以外で使用） |
| `ActionHubCard` | `title` `description` `icon` `to` `tone?` `badge?` | — | 入退寮 hub 等大操作卡片 |
| `StatusBadge` | `status?` `label?` `variant?` | — | 统一状态 pill（在室/退寮済/下書き 等） |
| `AppBreadcrumb` | — | — | Header 动态面包屑（`router/breadcrumbs.js`） |
| `DataIssuePanel` | `issues:Array` | — | 数据不整合 actionable 引导面板 |
| `charts/DashboardStatCard` | `label:String(必填)` `value:Number/String` `sub:String` `hint:String` `tone:String` | — | ホーム KPI カード（アクセントバー付き） |
| `charts/BaseChart` | `option:Object` `height:String` | — | ECharts 容器（`useEChart` 連動） |
| `charts/KpiCard` | `label:String(必填)` `value:Number/String` `hint:String` | — | 旧 KPI カード（ホームでは未使用、互換用） |
| `charts/useEChart.js` | — | — | composable：`optionRef` → ECharts 实例 resize/dispose |

### 视图局部组件 `views/allocation-calendar/components/`
| 组件 | Props | Emits | 用途 |
|---|---|---|---|
| `CalendarToolbar` | `filters:Object(必填)` | `search` `prev-month` `next-month` `export-csv` `print` | 月历筛选条（地区/月份导航/姓名搜索/纸张/导出） |
| `CalendarGrid` | `dorm` `daysInMonth` `warningDays` `cellClass:Function` `conflictTooltip:Function` | — | 单寮月历网格，渲染入住/冲突/退寮预警 |
| `PrintLayout` | `items` `daysInMonth` `yearMonth` `paperSize` `warningDays` `cellClass` `conflictTooltip` | — | 打印专用布局，逐寮分页包裹 `CalendarGrid` |

### 布局组件 `layout/components/`
| 组件 | 说明 |
|---|---|
| `Sidebar` | ライトテーマ、`LoginBrandMark` ブランド、グループ化メニュー；`<768px` ドロワー |
| `Header` | 折りたたみ + `AppBreadcrumb`（Dashboard 除く）+ ユーザー名 + ログアウト |

---

## 3. Api（接口模块）

> 统一经 `utils/request.js` 的 axios 实例；自动注入鉴权头、解包 `{code,data}`、401 刷新重试、错误 toast。基础地址 `VITE_API_BASE_URL`。对应后端 `apps/api/src/modules/{域}/{域}.controller.ts`。**后端全局 `JwtAuthGuard` + `PermissionsGuard`**，写操作需对应 `RequirePermissions`；变更操作通过 `@CurrentUser()` 写入 audit `userId`。

### `api/auth.js` → `AuthController`
| 函数 | 方法 | 端点 | 参数 |
|---|---|---|---|
| `login(data)` | POST | `/auth/login` | `{ email, password }` |
| `refresh(data)` | POST | `/auth/refresh` | `{ refreshToken }` |
| `getMe()` | GET | `/auth/me` | — |

### `api/audit.js` → `AuditController`
| `getAuditLogs(params)` | GET | `/audit-logs` | `{ entityType?, fromDate?, toDate?, page, pageSize }` |
|---|---|---|---|

### `api/calendar.js` → `CalendarController` / `SystemSettingsController` / `ExportController`
| 函数 | 方法 | 端点 | 参数 |
|---|---|---|---|
| `fetchCalendar(params)` | GET | `/dorm-allocation-calendar` | `{ yearMonth, sort, location?, q? }` |
| `fetchMoveOutWarningDays()` | GET | `/system-settings/move-out-warning-days` | — |
| `patchMoveOutWarningDays(days)` | PATCH | `/system-settings/move-out-warning-days` | `{ days }` |
| `exportCalendarCsv(params)` | GET(blob) | `/exports/dorm-allocation-calendar` | `{ yearMonth, sort, location?, q? }`，触发浏览器下载 |

### `api/dashboard.js`（聚合器，无直接 HTTP）
| 函数 | 内部调用 | 参数 / 返回值 |
|---|---|---|
| `loadDashboardKpis(asOfDate)` | `getLongTermWarnings` `getVacancies` `getDormFees` `getOccupiedCount` | 返回 `{ longTermCount, vacantCount, totalRooms, draftFeeCount, occupiedCount }` |
| `getRecentAuditLogs()` | `getAuditLogs`（`page:1,pageSize:8`） | — |
| `loadDashboardPayload(asOfDate)` | 上记 + `fetchCalendar` | 返回 KPI・`dormVacancy`・`locationStats`・`dailyTrend`・`calendarSummary`・`auditLogs`・`summaryLine` |

### `api/dorms.js` → `DormsController`
| `getDorms(params)` GET `/dorms` · `getDorm(id)` GET `/dorms/:id` · `createDorm(data)` POST `/dorms` · `updateDorm(id,data)` PATCH `/dorms/:id` · `deleteDorm(id)` DELETE `/dorms/:id` |
|---|

### `api/rooms.js` → `DormsController`（rooms 子资源）
| `getRooms(dormId,params)` GET `/dorms/:dormId/rooms` · `createRoom(dormId,data)` POST `/dorms/:dormId/rooms` · `updateRoom(id,data)` PATCH `/rooms/:id` · `deleteRoom(id)` DELETE `/rooms/:id` |
|---|

### `api/departments.js` → `DepartmentsController`
| `getDepartments(params)` GET `/departments` · `getDepartment(id)` GET `/departments/:id` · `createDepartment(data)` POST · `updateDepartment(id,data)` PATCH · `deleteDepartment(id)` DELETE |
|---|

### `api/employees.js` → `EmployeesController`
| `getEmployees(params)` GET `/employees`（`{q?,employeeType?,gender?,page,pageSize}`）· `getEmployee(id)` GET `/employees/:id` · `createEmployee(data)` POST · `updateEmployee(id,data)` PATCH（含 `departmentId`, `version`）· `deleteEmployee(id)` DELETE · `updateFirstDormUseDate(id,data)` PATCH `/employees/:id/first-dorm-use-date` |
|---|

### `api/export.js` → `ExportController`
| `exportOccupancyHistories(params)` GET(blob) `/exports/occupancy-histories` · `exportDormFees(params)` GET(blob) `/exports/dorm-fees` |
|---|

### `api/equipment.js` → `EquipmentItemsController` / `StorageLocationsController`
| `getEquipmentItems/createEquipmentItem/updateEquipmentItem/deleteEquipmentItem` → `/equipment-items[/:id]` · `getStorageLocations/createStorageLocation/updateStorageLocation/deleteStorageLocation` → `/storage-locations[/:id]` |
|---|

### `api/fees.js` → `DormFeesController` / `FeeRatesController`
| `getDormFees(params)` GET `/dorm-fees` · `calculateFees(data)` POST `/dorm-fees/calculate`（`{yearMonth}`）· `confirmFee(id)` POST `/dorm-fees/:id/confirm` · `getFeeRates(params)` GET `/fee-rates` · `createFeeRate(data)` POST · `updateFeeRate(id,data)` PATCH `/fee-rates/:id` |
|---|

### `api/import.js` → `ImportController`
| `uploadImport(file)` POST `/import/upload`(multipart) · `setMapping(jobId,data)` POST `/import/:jobId/mapping` · `getPreview(jobId)` GET `/import/:jobId/preview` · `executeImport(jobId)` POST `/import/:jobId/execute` · `getImportJob(jobId)` GET `/import/:jobId` |
|---|

### `api/occupancy.js` → `OccupancyController`
| `getOccupancyHistories(params)` GET `/occupancy-histories`（`q?,activeOn?,dormId?`）· `getOccupancyHistory(id)` GET `/occupancy-histories/:id` · `updateOccupancyHistory(id,data)` PATCH · `createOccupancy(data)` POST · `moveOut(id,data)` POST `/occupancy-histories/:id/move-out`（`{moveOutDate,moveOutReason?,version?}`）· `getLongTermWarnings(params)` GET `/occupancy-histories/long-term-warnings` · `getOccupiedCount(params)` GET `/occupancy-histories/occupied-count`（`{activeOn,dormId?}`） |
|---|

### `api/users.js` → `UsersController`
| `getUsers(params)` GET `/users`（`{role?,isActive?,page,pageSize}`）· `createUser(data)` POST（`{email,displayName,password,role}`）· `updateUser(id,data)` PATCH `/users/:id`（停用：`updateUser(id,{isActive:false})`） |
|---|

### `api/vacancies.js` → `VacanciesController`
| `getVacancies(params)` GET `/vacancies`（`{asOfDate,location?,genderType?}`）· `getAssignableRooms(params)` GET `/vacancies/assignable-rooms`（`{employeeId,moveInDate}`） |
|---|

---

## 4. Store（Pinia，setup 风格）

### `store/user.js` → `useUserStore`
- **State**：`accessToken`、`refreshTokenValue`、`user`、`permissions`
- **Getters**：`displayName`、`role`
- **Actions**：`login(form)`、`fetchMe()`、`refreshToken()`、`logout()`、`hasPermission(p)`、`hasRole(r)`、`setUser(data)`
- token 持久化：access 存 `sessionStorage(dorm_access_token)`，refresh 存 `localStorage(dorm_refresh_token)`

### `store/app.js` → `useAppStore`
- **State**：`sidebarCollapsed`　**Actions**：`toggleSidebar()`

---

## 5. Utils / Constants / Directives / Composables

| 文件 | 导出 | 用途 |
|---|---|---|
| `utils/request.js` | `default`（axios 实例）、`uploadImport(file)` | 鉴权头 / `{code,data}` 解包 / 401 刷新重试 / 错误提示；文件上传 |
| `utils/date.js` | `formatDate` `formatDateTime` `todayISO` `currentYearMonth` `shiftYearMonth` `daysInMonth` `formatJapaneseDate` `formatTimeJa` | 日期格式化与年月计算（日本語表示） |
| `utils/permission.js` | `resolvePermissions(role,server)` `checkPermission(perms,p)` `checkRole(role,required)` | 权限解析与校验（支持 `*` 通配） |
| `constants/enums.js` | `UserRole/EmployeeType/...` 及各自 `*Labels`；`EntityTypeLabels`（操作ログ实体名） | 枚举值与**日文**标签（UI 纯日文） |
| `directives/permission.js` | `v-permission` 指令 | 无权限时移除元素；`v-permission:role="'SYSTEM_ADMIN'"` 校验角色 |
| `views/allocation-calendar/composables/useAllocationCalendar.js` | `useAllocationCalendar()` | 月历状态：`loading/error/calendar/warningDays/filters/daysInMonth/items` + `loadWarningDays/loadCalendar/prevMonth/nextMonth/exportCsv/cellClass/conflictTooltip` |

---

## 6. Router & Menus

- `router/index.js`：定义全部路由 + 全局守卫。公共路由（`/login`、`/403`，`meta.public:true`）跳过鉴权；其余需 `accessToken`，无 `user` 时拉取 `/auth/me`；按 `meta.role` → `meta.permission` 校验，失败跳 `/403`；设置 `document.title`。
- `router/menus.js`：侧边栏菜单（path/title/icon/权限）。非侧边栏路由：`/login`、`/403`、`/dorms/:id`、`/occupancy/create`、`/occupancy/:id/move-out`、`/fees/calculate`、`/fees/rates`。设置类：`/settings/departments`、`/settings/users`（`SYSTEM_ADMIN`）。
- 权限点：`employees:read` `dorms:read` `occupancy:read|write` `fees:read|write` `fee-rates:write` `vacancies:read` `import:execute` `equipment:read` `audit:read`；角色：`SYSTEM_ADMIN`/`DORM_MANAGER`/`VIEWER`。

---

## 7. 典型调用链路（本项目实际架构）

> 本项目业务页面**直接在 view 内调用 api**（不经业务 Store）；仅 `user`/`app` 使用 Store。

**页面初始化取数**
```
views/employees/index.vue  onMounted() → fetchList()
  → api/employees.js  getEmployees(params)
  → 后端 EmployeesController.list()
```

**新增数据**
```
views/dorms/index.vue  submitForm()
  → api/dorms.js  createDorm(data)
  → 后端 DormsController.create()
```

**修改数据**
```
views/fees/rates.vue  submit()
  → api/fees.js  updateFeeRate(id, data)
  → 后端 FeeRatesController.update()
```

**删除数据**
```
views/equipment/index.vue  deleteItem(id)
  → api/equipment.js  deleteEquipmentItem(id)
  → 后端 EquipmentItemsController.remove()
```

**状态变更（确认寮费）**
```
views/fees/index.vue  handleConfirm(id)
  → api/fees.js  confirmFee(id)
  → 后端 DormFeesController.confirm()
```

**数据联动（入寮向导：选社员/日期 → 拉可分配部屋）**
```
views/occupancy/create.vue  loadAssignableRooms()
  → api/vacancies.js  getAssignableRooms({ employeeId, moveInDate })
  → 后端 VacanciesController.assignableRooms()
```

**图表 / 大屏初始化（寮運営コックピット）**
```
views/dashboard/index.vue  onMounted() → loadDashboard()
  → api/dashboard.js  loadDashboardPayload(asOfDate)
      → getVacancies / getLongTermWarnings / getDormFees / getOccupiedCount / fetchCalendar / getAuditLogs
  → 后端 Vacancies / Occupancy / DormFees / Calendar / Audit Controller
  → 前端 ECharts（BaseChart + useEChart）渲染 dormVacancy / locationStats / dailyTrend
```

**全局状态链路（登录）**
```
views/login/index.vue  handleSubmit()
  → store/user.js  login(form)
  → api/auth.js  login(data)
  → 后端 AuthController.login()
```

**所属マスタ → 员工表单联动**
```
views/employees/index.vue  onMounted() → loadDepartments()
  → api/departments.js  getDepartments({ page:1, pageSize:500 })
  → 后端 DepartmentsController.list()
```

**CSV 导出（入退寮）**
```
views/occupancy/index.vue  handleExport()
  → api/export.js  exportOccupancyHistories({ q })
  → 后端 ExportController.occupancyHistories()  (blob 下载)
```

**退寮乐观锁**
```
views/occupancy/move-out.vue  onMounted()
  → api/occupancy.js  getOccupancyHistory(id)  // 取 version
  → submit() → moveOut(id, { moveOutDate, moveOutReason, version })
  → 后端 OccupancyController.moveOut()
```

**寮 / 部屋 / 料率乐观锁**
```
views/dorms/index.vue  openDialog(row) → getDorm(id) 取 version → updateDorm(id, { …, version })
views/dorms/detail.vue  openRoomDialog(row) → roomForm.version ← row.version → updateRoom(id, form)
views/fees/rates.vue  openDialog(row) → form.version ← row.version → updateFeeRate(id, form)
```

---

## 8. 文档维护规范（强制）

- 新增 / 修改**页面**：更新「1. Views」表（路由、文件、关键方法、调用 Api）。
- 新增 / 修改**组件**：更新「2. Components」表（Props / Emits / Slots）。
- 新增 / 修改**接口**：更新「3. Api」表（方法、端点、参数、对应后端 Controller）。
- 新增 / 修改 **Store / Utils / 枚举 / 指令**：更新「4 / 5」章节。
- 新增 / 修改**路由或权限点**：更新「6. Router & Menus」。
- 每个新增/改动功能：在「7. 调用链路」补写 `view → api (→ store) → 后端 Controller` 链路。
