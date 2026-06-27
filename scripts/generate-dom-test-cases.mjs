#!/usr/bin/env node
/**
 * 根据 dom-dev/doc/详细设计 生成测试用例 JSON + MD
 * 用法: node scripts/generate-dom-test-cases.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'test');
const batchId = '68241';
const baseName = `寮ProjectWyp_${batchId}`;

const PRE = (extra = '') =>
  [
    '1. 前后端已启动（http://127.0.0.1:3000 + http://127.0.0.1:3001/api/v1）',
    '2. PostgreSQL 连接正常',
    '3. 已登录 admin@example.com / Admin123!!',
    extra,
  ]
    .filter(Boolean)
    .join('\n');

const LOGIN = `1. [导航] /login
2. [输入] getByLabel('メールアドレス')::admin@example.com
3. [输入] getByLabel('パスワード')::Admin123!!
4. [点击] ログイン
5. [等待] 2000`;

const cases = [
  // === Auth DD-FE-001 ===
  {
    module: '认证登录',
    requirement: 'DD-DORM-FE-001 §2-4',
    name: '正常登录_验证跳转仪表盘',
    preconditions: '1. 前后端已启动\n2. PostgreSQL 连接正常\n3. 存在 admin@example.com / Admin123!!',
    type: '功能测试',
    steps: `${LOGIN}\n6. [断言URL] /\n7. [断言] おはようございます 可见`,
    expected: '1. 打开登录页\n2. 邮箱填入\n3. 密码密文\n4. 提交\n5. 等待\n6. URL 为首页\n7. 显示仪表盘',
    priority: 'P1',
  },
  {
    module: '认证登录',
    requirement: 'DD-DORM-FE-001 §4 loginRules',
    name: '异常登录_验证错误密码停留登录页',
    preconditions: '1. 前后端已启动\n2. PostgreSQL 连接正常',
    type: '功能测试',
    steps: `1. [导航] /login\n2. [输入] getByLabel('メールアドレス')::admin@example.com\n3. [输入] getByLabel('パスワード')::wrong-pass\n4. [点击] ログイン\n5. [等待] 2000\n6. [断言URL] /login`,
    expected: '1. 登录页加载\n2-3. 凭证填入\n4. 提交\n5. 等待\n6. 仍在登录页',
    priority: 'P1',
  },
  {
    module: '认证登录',
    requirement: 'DD-DORM-FE-001 §4 email 校验',
    name: '边界输入_验证空邮箱表单校验',
    preconditions: '1. 前后端已启动',
    type: '鲁棒性测试',
    steps: `1. [导航] /login\n2. [点击] ログイン\n3. [断言] メールアドレスを入力してください 可见`,
    expected: '1. 登录页\n2. 触发表单校验\n3. 显示必填提示',
    priority: 'P2',
  },
  {
    module: '认证登录',
    requirement: 'DD-DORM-FE-001 §5 logout',
    name: '正常登出_验证返回登录页',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [点击] ログアウト\n7. [断言URL] /login`,
    expected: '1-5. 登录成功\n6. 点击登出\n7. 跳转登录页',
    priority: 'P2',
  },
  {
    module: '认证登录',
    requirement: 'DD-DORM-FE-001 §3 GET /auth/me',
    name: 'DB验证_登录后用户记录存在',
    preconditions: '1. 前后端已启动\n2. admin 账号存在',
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT id,email,role FROM "user" WHERE email='admin@example.com' AND deleted_at IS NULL`,
    expected: '1-5. 登录成功\n6. 返回一条 admin 用户',
    priority: 'P2',
  },

  // === Users DD-FE-002 ===
  {
    module: '用户管理',
    requirement: 'DD-DORM-FE-002 §2',
    name: '正常访问_验证用户列表加载',
    preconditions: PRE('4. 当前角色 SYSTEM_ADMIN'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /settings/users\n7. [断言] ユーザー 可见`,
    expected: '1-5. 登录\n6. 打开用户管理\n7. 页面标题/表格可见',
    priority: 'P2',
  },
  {
    module: '用户管理',
    requirement: 'DD-DORM-FE-002 §6 Dialog CRUD',
    name: '正常新增_打开用户注册Dialog',
    preconditions: PRE('4. SYSTEM_ADMIN'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /settings/users\n7. [点击] 新規登録\n8. [断言] ユーザー登録 可见`,
    expected: '1-5. 登录\n6. 列表页\n7. 打开 Dialog\n8. 标题显示',
    priority: 'P2',
  },
  {
    module: '用户管理',
    requirement: 'DD-DORM-FE-002 §4 userRules',
    name: '边界输入_验证新用户邮箱格式',
    preconditions: PRE('4. SYSTEM_ADMIN'),
    type: '鲁棒性测试',
    steps: `${LOGIN}\n6. [导航] /settings/users\n7. [点击] 新規登録\n8. [输入] getByLabel('メールアドレス')::not-an-email\n9. [点击] 保存\n10. [断言] 形式 可见`,
    expected: '1-7. 打开表单\n8. 无效邮箱\n9. 提交\n10. 格式错误提示',
    priority: 'P3',
  },
  {
    module: '用户管理',
    requirement: 'DD-DORM-FE-002 §5 权限',
    name: '权限校验_VIEWER无法访问用户管理',
    preconditions: '1. 前后端已启动\n2. 存在 VIEWER 账号 viewer@example.com',
    type: '安全测试',
    steps: `1. [导航] /login\n2. [输入] getByLabel('メールアドレス')::viewer@example.com\n3. [输入] getByLabel('パスワード')::{VIEWER密码}\n4. [点击] ログイン\n5. [导航] /settings/users\n6. [断言URL] /403`,
    expected: '1-4. VIEWER 登录\n5. 访问用户管理\n6. 跳转 403',
    priority: 'P2',
  },
  {
    module: '用户管理',
    requirement: 'DD-DORM-FE-002 §6 停用',
    name: 'DB验证_停用用户is_active为false',
    preconditions: PRE('4. SYSTEM_ADMIN\n5. 存在测试用户 test@example.com'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /settings/users\n7. [DB] SELECT id,is_active FROM "user" WHERE email='test@example.com'`,
    expected: '1-6. 进入列表\n7. 可查询用户状态字段',
    priority: 'P3',
  },

  // === Dashboard DD-FE-003 ===
  {
    module: '仪表盘',
    requirement: 'DD-DORM-FE-003 §2',
    name: '正常加载_验证首页KPI显示',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [断言] 在室 可见\n7. [断言] 空室 可见`,
    expected: '1-5. 登录\n6. 在室 KPI\n7. 空室 KPI',
    priority: 'P1',
  },
  {
    module: '仪表盘',
    requirement: 'DD-DORM-FE-003 §3 快捷操作',
    name: '正常操作_验证快捷按钮跳转入退寮',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [点击] 入退寮\n7. [断言URL] /occupancy`,
    expected: '1-5. 登录\n6. 点击快捷\n7. 进入 hub',
    priority: 'P1',
  },
  {
    module: '仪表盘',
    requirement: 'DD-DORM-FE-003 §3 occupied-count',
    name: 'DB验证_在室人数与API一致',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT COUNT(*) AS cnt FROM occupancy_history WHERE move_out_date IS NULL AND deleted_at IS NULL`,
    expected: '1-5. 登录\n6. 返回在室记录数',
    priority: 'P2',
  },
  {
    module: '仪表盘',
    requirement: 'DD-DORM-FE-003 §5 权限',
    name: '权限校验_快捷按钮按权限隐藏',
    preconditions: '1. 前后端已启动\n2. VIEWER 已登录',
    type: '安全测试',
    steps: `1. [导航] /\n2. [断言] おはようございます 可见\n3. [断言] 入寮登録 不可见`,
    expected: '1. 首页\n2. KPI 可见\n3. 写操作快捷不可见',
    priority: 'P3',
  },
  {
    module: '仪表盘',
    requirement: 'DD-DORM-FE-003 §6 刷新',
    name: '正常刷新_点击刷新按钮重载数据',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [点击] .home__refresh\n7. [等待] 2000\n8. [断言] 在室 可见`,
    expected: '1-5. 登录\n6. 点击刷新\n7. loading\n8. 数据仍显示',
    priority: 'P3',
  },

  // === Employees DD-FE-004 ===
  {
    module: '社员管理',
    requirement: 'DD-DORM-FE-004 §2',
    name: '正常加载_验证社员列表',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /employees\n7. [断言] 社員 可见`,
    expected: '1-5. 登录\n6. 打开社员页\n7. 标题/表格可见',
    priority: 'P2',
  },
  {
    module: '社员管理',
    requirement: 'DD-DORM-FE-004 §2 Dialog',
    name: '正常新增_打开社员登记Dialog',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /employees\n7. [点击] 新規登録\n8. [断言] 社員登録 可见`,
    expected: '1-6. 列表\n7. 打开 Dialog\n8. 表单可见',
    priority: 'P2',
  },
  {
    module: '社员管理',
    requirement: 'DD-DORM-FE-004 §4 employeeRules',
    name: '边界输入_验证氏名必填',
    preconditions: PRE(),
    type: '鲁棒性测试',
    steps: `${LOGIN}\n6. [导航] /employees\n7. [点击] 新規登録\n8. [点击] 保存\n9. [断言] 氏名 可见`,
    expected: '1-7. 打开表单\n8. 空提交\n9. 校验提示',
    priority: 'P3',
  },
  {
    module: '社员管理',
    requirement: 'DD-DORM-FE-004 §2 筛选',
    name: '正常搜索_按氏名关键字筛选',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /employees\n7. [输入] input[placeholder*="氏名"]::山田\n8. [点击] 検索\n9. [等待] 2000`,
    expected: '1-6. 列表\n7. 输入关键字\n8. 搜索\n9. 表格刷新',
    priority: 'P3',
  },
  {
    module: '社员管理',
    requirement: 'DD-DORM-FE-004 §3 /employees/:id',
    name: '正常访问_验证社员360详情页',
    preconditions: PRE('4. 存在社员记录'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /employees\n7. [点击] 詳細\n8. [断言] 360° 可见`,
    expected: '1-6. 列表\n7. 进入详情\n8. 360 视图显示',
    priority: 'P2',
  },

  // === Dorms DD-FE-005 ===
  {
    module: '寮管理',
    requirement: 'DD-DORM-FE-005 §2',
    name: '正常加载_验证寮列表',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /dorms\n7. [断言] 寮 可见`,
    expected: '1-5. 登录\n6. 寮列表\n7. 页面可见',
    priority: 'P2',
  },
  {
    module: '寮管理',
    requirement: 'DD-DORM-FE-005 §4 dormRules',
    name: '正常新增_打开寮登记Dialog',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /dorms\n7. [点击] 新規登録\n8. [断言] 寮登録 可见`,
    expected: '1-6. 列表\n7. Dialog\n8. 表单标题',
    priority: 'P2',
  },
  {
    module: '寮管理',
    requirement: 'DD-DORM-FE-005 §2 detail',
    name: '正常访问_验证寮详情Tab',
    preconditions: PRE('4. 存在寮记录'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /dorms\n7. [点击] 詳細\n8. [断言] 部屋 可见`,
    expected: '1-6. 列表\n7. 详情\n8. Tab 可见',
    priority: 'P2',
  },
  {
    module: '寮管理',
    requirement: 'DD-DORM-FE-005 §5 genderType Admin',
    name: '权限校验_非Admin不可改genderType',
    preconditions: '1. DORM_MANAGER 已登录',
    type: '安全测试',
    steps: `1. [导航] /dorms\n2. [点击] 編集\n3. [断言] genderType 不可编辑`,
    expected: '1. 列表\n2. 编辑\n3. 字段只读或隐藏',
    priority: 'P3',
  },
  {
    module: '寮管理',
    requirement: 'DD-DORM-FE-005 §3',
    name: 'DB验证_寮主数据存在',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT id,code,name,gender_type FROM dorm WHERE deleted_at IS NULL LIMIT 5`,
    expected: '1-5. 登录\n6. 返回寮记录',
    priority: 'P3',
  },

  // === Rooms DD-FE-006 ===
  {
    module: '部屋管理',
    requirement: 'DD-DORM-FE-006 §2',
    name: '正常加载_验证部屋Tab列表',
    preconditions: PRE('4. 存在寮及部屋'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /dorms\n7. [点击] 詳細\n8. [点击] 部屋\n9. [断言] 部屋一覧 可见`,
    expected: '1-7. 进入详情\n8. 部屋 Tab\n9. 表格显示',
    priority: 'P2',
  },
  {
    module: '部屋管理',
    requirement: 'DD-DORM-FE-006 §4 roomRules',
    name: '正常新增_打开部屋登记Dialog',
    preconditions: PRE('4. 存在寮'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /dorms/{dormId}\n7. [点击] 部屋追加\n8. [断言] 部屋 可见`,
    expected: '1-6. 详情\n7. 新增\n8. Dialog',
    priority: 'P2',
  },
  {
    module: '部屋管理',
    requirement: 'DD-DORM-FE-006 §4 areaSqm',
    name: '边界输入_验证面积必填',
    preconditions: PRE('4. 寮详情页'),
    type: '鲁棒性测试',
    steps: `${LOGIN}\n6. [导航] /dorms/{dormId}\n7. [点击] 部屋追加\n8. [点击] 保存\n9. [断言] 面积 可见`,
    expected: '1-7. 打开表单\n8. 提交\n9. 校验提示',
    priority: 'P3',
  },
  {
    module: '部屋管理',
    requirement: 'DD-DORM-FE-006 §6 refresh vacancies',
    name: 'DB验证_部屋创建后room表新增',
    preconditions: PRE('4. 测试部屋 code=TC-ROOM-01'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT id,code,name FROM room WHERE code='TC-ROOM-01' AND deleted_at IS NULL`,
    expected: '1-5. 登录\n6. 可查到部屋（若已创建）',
    priority: 'P3',
  },
  {
    module: '部屋管理',
    requirement: 'DD-DORM-FE-006 §5 权限',
    name: '权限校验_VIEWER不可编辑部屋',
    preconditions: '1. VIEWER 已登录',
    type: '安全测试',
    steps: `1. [导航] /dorms/{dormId}\n2. [断言] 部屋追加 不可见`,
    expected: '1. 详情\n2. 写按钮隐藏',
    priority: 'P3',
  },

  // === Occupancy DD-FE-007 ===
  {
    module: '入退寮管理',
    requirement: 'DD-DORM-FE-007 §2 hub',
    name: '正常访问_验证入退寮hub三卡片',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /occupancy\n7. [断言] 入寮登録 可见\n8. [断言] 退寮登録 可见\n9. [断言] 入退寮履歴 可见`,
    expected: '1-5. 登录\n6. hub\n7-9. 三卡片',
    priority: 'P1',
  },
  {
    module: '入退寮管理',
    requirement: 'DD-DORM-FE-007 §3 入居向导',
    name: '正常访问_验证入居双路径入口',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /occupancy/create\n7. [断言] 登録方法を選択してください 可见\n8. [断言] 社員から選ぶ 可见`,
    expected: '1-5. 登录\n6. 向导\n7-8. 双路径',
    priority: 'P1',
  },
  {
    module: '入退寮管理',
    requirement: 'DD-DORM-FE-007 §3 空室文案',
    name: '边界场景_无可入居部屋显示警告',
    preconditions: PRE('4. 所选社员无可分配部屋'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /occupancy/create\n7. [点击] 社員から選ぶ\n8. [断言] 該当する空室がありません 可见`,
    expected: '1-7. 进入向导\n8. 空室警告',
    priority: 'P2',
  },
  {
    module: '入退寮管理',
    requirement: 'DD-DORM-FE-007 §4 退寮',
    name: '正常访问_验证退寮向导入口',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /occupancy/move-out\n7. [断言] 登録方法を選択してください 可见`,
    expected: '1-5. 登录\n6. 退寮向导\n7. 模式选择',
    priority: 'P1',
  },
  {
    module: '入退寮管理',
    requirement: 'DD-DORM-FE-007 §4 CSV',
    name: '正常导出_履历页CSV按钮',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /occupancy/history\n7. [点击] ＣＳＶ出力\n8. [等待] 3000`,
    expected: '1-5. 登录\n6. 履历\n7. 触发下载\n8. 文件生成',
    priority: 'P3',
  },

  // === Vacancies DD-FE-008 ===
  {
    module: '空室管理',
    requirement: 'DD-DORM-FE-008 §2',
    name: '正常加载_验证空室一覧',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /vacancies\n7. [断言] 空き室 可见`,
    expected: '1-5. 登录\n6. 空室页\n7. 标题可见',
    priority: 'P2',
  },
  {
    module: '空室管理',
    requirement: 'DD-DORM-FE-008 §3 Badge VACANT',
    name: '正常显示_空室Badge',
    preconditions: PRE('4. 存在空室部屋'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /vacancies\n7. [断言] 空室 可见`,
    expected: '1-6. 页面\n7. 空室标签',
    priority: 'P2',
  },
  {
    module: '空室管理',
    requirement: 'DD-DORM-FE-008 §2 location',
    name: '正常筛选_按地域过滤',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /vacancies\n7. [选择] .el-select::TOKYO\n8. [等待] 2000`,
    expected: '1-6. 页面\n7. 选东京\n8. 列表刷新',
    priority: 'P3',
  },
  {
    module: '空室管理',
    requirement: 'DD-DORM-FE-008 §4 assignable-rooms',
    name: '接口验证_可入居部屋API',
    preconditions: PRE('4. 存在可入居社员'),
    type: '接口测试',
    steps: `${LOGIN}\n6. [导航] /occupancy/create\n7. [点击] 社員から選ぶ\n8. [DB] SELECT COUNT(*) FROM room r JOIN dorm d ON r.dorm_id=d.id WHERE r.deleted_at IS NULL`,
    expected: '1-7. 向导\n8. 部屋数据可查',
    priority: 'P2',
  },
  {
    module: '空室管理',
    requirement: 'DD-DORM-FE-008 §5 只读',
    name: '权限校验_VIEWER可查看空室',
    preconditions: '1. VIEWER 已登录',
    type: '功能测试',
    steps: `1. [导航] /vacancies\n2. [断言] 空き室 可见`,
    expected: '1. 打开\n2. 只读可访问',
    priority: 'P3',
  },

  // === Fees DD-FE-009 ===
  {
    module: '寮费管理',
    requirement: 'DD-DORM-FE-009 §2',
    name: '正常加载_验证寮费一覧',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /fees\n7. [断言] 寮費 可见`,
    expected: '1-5. 登录\n6. 寮费页\n7. 列表可见',
    priority: 'P2',
  },
  {
    module: '寮费管理',
    requirement: 'DD-DORM-FE-009 §2 calculate',
    name: '正常访问_验证算定页',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /fees/calculate\n7. [断言] 寮費算定 可见`,
    expected: '1-5. 登录\n6. 算定页\n7. 表单可见',
    priority: 'P2',
  },
  {
    module: '寮费管理',
    requirement: 'DD-DORM-FE-009 §4 calculateRules',
    name: '边界输入_验证年月格式',
    preconditions: PRE(),
    type: '鲁棒性测试',
    steps: `${LOGIN}\n6. [导航] /fees/calculate\n7. [输入] input::2026-13\n8. [点击] 算定\n9. [断言] 形式 可见`,
    expected: '1-6. 算定页\n7. 无效月\n8. 提交\n9. 校验失败',
    priority: 'P3',
  },
  {
    module: '寮费管理',
    requirement: 'DD-DORM-FE-009 §2 確定',
    name: '正常操作_草稿寮费確定流程',
    preconditions: PRE('4. 存在 DRAFT 寮费'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /fees\n7. [点击] 確定\n8. [点击] 确定\n9. [断言] 確定済 可见`,
    expected: '1-6. 列表\n7. 确认框\n8. 确定\n9. 状态变更',
    priority: 'P2',
  },
  {
    module: '寮费管理',
    requirement: 'DD-DORM-FE-009 §3',
    name: 'DB验证_寮费DRAFT记录',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT id,status,year_month FROM dorm_fee WHERE status='DRAFT' AND deleted_at IS NULL LIMIT 5`,
    expected: '1-5. 登录\n6. 返回草稿记录',
    priority: 'P3',
  },

  // === Import DD-FE-010 ===
  {
    module: '数据导入',
    requirement: 'DD-DORM-FE-010 §2',
    name: '正常访问_验证导入四步向导',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /import\n7. [断言] アップロード 可见`,
    expected: '1-5. 登录\n6. 导入页\n7. Step1 可见',
    priority: 'P3',
  },
  {
    module: '数据导入',
    requirement: 'DD-DORM-FE-010 §2 upload',
    name: '正常上传_显示文件选择区',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /import\n7. [断言] ドラッグ 可见`,
    expected: '1-6. 导入\n7. 上传区',
    priority: 'P3',
  },
  {
    module: '数据导入',
    requirement: 'DD-DORM-FE-010 §3 preview',
    name: '异常场景_预览含错误行',
    preconditions: PRE('4. 已上传含缺列 Excel'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /import\n7. [断言] エラー 可见`,
    expected: '1-6. 导入流程\n7. 错误行提示',
    priority: 'P3',
  },
  {
    module: '数据导入',
    requirement: 'DD-DORM-FE-010 §5 权限',
    name: '权限校验_VIEWER无法导入',
    preconditions: '1. VIEWER 已登录',
    type: '安全测试',
    steps: `1. [导航] /import\n2. [断言URL] /403`,
    expected: '1. 访问\n2. 403',
    priority: 'P2',
  },
  {
    module: '数据导入',
    requirement: 'DD-DORM-FE-010 §3 import_job',
    name: 'DB验证_导入任务记录',
    preconditions: PRE('4. 曾执行导入'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT id,status FROM import_job ORDER BY created_at DESC LIMIT 3`,
    expected: '1-5. 登录\n6. 返回 job 记录',
    priority: 'P4',
  },

  // === Equipment DD-FE-011 ===
  {
    module: '备品管理',
    requirement: 'DD-DORM-FE-011 §2',
    name: '正常加载_验证备品双Tab',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /equipment\n7. [断言] 備品 可见\n8. [断言] 保管場所 可见`,
    expected: '1-5. 登录\n6. 备品页\n7-8. 双 Tab',
    priority: 'P3',
  },
  {
    module: '备品管理',
    requirement: 'DD-DORM-FE-011 §3 equipment-items',
    name: '正常新增_打开备品登记Dialog',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /equipment\n7. [点击] 新規登録\n8. [断言] 備品 可见`,
    expected: '1-6. Tab\n7. Dialog\n8. 表单',
    priority: 'P3',
  },
  {
    module: '备品管理',
    requirement: 'DD-DORM-FE-011 §4 equipmentItemRules',
    name: '边界输入_验证备品名称必填',
    preconditions: PRE(),
    type: '鲁棒性测试',
    steps: `${LOGIN}\n6. [导航] /equipment\n7. [点击] 新規登録\n8. [点击] 保存\n9. [断言] 名称 可见`,
    expected: '1-7. 表单\n8. 提交\n9. 校验',
    priority: 'P4',
  },
  {
    module: '备品管理',
    requirement: 'DD-DORM-FE-011 §3 storage-locations',
    name: '正常切换_保管场所Tab列表',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /equipment\n7. [点击] 保管場所\n8. [等待] 2000`,
    expected: '1-6. 页面\n7. 切换 Tab\n8. 列表加载',
    priority: 'P3',
  },
  {
    module: '备品管理',
    requirement: 'DD-DORM-FE-011 §3',
    name: 'DB验证_备品主数据',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT id,name FROM equipment_item WHERE deleted_at IS NULL LIMIT 5`,
    expected: '1-5. 登录\n6. 备品记录',
    priority: 'P4',
  },

  // === Audit DD-FE-012 ===
  {
    module: '审计日志',
    requirement: 'DD-DORM-FE-012 §2',
    name: '正常加载_验证操作ログ列表',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /audit\n7. [断言] 操作ログ 可见`,
    expected: '1-5. 登录\n6. 审计页\n7. 表格',
    priority: 'P3',
  },
  {
    module: '审计日志',
    requirement: 'DD-DORM-FE-012 §2 drawer',
    name: '正常查看_打开前后值Drawer',
    preconditions: PRE('4. 存在 UPDATE 日志'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /audit\n7. [点击] 詳細\n8. [断言] before 可见`,
    expected: '1-6. 列表\n7. Drawer\n8. JSON 展示',
    priority: 'P3',
  },
  {
    module: '审计日志',
    requirement: 'DD-DORM-FE-012 §2 筛选',
    name: '正常筛选_按实体类型过滤',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /audit\n7. [选择] .el-select::OccupancyHistory\n8. [点击] 検索`,
    expected: '1-6. 列表\n7. 选类型\n8. 刷新',
    priority: 'P3',
  },
  {
    module: '审计日志',
    requirement: 'DD-DORM-FE-012 §5 VIEWER无',
    name: '权限校验_VIEWER无法访问审计',
    preconditions: '1. VIEWER 已登录',
    type: '安全测试',
    steps: `1. [导航] /audit\n2. [断言URL] /403`,
    expected: '1. 访问\n2. 403',
    priority: 'P2',
  },
  {
    module: '审计日志',
    requirement: 'DD-DORM-FE-012 §4',
    name: 'DB验证_审计日志记录',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [DB] SELECT id,action,entity_type FROM audit_log ORDER BY created_at DESC LIMIT 5`,
    expected: '1-5. 登录\n6. 返回日志',
    priority: 'P3',
  },

  // === Layout DD-FE-013 ===
  {
    module: '布局与导航',
    requirement: 'DD-DORM-FE-013 §1 Sidebar',
    name: '正常显示_验证侧栏分组菜单',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [断言] ホーム 可见\n7. [断言] 入退寮 可见\n8. [断言] 社員 可见`,
    expected: '1-5. 登录\n6-8. 菜单项',
    priority: 'P2',
  },
  {
    module: '布局与导航',
    requirement: 'DD-DORM-FE-013 §2 路由守卫',
    name: '异常访问_未登录跳转登录页',
    preconditions: '1. 前后端已启动\n2. 未登录',
    type: '安全测试',
    steps: `1. [导航] /employees\n2. [断言URL] /login`,
    expected: '1. 直接访问\n2. 重定向登录',
    priority: 'P1',
  },
  {
    module: '布局与导航',
    requirement: 'DD-DORM-FE-013 §4 empty',
    name: '边界场景_空列表显示el-empty',
    preconditions: PRE('4. 筛选无结果'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /employees\n7. [输入] input[placeholder*="氏名"]::ZZZNOTEXIST\n8. [点击] 検索\n9. [断言] データがありません 可见`,
    expected: '1-8. 搜索\n9. 空状态',
    priority: 'P3',
  },
  {
    module: '布局与导航',
    requirement: 'DD-DORM-FE-013 §1 Header',
    name: '正常显示_验证Header面包屑',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /occupancy/history\n7. [断言] 入退寮履歴 可见`,
    expected: '1-5. 登录\n6. 履历\n7. 面包屑/标题',
    priority: 'P3',
  },
  {
    module: '布局与导航',
    requirement: 'DD-DORM-FE-013 §2 /403',
    name: '正常访问_403页面显示',
    preconditions: '1. VIEWER 无 audit 权限',
    type: '功能测试',
    steps: `1. [导航] /403\n2. [断言] アクセス 可见`,
    expected: '1. 403 页\n2. 提示可见',
    priority: 'P4',
  },

  // === Calendar DD-FE-014 ===
  {
    module: '寮割カレンダー',
    requirement: 'DD-DORM-FE-014 §2',
    name: '正常加载_验证寮割月历',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /allocation-calendar\n7. [断言] 寮割 可见`,
    expected: '1-5. 登录\n6. 日历页\n7. 网格可见',
    priority: 'P1',
  },
  {
    module: '寮割カレンダー',
    requirement: 'DD-DORM-FE-014 §1 月切替',
    name: '正常操作_切换翌月',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /allocation-calendar\n7. [点击] 翌月\n8. [等待] 2000`,
    expected: '1-6. 日历\n7. 下月\n8. 数据刷新',
    priority: 'P2',
  },
  {
    module: '寮割カレンダー',
    requirement: 'DD-DORM-FE-014 §1 氏名搜索',
    name: '正常搜索_按氏名过滤',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /allocation-calendar\n7. [输入] input[placeholder*="氏名"]::山田\n8. [点击] 検索`,
    expected: '1-6. 日历\n7. 关键字\n8. 过滤结果',
    priority: 'P2',
  },
  {
    module: '寮割カレンダー',
    requirement: 'DD-DORM-FE-014 §4 CSV',
    name: '正常导出_寮割CSV',
    preconditions: PRE(),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /allocation-calendar\n7. [点击] CSV\n8. [等待] 3000`,
    expected: '1-6. 日历\n7. 导出\n8. 下载',
    priority: 'P3',
  },
  {
    module: '寮割カレンダー',
    requirement: 'DD-DORM-FE-014 §3.1 闭区间',
    name: '规则校验_退寮日当天仍在室显示',
    preconditions: PRE('4. 存在 move_out_date=今日 的记录'),
    type: '功能测试',
    steps: `${LOGIN}\n6. [导航] /allocation-calendar\n7. [DB] SELECT id,move_out_date FROM occupancy_history WHERE move_out_date=CURRENT_DATE LIMIT 1`,
    expected: '1-6. 日历\n7. 当日仍算在室',
    priority: 'P1',
  },
];

function buildSummary(list) {
  const map = new Map();
  for (const c of list) {
    if (!map.has(c.module)) map.set(c.module, { total: 0, P1: 0, P2: 0, P3: 0, P4: 0 });
    const s = map.get(c.module);
    s.total++;
    s[c.priority]++;
  }
  return map;
}

function stepsToTable(steps, expected) {
  const sLines = steps.split('\n').filter(Boolean);
  const eLines = expected.split('\n').filter(Boolean);
  const rows = sLines.map((s, i) => {
    const m = s.match(/^\d+\.\s*(.+)/);
    const op = m ? m[1] : s;
    const em = eLines[i]?.replace(/^\d+\.\s*/, '') || '—';
    return `| ${i + 1} | ${op} | ${em} |`;
  });
  return rows.join('\n');
}

function buildMarkdown(list) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const summary = buildSummary(list);
  let md = `# 寮ProjectWyp 测试用例

> 生成时间: ${now}
> 需求来源: dom-dev/doc/详细设计/前端模块 + 寮管理システム-详细设计书.md
> 测试环境: http://127.0.0.1:3000 + http://127.0.0.1:3001/api/v1
> 数据库: PostgreSQL (Docker / Prisma)
> 对应 Excel: ${baseName}.xlsx
> 对应 JSON: ${baseName}.json

---

## 用例汇总

| 模块 | 用例数 | P1 | P2 | P3 | P4 |
|------|--------|----|----|----|-----|
`;

  let totals = { total: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const [mod, s] of summary) {
    md += `| ${mod} | ${s.total} | ${s.P1} | ${s.P2} | ${s.P3} | ${s.P4} |\n`;
    totals.total += s.total;
    totals.P1 += s.P1;
    totals.P2 += s.P2;
    totals.P3 += s.P3;
    totals.P4 += s.P4;
  }
  md += `| **合计** | **${totals.total}** | **${totals.P1}** | **${totals.P2}** | **${totals.P3}** | **${totals.P4}** |\n\n---\n\n## 详细用例\n\n`;

  let tc = 1;
  let lastMod = '';
  for (const c of list) {
    if (c.module !== lastMod) {
      md += `### ${c.module}\n\n`;
      lastMod = c.module;
    }
    md += `#### TC-${String(tc).padStart(2, '0')}: ${c.name}\n\n`;
    md += `| 属性 | 内容 |\n|------|------|\n`;
    md += `| **所属模块** | ${c.module} |\n`;
    md += `| **相关需求** | ${c.requirement} |\n`;
    md += `| **优先级** | ${c.priority} |\n`;
    md += `| **用例类型** | ${c.type} |\n`;
    md += `| **前置条件** | ${c.preconditions.replace(/\n/g, '<br>')} |\n\n`;
    md += `**测试步骤与预期结果**:\n\n| 步骤 | 操作 | 预期结果 |\n|------|------|----------|\n`;
    md += stepsToTable(c.steps, c.expected) + '\n\n---\n\n';
    tc++;
  }
  return md;
}

fs.mkdirSync(outDir, { recursive: true });

const payload = {
  meta: {
    project: '寮ProjectWyp',
    source: 'dom-dev/doc/详细设计',
    generatedAt: new Date().toISOString(),
    batchId,
  },
  cases,
};

const jsonPath = path.join(outDir, `${baseName}.json`);
const mdPath = path.join(outDir, `${baseName}.md`);

fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
fs.writeFileSync(mdPath, buildMarkdown(cases), 'utf8');

console.log(`Wrote ${jsonPath} (${cases.length} cases)`);
console.log(`Wrote ${mdPath}`);
