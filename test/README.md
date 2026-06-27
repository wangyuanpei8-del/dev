# 测试用例交付目录

本目录存放 **寮ProjectWyp** 基于详细设计生成的测试用例。

## 最新批次

| 文件 | 说明 |
|------|------|
| `寮ProjectWyp_68241.json` | 结构化用例（自动化解析） |
| `寮ProjectWyp_68241.md` | 人工阅读（含汇总表 + 详细步骤） |
| `寮ProjectWyp_68241.xlsx` | Excel 8 列格式 |

## 需求来源

- `dom-dev/doc/详细设计/前端模块/*.md`
- `dom-dev/doc/详细设计/寮管理システム-详细设计书.md`

## 重新生成

```powershell
node scripts/generate-dom-test-cases.mjs
node scripts/test-cases-to-xlsx.mjs test/寮ProjectWyp_68241.json
```

## 测试环境

- Web: http://127.0.0.1:3000
- API: http://127.0.0.1:3001/api/v1
- DB: `postgresql://dorm:dorm@localhost:5432/dormitory`

### 测试账号（密码均为 `Admin123!!`）

| 角色 | 邮箱 |
|------|------|
| SYSTEM_ADMIN | admin@example.com |
| VIEWER | viewer@example.com |
| DORM_MANAGER | manager@example.com |
| 测试用户 | test@example.com |

执行前请 `npm run db:seed` 确保账号存在。

## 覆盖率摘要

最新全量结果见 `test/coverage-summary-68241.md` 与 `test/reports/寮ProjectWyp_68241-*/test-report.md`。

## E2E 冒烟

```powershell
npm run test:web
```

## 全量自动化执行（Playwright + 报告）

配置：`test/config/env.json`  
执行器：`test/run-playwright.mjs`

```powershell
npm install          # 首次安装 pg（根目录）
npm run test:run     # 全量 JSON 用例
npm run test:run:p1  # 仅 P1（推荐）
```

报告输出：`test/reports/{批次}-{时间}/test-report.md`

智能体：`.cursor/agents/03-自动化测试工程师.md`

