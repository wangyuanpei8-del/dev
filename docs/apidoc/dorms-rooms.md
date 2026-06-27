# Dorms & Rooms API

| Method | Path | 前端函数 | 说明 |
|--------|------|----------|------|
| GET | `/dorms` | `getDorms(params)` | 寮一覧 |
| GET | `/dorms/:id` | `getDorm(id)` | 详情含部屋数 |
| POST | `/dorms` | `createDorm(data)` | 创建 |
| PATCH | `/dorms/:id` | `updateDorm(id, data)` | 更新 + `version` |
| DELETE | `/dorms/:id` | `deleteDorm(id)` | 软删除 |
| GET | `/dorms/:dormId/rooms` | `getRooms(dormId, params)` | 部屋一覧 |
| POST | `/dorms/:dormId/rooms` | `createRoom(dormId, data)` | 创建部屋 |
| PATCH | `/rooms/:id` | `updateRoom(id, data)` | 更新 + `version` |
| DELETE | `/rooms/:id` | `deleteRoom(id)` | 软删除 |
