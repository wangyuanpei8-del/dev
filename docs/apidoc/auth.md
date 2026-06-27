# Auth API

| Method | Path | 前端函数 | 说明 |
|--------|------|----------|------|
| POST | `/auth/login` | `login(data)` | `{ email, password }` → tokens + user |
| POST | `/auth/refresh` | `refresh(data)` | `{ refreshToken }` |
| GET | `/auth/me` | `getMe()` | 当前用户与权限 |
