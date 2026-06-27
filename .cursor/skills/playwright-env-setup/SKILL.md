---
name: playwright-env-setup
description: >-
  寮ProjectWyp（社員寮管理）专用 Playwright E2E 环境安装与执行。
  当用户说「安装 playwright 环境」「跑 E2E」「跑自动化测试」「test:web」时使用。
disable-model-invocation: true
---

# 寮ProjectWyp — Playwright E2E（项目专用）

## 推荐：Smoke（默认 `test:web`）

前后端已启动时（本地日常最快）：

```powershell
# 终端 1：API
Set-Location apps/api; npm run dev

# 终端 2：Web
Set-Location apps/web; npm run dev

# 终端 3：Smoke（项目根）
npm run test:web
```

Smoke 脚本：`apps/web/scripts/run-e2e-smoke.mjs`（直接用 `playwright` 库，不经过 test runner，Windows 更稳）。

## 完整 Playwright Test（`test:web:full`）

```powershell
# 确保 3000 / 3001 已就绪
Set-Location apps/web
node ./node_modules/@playwright/test/cli.js test --reporter=line
```

或项目根：

```powershell
npm run test:web:full
```

**注意**：`playwright.config.js` 默认**不会**自动起 dev server。只有 CI 或显式 `PW_TEST_AUTO_SERVER=1` 时才自动启动。

```powershell
$env:PW_TEST_AUTO_SERVER='1'
npm run test:web:full
```

## 首次环境

```powershell
npm run db:setup
Set-Location apps/web
npx playwright install chromium
```

## 结构

| 项 | 值 |
|----|-----|
| Smoke 脚本 | `apps/web/scripts/run-e2e-smoke.mjs` |
| E2E 配置 | `apps/web/playwright.config.js` |
| 用例 | `apps/web/e2e/*.spec.js` |
| 框架 | `@playwright/test` + `playwright` |
| Web | http://127.0.0.1:3000 |
| API | http://127.0.0.1:3001/api/v1/health |
| DB | PostgreSQL，`npm run db:setup` |

## npm scripts

| 命令 | 说明 |
|------|------|
| `npm run test:web` | Smoke（5 项：health / 登录 / hub / 向导 / 履历） |
| `npm run test:web:full` | 完整 `@playwright/test` 套件 |
| `npm run test:e2e:smoke --prefix apps/web` | 同上 Smoke |
| `npm run test:e2e --prefix apps/web` | 完整套件 |

## 测试账号

- `admin@example.com` / `Admin123!!`

## Agent 执行清单

1. `node --version` >= 20
2. `docker ps` → postgres healthy（否则 `npm run db:up`）
3. 确认 API/Web 200：`Invoke-WebRequest http://127.0.0.1:3001/api/v1/health` 与 `:3000`
4. 缺浏览器：`npx playwright install chromium`（在 `apps/web`）
5. **优先** `npm run test:web`；需完整套件时 `npm run test:web:full`

## 故障排除（Windows）

| 现象 | 处理 |
|------|------|
| `test:web:full` 长时间无输出 | 先 `npm run test:web` 验证环境；杀掉残留 `node … playwright` 进程后重试 |
| 端口占用 | API 3001 / Web 3000 已被占用时，config 会 `reuseExistingServer`（仅 `PW_TEST_AUTO_SERVER=1` 时） |
| API 连接失败 | `npm run db:setup` 后重启 `apps/api` |
| 首次 runner 慢 | `--list` 可能需 30s+，属正常；Smoke 通常 <15s |

## 用例覆盖（full 套件）

- 登录成功 / 失败
- 入退寮 hub 三卡片
- 入居・退寮向导「社員から／寮から」入口
- 履历页 CSV 按钮可见
