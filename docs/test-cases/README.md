# 测试用例交付目录

本目录存放 **寮ProjectWyp（社員寮管理システム）** 由「测试用例设计专家」智能体生成的用例。

## 命名规范

```
寮ProjectWyp_{5位随机数或时间戳}.md      # 人工阅读
寮ProjectWyp_{同上}.json                 # 结构化数据（导出 Excel 用）
寮ProjectWyp_{同上}.xlsx                # Excel（与 MD 内容一致）
```

## 生成 Excel

```powershell
node scripts/test-cases-to-xlsx.mjs docs/test-cases/寮ProjectWyp_67890.json
```

## 需求来源（本项目）

| 文档 | 路径 |
|------|------|
| PRD | `docs/stage-3-prd.md` |
| 前端功能索引 | `func_front.md` |
| 测试设计参考 | `docs/stage-8-test-design.md` |
| 项目总览 | `docs/PROJECT-OVERVIEW.md` |

## 与 E2E 的关系

- 日常冒烟：`npm run test:web`（见 `.cursor/skills/playwright-env-setup/SKILL.md`）
- 用例 F 列 `[操作类型]` 步骤格式与 Playwright 自动化智能体对齐

**勿使用** 其他项目的输出路径（如 `D:\AItest\case\`）。
