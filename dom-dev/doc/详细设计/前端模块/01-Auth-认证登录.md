# Auth 模块 — 认证登录（前端）

| 项目 | 内容 |
|------|------|
| 文档编号 | DD-DORM-FE-001 |
| 视图 | `src/views/login/index.vue` |
| API | `src/api/auth.js` |
| API 参照 | `docs/stage-5-api-spec.md` §5.3 |

---

## 1. 模块职责

登录、Token 刷新、登出；Pinia 用户状态；路由守卫数据源。

---

## 2. 页面

| 路由 | 文件 |
|------|------|
| `/login` | `views/login/index.vue` |

UI：品牌标题 + `el-form`（email、password）+ ログイン按钮；`v-loading` 提交态。

---

## 3. API（`src/api/auth.js`）

| 操作 | 方法 | 路径 |
|------|------|------|
| 登录 | POST | `/auth/login` |
| 刷新 | POST | `/auth/refresh` |
| 当前用户 | GET | `/auth/me` |

---

## 4. 表单校验 rules

```javascript
export const loginRules = {
  email: [
    { required: true, message: 'メールアドレスを入力してください', trigger: 'blur' },
    { type: 'email', message: '形式が正しくありません', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'パスワードを入力してください', trigger: 'blur' },
    { min: 10, message: '10文字以上', trigger: 'blur' },
  ],
};
```

---

## 5. Pinia `store/user.js`

- `login(form)` → 存 accessToken、user、permissions
- `refreshToken()` → 401 时调用
- `logout()` → 清 storage + 跳转 login
- `hasPermission(p)` / `hasRole(r)`

---

## 6. 列表刷新

登录成功 `router.replace('/')`；登出 `queryClient` 不适用，清空 Pinia 即可。

---

## 7. 权限

登录页 `meta.public: true`。
