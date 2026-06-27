# 寮管理システム（Dormitory Management System）— 工程文档索引



本目录依据要件定义书与 Agentic SDLC 流程生成，与 `apps/web`、`apps/api` 实现对齐。



> `.docx` / `.xlsx` 原件不在仓库内；业务口径以 `dom-dev/doc/详细设计/寮管理システム-详细设计书.md` **§0 SSOT** 与 `func_front.md` 为准。



## 文档一览



| 阶段 | 文件 | 说明 |

|------|------|------|

| **总览** | [**PROJECT-OVERVIEW.md**](./PROJECT-OVERVIEW.md) | **项目全貌 / PPT 演讲素材**（结构、功能、技术栈、进度） |

| 状态 | [00-project-status.md](./00-project-status.md) | 已确认 / 未确认 / 技术决策 / 风险 |

| 差距 | [doc-vs-code-gap.md](./doc-vs-code-gap.md) | 文档 vs `apps/*` 差距（已基本对齐） |

| Stage 0 | [stage-0-architecture.md](./stage-0-architecture.md) | 技术栈、系统架构、Monorepo |

| Stage 1 | [stage-1-project-charter.md](./stage-1-project-charter.md) | 立项说明书 |

| Stage 2 | [stage-2-users-rbac.md](./stage-2-users-rbac.md) | RBAC 矩阵 |

| Stage 3 | [stage-3-prd.md](./stage-3-prd.md) | PRD |


| Stage 4 | [stage-4-database.md](./stage-4-database.md) | ER、Prisma Schema |

| Stage 5 | [stage-5-api-spec.md](./stage-5-api-spec.md) | REST API、错误码 |

| API 速查 | [apidoc/README.md](./apidoc/README.md) | 对齐 `apps/web/src/api/*.js` |

| Stage 6 | [stage-6-page-design.md](./stage-6-page-design.md) | 页面列表与布局 |

| Stage 8 | [stage-8-test-design.md](./stage-8-test-design.md) | 测试设计（**已实现**：Jest + Playwright） |

| Stage 9 | [stage-9-deployment.md](./stage-9-deployment.md) | Docker、本地/全栈启动、CI |

| Stage X | [stage-x-task-breakdown.md](./stage-x-task-breakdown.md) | 任务拆解（**已标注完成状态**） |



## 代码入口（Stage 7 — 已实现）



| 应用 | 路径 | 状态 |

|------|------|------|

| Web | `apps/web` | 全部业务页面 + 路由/权限已实现 |

| API | `apps/api` | 全部业务模块（NestJS + Prisma）已实现 |



```bash

pnpm install && pnpm run db:setup && pnpm dev

```



**开发前必读**：根目录 [`func_front.md`](../func_front.md)（前端）、[`docs/apidoc/`](./apidoc/)（接口）、[`docs/stage-5-api-spec.md`](./stage-5-api-spec.md)（后端契约）。



详细设计参考：`dom-dev/doc/详细设计/`（仅文档，无前端代码副本）。



## 开发顺序（铁律）



1. 基础架构 → 2. 数据模型 → 3. API → 4. 页面 → 5. 优化



当前阶段：**5. 优化**（CI build ✅；单元/E2E 测试待补）


