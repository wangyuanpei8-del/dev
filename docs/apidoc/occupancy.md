# Occupancy API（入退寮）

| Method | Path | 前端函数 | Query / Body |
|--------|------|----------|--------------|
| GET | `/occupancy-histories` | `getOccupancyHistories(params)` | `q`, `employeeId`, `roomId`, `dormId`, `activeOn`, `page`, `pageSize` |
| GET | `/occupancy-histories/:id` | `getOccupancyHistory(id)` | — |
| POST | `/occupancy-histories` | `createOccupancy(data)` | `{ employeeId, roomId, moveInDate, moveOutDate? }` |
| PATCH | `/occupancy-histories/:id` | `updateOccupancyHistory(id, data)` | 未退寮前可改 + `version` |
| POST | `/occupancy-histories/:id/move-out` | `moveOut(id, data)` | `{ moveOutDate, moveOutReason?, version? }` |
| GET | `/occupancy-histories/long-term-warnings` | `getLongTermWarnings(params)` | `asOfDate?`, `page`, `pageSize` |
| GET | `/occupancy-histories/occupied-count` | `getOccupiedCount(params)` | `activeOn`, `dormId?` |

**乐观锁**：`PATCH` / `move-out` 携带 `version`；冲突返回 `409` + `code=40910`。

**调用链（退寮）**：`move-out.vue` `onMounted` → `getOccupancyHistory(id)` 取 `version` → `moveOut(id, form)` → `OccupancyController.moveOut`
