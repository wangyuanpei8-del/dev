# Stage 6：页面与原型设计

> 不生成图片；结构对齐 `画面プロトタイプ_A.xlsx` 与要件定义书。

## 6.1 页面列表

> 路由语法为 vue-router（`:id`）；CRUD 新增/编辑在一覧页 **el-dialog** 完成（入居・导入等向导除外）。完整路由表见 `dom-dev/doc/详细设计/前端模块/13-布局与导航.md`。

| 页面 | 路由 | 权限 | 交互 |
|------|------|------|------|
| 登录 | `/login` | 公开 | 独立页 |
| 仪表盘 | `/` | 已登录 | Echarts KPI 可选 |
| 寮割カレンダー（中心画面） | `/allocation-calendar` | `occupancy:read` | 地域过滤 + 月切替 + 搜索/排序 + 冲突红底 |
| 社員一覧 | `/employees` | `employees:read` | 一覧 + Dialog 登録/編集 |
| 寮一覧 | `/dorms` | `dorms:read` | 一覧 + Dialog；详情 `/dorms/:id` |
| 寮详情 | `/dorms/:id` | `dorms:read` | Tab：基本 / 部屋 / 履歴 |
| 入居履歴 | `/occupancy` | `occupancy:read` | 一覧 |
| 入居登记 | `/occupancy/create` | `occupancy:write` | `el-steps` 向导 |
| 退寮 | `/occupancy/:id/move-out` | `occupancy:write` | 独立表单页 |
| 長期利用 | `/occupancy/long-term` | `occupancy:read` | 一覧 + CSV 导出 |
| 寮費一覧 | `/fees` | `fees:read` | 一覧 + 確定 |
| 寮費算定 | `/fees/calculate` | `fees:write` | 独立页 |
| 费率主数据 | `/fees/rates` | `fee-rates:write` | Admin |
| 空き室 | `/vacancies` | `vacancies:read` | 折叠卡片 |
| Excel 导入 | `/import` | `import:execute` | `el-steps` |
| 备品 | `/equipment` | `equipment:read` | Tab + Dialog |
| 操作ログ | `/audit` | `audit:read` | 只读一覧 |
| 所属マスタ | `/settings/departments` | `SYSTEM_ADMIN` | 一覧 + Dialog |
| 用户管理 | `/settings/users` | `SYSTEM_ADMIN` | 一覧 + Dialog |
| 403 | `/403` | 公开 | 无权限 |

## 6.2 全局布局

```text
┌─────────────────────────────────────────────────────────┐
│ Header: 系统名「社員寮管理」 / 用户菜单 / 退出          │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                 │
│ - 仪表盘 │                                              │
│ - 寮割    │                                             │
│ - 社員   │                                              │
│ - 寮・部屋│                                             │
│ - 入退寮 │                                              │
│ - 寮費   │                                              │
│ - 空き室 │                                              │
│ - 导入   │                                              │
│ - 备品   │                                              │
│ - 审计   │                                              │
│ - 所属   │                                              │
│ - 用户   │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

### 页面：登录页 `/login`

**区域 1：品牌**
- Logo / 系统标题「社員寮管理システム」

**区域 2：表单**
- Email Input
- Password Input
- 登录 Button

**状态**
- loading：按钮 spinner
- error：凭证错误 Banner
- success：跳转 `/`

---

### 页面：仪表盘 `/`

**区域 1：KPI 卡片**
- 在室人数
- 空室部屋数
- 本月未确定寮費件数
- 长期利用警告人数（≥3年）

**区域 2：快捷操作**
- 入居登记、空き室确认、Excel 导入

**区域 3：最近操作ログ**（最新 10 条）

---

### 页面：寮割カレンダー（中心画面）`/allocation-calendar`

> 最新要件定義書（詳細版）の中心画面。Excel 寮割表を Web で再現し、日粒度の整合性チェックを可視化する。

**区域 1：条件栏**

- 地域フィルタ：`TOKYO | OSAKA | NAGOYA | OTHER`
- 月切替：前月 / 翌月（年跨ぎ自動対応）
- 検索：氏名の部分一致（追加要件）
- ソート：寮名昇順（追加要件）

**区域 2：寮割カレンダー（表）**

- 横轴：目标月 1 日〜月末（日数 28〜31 自動判定）
- 纵向：寮→（部屋）→入居者行（必要情報：寮名、氏名、★責任者、所属、部屋名）
- 在室日（黄色）判定（闭区间）：
  - `moveInDate <= day`
  - 且（`moveOutDate` 为 `NULL` 或 `moveOutDate >= day`）
  - `moveOutDate = NULL` 视为无期限（等价 `9999-12-31`）
- 制約違反（红底）：
  - 同一部屋同一日出现複数入居（最重要规则，日単位評価）
  - Tooltip：显示冲突详情（人员/期间/原因）

**区域 3：警告**

- 退寮警告：`moveOutDate - today <= N`（默认 `N=14`；`GET/PATCH /system-settings/move-out-warning-days`）

**区域 4：导出 / 印刷**

- **CSV 导出**：导出当前筛选条件下的寮割表（`GET /exports/dorm-allocation-calendar`）
- **印刷**：
  - 按钮「印刷」→ 打开印刷预览（或新 Tab）
  - 纸张：`A4` / `A3`（Select）
  - 方向：横向固定（1 ヶ月）
  - 分页：**寮ごと 1 页**（`page-break-after`）
  - 实现：`@media print` + `print-color-adjust: exact`（保留黄色/红底）

**数据来源**

- 画面数据：`GET /api/v1/dorm-allocation-calendar`
- 导出/印刷与画面共用同一 query（`yearMonth`, `location`, `q`, `sort`）

---

### 页面：社員一覧 `/employees`

**区域 1：筛选栏**
- 氏名搜索、社员区分 Select、性别 Select

**区域 2：表格（Element Plus `el-table`）**

| 列 | 说明 |
|----|------|
| 氏名 | full_name |
| 所属 | department |
| 区分 | 日本 / 中国出張 |
| 性别 | 表示 |
| 初回入寮日 | 仅日本；空则「—」 |
| 操作 | 编辑 |

**状态**
- empty：无数据插画 +「社員を登録」
- loading：Skeleton
- error：重试

---

### 页面：入居登记 `/occupancy/create`

**区域 1：步骤向导**
1. 选择社員（显示性别・区分）
2. 选择可入居部屋（调用 `/vacancies/assignable-rooms`）
3. 入寮日 / 退寮予定日 / 理由

**区域 2：校验摘要**
- 实时显示性别匹配、户内人数

**区域 3：确认提交**

**状态**
- success：Toast + 跳转履歴详情
- error：显示 `OCCUPANCY_OVERLAP` 等 API 消息

---

### 页面：寮一覧 `/dorms`

**表格列**：寮名、住所、间取、种别（男性/女性）、所在地、在室/空室数、操作

**操作**：查看详情、编辑（Manager+）

---

### 页面：寮详情 `/dorms/:id`

**Tab 1：基本情報** — 与 Excel「社員寮情報」对齐  
**Tab 2：部屋一覧** — 列：部屋名、面积、定员、AC、状态（在室/空室）、当前入居者  
**Tab 3：入居履歴** — 该寮过滤

---

### 页面：空き室 `/vacancies`

**区域 1：条件**
- 基准日 DatePicker
- 所在地 Select（`TOKYO | OSAKA | NAGOYA | OTHER | 全部`）
- 寮种别 Select

**区域 2：按寮折叠卡片**
- 空室部屋列表 Badge「空室」
- 在室部屋 Badge「在室」+ 氏名

---

### 页面：寮費一覧 `/fees`

**筛选**：年月、确定状态、氏名

**表格**：氏名、年月、金额、状态、根拠（展开 JSON）、操作（确定）

**操作**：导出 CSV（`GET /exports/dorm-fees`，带当前筛选 `yearMonth` 等）

---

### 页面：Excel 导入 `/import`

**Step 1**：拖拽上传 .xlsx  
**Step 2**：列映射 Dropdown（左侧系统字段，右侧 Excel 列）  
**Step 3**：预览表格（错误行红色 + 原因列）  
**Step 4**：执行结果（成功/失败件数、下载错误报告）

**状态**
- empty：未选文件
- error：格式错误、必填列缺失

---

### 页面：长期利用 `/occupancy/long-term`

**表格**：氏名、初回入寮日、通算年数、当前部屋、当前入寮日、备注

**操作**：导出 CSV

---

## 6.3 与 Excel 字段对照

| Excel 概念 | 系统画面/字段 |
|------------|---------------|
| 社員寮情報 | `/dorms` |
| 入居者情報 / 利用情報 | `/employees`, `/occupancy` |
| 部屋詳細（手前洋室、洋室等） | `/dorms/:id` 部屋 Tab（Dialog 編集） |
| 入寮日 / 退寮日 | 入居登记表单 |
| 初めて寮を使用した入寮日 | 社員详情只读；Admin 可修正 |
| 現在の部屋への入寮日 | 当前有效履歴的 move_in_date |
| 寮費(6月以降) | `/fees` 参考列；导入为参考值 |

## 6.4 组件规范

- 表格：Element Plus `el-table` + `el-pagination`（序号、多选、操作列）
- 表单：Element Plus `el-form` + rules（async-validator）
- 弹窗：新增/编辑统一 `el-dialog`
- 日期：`el-date-picker` type="date"，时区 Asia/Tokyo
- 确认：`ElMessageBox.confirm`
- 权限：`v-permission` 指令；无权限隐藏按钮，非法路由跳转 403
- 图表：Echarts（Dashboard KPI）
- 技术栈：Vue3 `<script setup>` + Vite（见 `.cursor/agents/01-前端开发工程师.md`）
