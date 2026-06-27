export const UserRole = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  DORM_MANAGER: 'DORM_MANAGER',
  VIEWER: 'VIEWER',
};

export const UserRoleLabels = {
  SYSTEM_ADMIN: 'システム管理者',
  DORM_MANAGER: '寮管理者',
  VIEWER: '閲覧のみ',
};

export const EmployeeType = {
  JAPAN: 'JAPAN',
  CHINA_ASSIGNMENT: 'CHINA_ASSIGNMENT',
};

export const EmployeeTypeLabels = {
  JAPAN: '日本社員',
  CHINA_ASSIGNMENT: '中国駐在',
};

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
};

export const GenderLabels = {
  MALE: '男性',
  FEMALE: '女性',
};

export const DormGenderType = {
  MALE_DORM: 'MALE_DORM',
  FEMALE_DORM: 'FEMALE_DORM',
};

export const DormGenderTypeLabels = {
  MALE_DORM: '男子寮',
  FEMALE_DORM: '女子寮',
};

export const RoomType = {
  WESTERN: 'WESTERN',
  JAPANESE_SMALL: 'JAPANESE_SMALL',
  JAPANESE_MEDIUM: 'JAPANESE_MEDIUM',
  STORAGE_ROOM: 'STORAGE_ROOM',
  OTHER: 'OTHER',
};

export const RoomTypeLabels = {
  WESTERN: '洋室',
  JAPANESE_SMALL: '和室（小）',
  JAPANESE_MEDIUM: '和室（中）',
  STORAGE_ROOM: '倉庫',
  OTHER: 'その他',
};

export const FeeStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
};

export const FeeStatusLabels = {
  DRAFT: '下書き',
  CONFIRMED: '確定済',
};

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  CONFIRM: 'CONFIRM',
  IMPORT: 'IMPORT',
};

export const AuditActionLabels = {
  CREATE: '作成',
  UPDATE: '更新',
  DELETE: '削除',
  CONFIRM: '確定',
  IMPORT: 'インポート',
};

export const VacancyStatus = {
  VACANT: 'VACANT',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
};

export const VacancyStatusLabels = {
  VACANT: '空室',
  OCCUPIED: '在室',
  RESERVED: '予定',
};

export const Location = {
  TOKYO: 'TOKYO',
  OSAKA: 'OSAKA',
  NAGOYA: 'NAGOYA',
  OTHER: 'OTHER',
};

export const LocationLabels = {
  TOKYO: '東京',
  OSAKA: '大阪',
  NAGOYA: '名古屋',
  OTHER: 'その他',
};

export const EntityTypeLabels = {
  occupancy_histories: '入退寮',
  employees: '社員',
  dorms: '寮',
  rooms: '部屋',
  dorm_fees: '寮費',
  fee_rates: '料率',
  users: 'ユーザー',
  departments: '所属',
  equipment_items: '備品',
  import_jobs: 'インポート',
};
