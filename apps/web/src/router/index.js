import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import Layout from '@/layout/index.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true, title: 'ログイン' },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { public: true, title: 'アクセス拒否' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { public: true, title: 'ページが見つかりません' },
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: 'ホーム' },
      },
      {
        path: 'allocation-calendar',
        name: 'AllocationCalendar',
        component: () => import('@/views/allocation-calendar/index.vue'),
        meta: { title: '寮割', permission: 'occupancy:read' },
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('@/views/employees/index.vue'),
        meta: { title: '社員', permission: 'employees:read' },
      },
      {
        path: 'employees/:id',
        name: 'EmployeeDetail',
        component: () => import('@/views/employees/detail.vue'),
        meta: { title: '社員詳細', permission: 'employees:read' },
      },
      {
        path: 'dorms',
        name: 'Dorms',
        component: () => import('@/views/dorms/index.vue'),
        meta: { title: '寮', permission: 'dorms:read' },
      },
      {
        path: 'dorms/:id',
        name: 'DormDetail',
        component: () => import('@/views/dorms/detail.vue'),
        meta: { title: '寮詳細', permission: 'dorms:read' },
      },
      {
        path: 'occupancy',
        name: 'Occupancy',
        component: () => import('@/views/occupancy/index.vue'),
        meta: { title: '入退寮', permission: 'occupancy:read' },
      },
      {
        path: 'occupancy/history',
        name: 'OccupancyHistory',
        component: () => import('@/views/occupancy/history.vue'),
        meta: { title: '入退寮履歴', permission: 'occupancy:read' },
      },
      {
        path: 'occupancy/create',
        name: 'OccupancyCreate',
        component: () => import('@/views/occupancy/create.vue'),
        meta: { title: '入居登録', permission: 'occupancy:write' },
      },
      {
        path: 'occupancy/move-out',
        name: 'MoveOutWizard',
        component: () => import('@/views/occupancy/move-out-wizard.vue'),
        meta: { title: '退寮登録', permission: 'occupancy:write' },
      },
      {
        path: 'occupancy/:id/move-out',
        name: 'MoveOut',
        component: () => import('@/views/occupancy/move-out.vue'),
        meta: { title: '退寮', permission: 'occupancy:write' },
      },
      {
        path: 'occupancy/long-term',
        name: 'LongTerm',
        component: () => import('@/views/occupancy/long-term.vue'),
        meta: { title: '長期利用', permission: 'occupancy:read' },
      },
      {
        path: 'fees',
        name: 'Fees',
        component: () => import('@/views/fees/index.vue'),
        meta: { title: '寮費', permission: 'fees:read' },
      },
      {
        path: 'fees/calculate',
        name: 'FeeCalculate',
        component: () => import('@/views/fees/calculate.vue'),
        meta: { title: '寮費算定', permission: 'fees:write' },
      },
      {
        path: 'fees/rates',
        name: 'FeeRates',
        component: () => import('@/views/fees/rates.vue'),
        meta: { title: '料率マスタ', permission: 'fee-rates:write', role: 'SYSTEM_ADMIN' },
      },
      {
        path: 'vacancies',
        name: 'Vacancies',
        component: () => import('@/views/vacancies/index.vue'),
        meta: { title: '空き室', permission: 'vacancies:read' },
      },
      {
        path: 'import',
        name: 'Import',
        component: () => import('@/views/import/index.vue'),
        meta: { title: 'インポート', permission: 'import:execute' },
      },
      {
        path: 'equipment',
        name: 'Equipment',
        component: () => import('@/views/equipment/index.vue'),
        meta: { title: '備品', permission: 'equipment:read' },
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/audit/index.vue'),
        meta: { title: '操作ログ', permission: 'audit:read' },
      },
      {
        path: 'settings/departments',
        name: 'Departments',
        component: () => import('@/views/settings/departments/index.vue'),
        meta: { title: '所属マスタ', role: 'SYSTEM_ADMIN', permission: 'users:manage' },
      },
      {
        path: 'settings/users',
        name: 'Users',
        component: () => import('@/views/settings/users/index.vue'),
        meta: { title: 'ユーザー', role: 'SYSTEM_ADMIN', permission: 'users:manage' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();
  document.title = to.meta.title ? `${to.meta.title} — 社員寮管理` : '社員寮管理';

  if (to.meta.public) return next();

  if (!userStore.accessToken) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  if (!userStore.user) {
    try {
      await userStore.fetchMe();
    } catch {
      userStore.logout();
      return next('/login');
    }
  }

  const requiredRole = to.matched.map((r) => r.meta.role).find(Boolean);
  if (requiredRole && !userStore.hasRole(requiredRole)) {
    return next('/403');
  }

  const requiredPermission = to.matched.map((r) => r.meta.permission).find(Boolean);
  if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
    return next('/403');
  }

  next();
});

export default router;
