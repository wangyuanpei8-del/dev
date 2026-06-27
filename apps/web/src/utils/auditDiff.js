const FIELD_LABELS = {
  fullName: '氏名',
  full_name: '氏名',
  employeeCode: '社員コード',
  employee_code: '社員コード',
  employeeType: '区分',
  employee_type: '区分',
  gender: '性別',
  departmentId: '所属',
  department_id: '所属',
  firstDormUseDate: '初回入寮日',
  first_dorm_use_date: '初回入寮日',
  code: 'コード',
  name: '名称',
  address: '住所',
  layoutType: '間取り',
  layout_type: '間取り',
  genderType: '寮区分',
  gender_type: '寮区分',
  location: '地域',
  responsibleEmployeeId: '責任者',
  responsible_employee_id: '責任者',
  areaSqm: '面積(㎡)',
  area_sqm: '面積(㎡)',
  roomType: '部屋種別',
  room_type: '部屋種別',
  moveInDate: '入寮日',
  move_in_date: '入寮日',
  moveOutDate: '退寮日',
  move_out_date: '退寮日',
  moveOutReason: '退寮理由',
  move_out_reason: '退寮理由',
  status: '状態',
  amountYen: '金額(円)',
  amount_yen: '金額(円)',
  yearMonth: '対象年月',
  year_month: '対象年月',
  email: 'メール',
  displayName: '表示名',
  display_name: '表示名',
  role: 'ロール',
  isActive: '有効',
  is_active: '有効',
  description: '説明',
  version: 'バージョン',
};

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function labelFor(key) {
  return FIELD_LABELS[key] || key;
}

function formatValue(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'はい' : 'いいえ';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function diffAuditRecords(before, after) {
  const b = isPlainObject(before) ? before : null;
  const a = isPlainObject(after) ? after : null;
  const keys = [...new Set([...Object.keys(b || {}), ...Object.keys(a || {})])].sort();
  const rows = [];

  for (const key of keys) {
    if (['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at', 'department'].includes(key)) {
      continue;
    }
    const bv = b?.[key];
    const av = a?.[key];
    const same = JSON.stringify(bv) === JSON.stringify(av);
    if (same) continue;
    rows.push({
      key,
      label: labelFor(key),
      before: formatValue(bv),
      after: formatValue(av),
    });
  }
  return rows;
}

export function auditSideSummary(data) {
  if (!data) return [];
  if (typeof data === 'string') {
    try {
      return auditSideSummary(JSON.parse(data));
    } catch {
      return [{ label: '内容', before: data, after: '' }];
    }
  }
  if (!isPlainObject(data)) return [{ label: '内容', before: formatValue(data), after: '' }];
  return Object.entries(data)
    .filter(([k]) => !['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(k))
    .map(([key, value]) => ({
      key,
      label: labelFor(key),
      before: formatValue(value),
      after: '',
    }));
}
