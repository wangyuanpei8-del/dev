/** 未登记退寮日 = 管理上的「在室中」（与后端 openEndedWhere 一致） */
export function isOpenOccupancy(record) {
  return !(record?.moveOutDate || record?.move_out_date);
}

export function occupancyStatusKey(record) {
  return isOpenOccupancy(record) ? 'ACTIVE' : 'MOVED_OUT';
}
