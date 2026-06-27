# 项目智能体

## 03 自动化测试工程师 (`03-自动化测试工程师`)

读取 **`test/`** 下 JSON/Excel 用例，Playwright 可见执行 + PostgreSQL 对照 + 截图 + Markdown 报告。

### 怎么用

1. **Agents 面板**：选择 **自动化测试工程师**
2. **斜杠命令**：`/03-自动化测试工程师 执行 test/寮ProjectWyp_68241.json 的 P1 用例`
3. **命令行**：`npm run test:run:p1`

### 串联

`02-测试用例设计专家` → 生成 `test/*.json/md/xlsx` → **本智能体** → `test/reports/*/test-report.md`

### 修改行为

编辑 `.cursor/agents/03-自动化测试工程师.md`、`test/config/env.json`、`test/run-playwright.mjs`

---

## 02 测试用例设计专家 (`02-测试用例设计专家`)

专职 **寮ProjectWyp** 功能/接口/UI 测试用例设计，输出带 `[操作类型]` 步骤的可自动化用例（MD + JSON + Excel）。

### 怎么用

1. **Agents 面板**：选择 **测试用例设计专家** 新建会话。
2. **斜杠命令**：`/02-测试用例设计专家 为入退寮模块生成用例`
3. **自然语言**：`使用测试用例设计专家，根据 stage-3-prd 生成登录和入退寮用例`

### 输出位置

- `test/寮ProjectWyp_{id}.md` — 人工阅读
- `test/寮ProjectWyp_{id}.json` — 结构化数据
- `test/寮ProjectWyp_{id}.xlsx` — Excel

### 需求来源

- 详细设计：`dom-dev/doc/详细设计/`
- 前端索引：`func_front.md`
- PRD 追溯：`docs/stage-3-prd.md`

### 修改行为

编辑 `.cursor/agents/02-测试用例设计专家.md`

---

## 01 前端开发工程师 (`01-前端开发工程师`)

专职 **Vue3 + Vite + Element-Plus** 企业级 PC 后台开发。输入业务需求、页面功能、模块任务，输出可运行的页面、接口、路由与工具代码。

### 怎么用

1. **Agents 面板**：选择 **前端开发工程师**（或 `01-前端开发工程师`）新建会话。
2. **斜杠命令**：`/01-前端开发工程师` 后描述任务，例如：「按 `apps/web` 实现社員一覧页」。
3. **自然语言**：`使用前端开发工程师，根据 stage-5 实现入退寮模块`。

### 技术栈

Vue3 `<script setup>` + Vite + Axios + Element-Plus + Echarts + Pinia（仅 PC 端，不做移动端）

### 业务文档

- 正式前端代码：`apps/web/src/`
- 功能索引：`func_front.md`
- API 规范：`docs/stage-5-api-spec.md`
- 详细设计（参考）：`dom-dev/doc/详细设计/前端模块/`

### 修改行为

编辑 `.cursor/agents/01-前端开发工程师.md`

---

## AI 全栈交付总指挥 (`ai-sdlc-master`)

基于根目录 `AI_工程化开发总提示词.txt` 配置，用于企业级 Agentic SDLC 全流程交付。

### 怎么用

1. **左侧 Agents 面板**：找到 **ai-sdlc-master**，拖入对话或点击新建 Agent 会话。
2. **斜杠命令**：在输入框输入  
   `/ai-sdlc-master`  
   然后写你的需求，例如：「我有一个在线教育 MVP 想法，帮我从立项开始」。
3. **自然语言**：  
   `使用 ai-sdlc-master 智能体，从 Stage 1 输出项目立项说明书`。
4. **附加总提示词**（可选）：输入 `@AI_工程化开发总提示词.txt` 让模型加载完整模板。

### 修改行为

- 改智能体人设与流程：编辑 `.cursor/agents/ai-sdlc-master.md`
- 改阶段模板与表格格式：编辑项目根目录 `AI_工程化开发总提示词.txt`

### 文件位置

| 文件 | 作用 |
|------|------|
| `.cursor/agents/01-前端开发工程师.md` | Vue3 后台专职 Subagent（本项目前端唯一技术基准） |
| `.cursor/agents/02-测试用例设计专家.md` | 测试用例设计（MD/JSON/Excel，输出 test/） |
| `.cursor/agents/03-自动化测试工程师.md` | Playwright 执行用例 + DB 对照 + 报告 |
| `.cursor/agents/ai-sdlc-master.md` | SDLC 总指挥（前端委派 01 智能体） |
| `AI_工程化开发总提示词.txt` | 完整 Stage 输出模板与规范 |

### 后端说明

本项目正式后端为 **`apps/api`（NestJS + Prisma + PostgreSQL）**，非 Java/SpringBoot。后端开发请直接参照 `docs/stage-5-api-spec.md` 与 `apps/api/src/modules/` 现有模块结构。
