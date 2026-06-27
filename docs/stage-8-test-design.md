# Stage 8：测试设计

## 8.1 单元测试（Backend Service）

| 模块 | 测试点 | 输入 | 预期结果 |
|------|--------|------|----------|
| OccupancyService | 无重叠入居 | room A, 2026-01-01 ~ null | 成功 |
| OccupancyService | 完全重叠 | 已有 2026-01-01~2026-06-30，新 2026-03-01~null | OCCUPANCY_OVERLAP |
| OccupancyService | 相邻同日视为重叠（闭区间） | 已有 ~2026-06-30，新 2026-06-30 起 | OCCUPANCY_OVERLAP（退寮日算在室） |
| OccupancyService | 性别不符 | 女性社員 + 男性寮 | GENDER_MISMATCH |
| OccupancyService | 户内第4人 | 同寮同日 3 人在室，再入居 | DORM_CAPACITY_EXCEEDED |
| OccupancyService | 乐观锁冲突 | version=1 更新，但 DB 已是 version=2 | VERSION_CONFLICT（40910） |
| FirstDormUseDate | 日本社員首次 | 首次 POST 入居 | employee.first_dorm_use_date = move_in_date |
| FirstDormUseDate | 移動不更新 | 已有初回日，再入别部屋 | 初回日不变 |
| FirstDormUseDate | 中国出張 | 任意入居 | first_dorm_use_date 保持 null |
| FeeCalculationService | 满月日割り | 4月全月在室，面积 8.5，费率 500/日 | amount = round(8.5*500*30/30) |
| FeeCalculationService | 月中入居 | 4/16 入居 | occupied_days = 15 |
| VacancyService | 已退寮无予定 | move_out < asOf，无将来履歴 | VACANT |
| VacancyService | 退寮日当天仍在室 | move_out = asOf | OCCUPIED（非空室） |
| VacancyService | 退寮次日空室 | move_out = asOf - 1 天，无将来履歴 | VACANT |
| VacancyService | 将来入居予定 | move_in > asOf | RESERVED / 非空室 |
| CalendarService | 同室同日两人 | 两条履歴覆盖同一 room+day | conflicts 含 ROOM_OVERLAP |
| CalendarService | isLeader | dorm.responsibleEmployeeId 设置 | 对应行 isLeader=true |

> 空室/在室/重叠/涂色均引用 `stage-5-api-spec.md` §5.2.1（闭区间）。

**工具**：Jest + `@nestjs/testing`

---

## 8.2 API 集成测试

| 模块 | 测试点 | 输入 | 预期结果 |
|------|--------|------|----------|
| Auth | 登录成功 | 正确 email/password | 200, code=0, 含 accessToken |
| Auth | 登录失败 | 错误密码 | 401 |
| Employees | CRUD | Admin token | 201/200/204 |
| Employees | Viewer 禁止写 | Viewer POST | 403 |
| Occupancy | 创建入居 | 合法 body | 201 + 履歴 id |
| Occupancy | 重叠拒绝 | 冲突期间 | 409, code=40901 |
| DormFees | 算定 | yearMonth + employeeIds | 返回 DRAFT 记录 |
| DormFees | 确定后修改 | CONFIRMED 再 PATCH | 40904 |
| Import | 预览坏行 | 缺少氏名列 | preview.errors 非空 |
| Export | 履歴 CSV | yearMonth=2026-04 | 200；Content-Type text/csv |
| Export | 寮割 CSV | location=TOKYO | 列含 1〜月末在室标记 |
| Vacancies | 按性别筛选 | gender=MALE | 仅男性寮空室 |

**工具**：Jest + Supertest + 测试 DB（Docker PostgreSQL）

---

## 8.3 E2E 测试（Playwright）

| ID | 场景 | 步骤 | 预期 |
|----|------|------|------|
| E2E-01 | 登录流程 | 打开 /login → 输入 → 提交 | 跳转仪表盘 |
| E2E-02 | 入居登记 | 登录 → 入居登记 → 选社員・部屋・日期 → 提交 | 成功 Toast，一覧可见 |
| E2E-03 | 重叠拒绝 | 同室重复期间登记 | 画面显示错误消息 |
| E2E-04 | 空き室确认 | 退寮后打开 /vacancies | 该部屋显示空室 |
| E2E-05 | Excel 导入预览 | 上传模板 → 映射 → 预览 | 错误行标红 |
| E2E-06 | 权限 | Viewer 登录 | 无「登録」按钮 |
| E2E-07 | 寮割印刷 | 打开 /allocation-calendar → 印刷预览 | 每寮一页；横向 1〜31 日 |
| E2E-08 | CSV 导出 | 寮費一覧导出 | 下载 CSV；UTF-8；列与筛选一致 |

---

## 8.4 测试数据

- `prisma/seed.ts`：Admin 用户、费率、2 寮 6 部屋、4 社員（含中国出張 1）
- `fixtures/import-sample.xlsx`：最小 5 行合法 + 2 行故意错误

---

## 8.5 验收测试对照（要件定义书）

| 要件 | 测试 ID |
|------|---------|
| 5.1 入居重叠禁止 | OccupancyService + E2E-03 |
| 5.1 性别一致 | OccupancyService |
| 5.2 初回入寮日 | FirstDormUseDate 单元 |
| 6.1 日割り寮費 | FeeCalculationService |
| 8.1 空き室 | VacancyService + E2E-04 |
| 9.3 Excel 导入 | Import API + E2E-05 |
| 10 操作ログ | Audit API 集成 |
| 寮割カレンダー / 印刷 | E2E-07 + CalendarService |
| CSV 导出 | Export API + E2E-08 |
| 責任者 ★ | Dorms PATCH + Calendar isLeader |

---

## 8.6 CI 中执行顺序

```text
lint → unit tests → api integration (testcontainers) → e2e (optional on main)
```

覆盖率目标（MVP）：Service 层行覆盖 ≥ 80%；关键路径 E2E 6 本以上。
