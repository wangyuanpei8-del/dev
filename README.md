# 寮管理システム Monorepo



## 快速启动



```bash

pnpm install

npm run db:setup    # 首次：Docker PG + migrate + seed

pnpm dev

```



| 服务 | 地址 |

|------|------|

| Web | http://localhost:3000 |

| API | http://localhost:3001/api/v1 |

| Health | http://localhost:3001/api/v1/health |

| Adminer | http://localhost:8080 |



**默认管理员**（`apps/api/prisma/seed.ts`）：`admin@example.com` / `Admin123!!`



## 结构



| 路径 | 说明 |

|------|------|

| `apps/web` | **正式前端** Vue3 + Vite + Element Plus |

| `apps/api` | **正式后端** NestJS + Prisma + PostgreSQL |

| `func_front.md` | 前端功能索引（开发前必读） |

| `docs/` | SDLC 文档 + `docs/apidoc/` 接口速查 |

| `dom-dev/doc/` | 详细设计文档（参考） |

| `.github/workflows/ci.yml` | CI：build + migrate + 自动测试 |



## 开发命令



```bash

pnpm dev:web          # 仅前端

pnpm dev:api          # 仅后端

npm run db:up         # 仅启动 Postgres + Adminer

npm run docker:full   # 全栈容器演示（api + web + db）

pnpm test             # 自动测试：单元 + API 集成（需 DB 已 setup）
pnpm test:unit        # 仅单元测试（不需数据库，最快）
pnpm test:web         # 浏览器 E2E（需 DB，自动起 web+api）

```



## 文档索引



| 用途 | 文件 |

|------|------|

| **项目总览 / PPT 素材** | `docs/PROJECT-OVERVIEW.md` |

| 前端代码清单 | `func_front.md` |

| API 规格 | `docs/stage-5-api-spec.md` |

| API 速查 | `docs/apidoc/README.md` |

| 部署 | `docs/stage-9-deployment.md` |

| 任务完成状态 | `docs/stage-x-task-breakdown.md` |

| 文档 vs 代码差距 | `docs/doc-vs-code-gap.md` |

| 前端智能体 | `.cursor/agents/01-前端开发工程师.md` |

| 页面模块设计（参考） | `dom-dev/doc/详细设计/前端模块/README.md` |


