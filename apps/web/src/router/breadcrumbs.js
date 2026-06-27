const PARENTS = {
  '/allocation-calendar': [{ title: 'ホーム', path: '/' }],
  '/employees': [{ title: 'ホーム', path: '/' }],
  '/employees/:id': [{ title: 'ホーム', path: '/' }, { title: '社員', path: '/employees' }],
  '/dorms': [{ title: 'ホーム', path: '/' }],
  '/occupancy': [{ title: 'ホーム', path: '/' }],
  '/occupancy/history': [{ title: 'ホーム', path: '/' }, { title: '入退寮', path: '/occupancy' }],
  '/occupancy/create': [{ title: 'ホーム', path: '/' }, { title: '入退寮', path: '/occupancy' }],
  '/occupancy/move-out': [{ title: 'ホーム', path: '/' }, { title: '入退寮', path: '/occupancy' }],
  '/occupancy/long-term': [{ title: 'ホーム', path: '/' }, { title: '入退寮', path: '/occupancy' }],
  '/fees': [{ title: 'ホーム', path: '/' }],
  '/vacancies': [{ title: 'ホーム', path: '/' }],
};

export function buildBreadcrumbs(route) {
  if (route.meta?.breadcrumb === false || route.name === 'Dashboard') return [];

  const path = route.path.replace(/\/[0-9a-f-]{36}/gi, '/:id');
  const parents = PARENTS[path] || PARENTS[route.matched.at(-1)?.path] || [{ title: 'ホーム', path: '/' }];

  const crumbs = [...parents];
  if (route.meta?.title) {
    crumbs.push({ title: route.meta.title, path: route.fullPath });
  }
  return crumbs;
}
