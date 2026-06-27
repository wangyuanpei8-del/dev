# 文档 vs 当前代码 差距表



> **最后更新：2026-06-06**  

> 权威业务口径：`dom-dev/doc/详细设计/寮管理システム-详细设计书.md` **§0 SSOT**  

> 前端索引：`func_front.md` · API：`docs/stage-5-api-spec.md` · 速查：`docs/apidoc/`



## 已对齐



| 领域 | 状态 |

|------|------|

| 前后端业务模块 | `apps/web` + `apps/api` 全模块已实现 |

| Auth / RBAC | JWT + bcrypt |

| Departments / Export / Import CSV | 已实现 |

| 乐观锁 version | 员工、退寮、寮、部屋、费率编辑均已传 `version` |

| Docker | `docker-compose.yml` 默认 DB + `full` profile 全栈 |

| CI | `.github/workflows/ci.yml`（build + migrate + unit + API e2e） |
| 自动化测试 | Jest 单元 21 项 + API 集成 6 项 + Playwright E2E 3 项 |

| API 文档 | `docs/apidoc/` |

| 部署文档 | `stage-9-deployment.md` 已与 compose 对齐 |

| 历史副本 | `dom-dev/apps/web/` **已删除** |

| 空脚手架 | `packages/types/` **已删除** |



## 仍存在的差距（低优先级）



| 领域 | 说明 | 优先级 |

|------|------|--------|

| **浏览器 E2E 接入 CI** | Playwright 已在 `apps/web/e2e/`；本地 `pnpm test:web`；CI 暂未跑 | P3 |

| **后端 PDF 印刷** | Phase 2；MVP 为前端 `window.print` | P3 |

| **长期利用 3 年** | API 已有，需业务验收口径 | P3 |



## 文档注意事项



| 项 | 说明 |

|----|------|

| `.docx` / `.xlsx` 原件 | 不在仓库，以外部要件书为准 |

| `dom-dev/doc/` | 详细设计参考；冲突时以 `func_front.md` + 代码为准 |

| `stage-x-task-breakdown.md` | 已标注各 Epic 完成状态 |



## 建议后续（可选）



1. 实现 T-080/T-081 单元测试与 E2E  

2. CD 流水线（部署到 staging/production）


