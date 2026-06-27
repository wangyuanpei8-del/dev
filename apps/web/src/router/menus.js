export const menuGroups = [
  {
    label: 'ホーム',
    items: [{ path: '/', title: 'ホーム', icon: 'Odometer' }],
  },
  {
    label: '運営',
    items: [
      { path: '/allocation-calendar', title: '寮割', icon: 'Calendar', permission: 'occupancy:read' },
      { path: '/occupancy', title: '入退寮', icon: 'House', permission: 'occupancy:read' },
      { path: '/fees', title: '寮費', icon: 'Money', permission: 'fees:read' },
      { path: '/vacancies', title: '空き室', icon: 'Key', permission: 'vacancies:read' },
    ],
  },
  {
    label: 'マスタ',
    items: [
      { path: '/employees', title: '社員', icon: 'User', permission: 'employees:read' },
      { path: '/dorms', title: '寮・部屋', icon: 'OfficeBuilding', permission: 'dorms:read' },
    ],
  },
  {
    label: 'その他',
    items: [
      { path: '/import', title: 'インポート', icon: 'Upload', permission: 'import:execute' },
      { path: '/equipment', title: '備品', icon: 'Box', permission: 'equipment:read' },
      { path: '/audit', title: '操作ログ', icon: 'Document', permission: 'audit:read' },
    ],
  },
  {
    label: '設定',
    items: [
      { path: '/settings/departments', title: '所属マスタ', icon: 'OfficeBuilding', role: 'SYSTEM_ADMIN' },
      { path: '/settings/users', title: 'ユーザー', icon: 'Setting', role: 'SYSTEM_ADMIN' },
    ],
  },
];

/** @deprecated use menuGroups */
export const menus = menuGroups.flatMap((g) => g.items);
