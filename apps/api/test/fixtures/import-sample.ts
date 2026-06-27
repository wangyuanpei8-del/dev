import * as XLSX from 'xlsx';

/** 最小合法导入样例（2 行数据 + 表头） */
export function buildSampleImportBuffer() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['社員番号', '氏名', '寮コード', '部屋コード'],
    ['E900', 'テスト 太郎', 'TEST-DORM', 'R99'],
    ['E901', 'テスト 次郎', 'TEST-DORM', 'R98'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

/** 故意缺少氏名的坏行 */
export function buildBadImportBuffer() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['社員番号', '氏名', '寮コード', '部屋コード'],
    ['E902', '', 'TEST-DORM', 'R97'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
