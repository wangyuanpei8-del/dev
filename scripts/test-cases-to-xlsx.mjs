#!/usr/bin/env node
/**
 * 将测试用例 JSON 导出为 Excel（8 列固定表头）。
 * 用法: node scripts/test-cases-to-xlsx.mjs docs/test-cases/寮ProjectWyp_12345.json
 * 输出: 同目录同名 .xlsx
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const xlsxPath = path.join(root, 'apps/api/node_modules/xlsx/xlsx.mjs');
const XLSX = await import(pathToFileURL(xlsxPath).href);

const HEADERS = [
  '所属模块',
  '相关研发需求',
  '用例名称',
  '前置条件',
  '用例类型',
  '测试步骤',
  '预期结果',
  '优先级',
];

const COL_WIDTHS = [18, 25, 40, 35, 14, 60, 50, 8];

function usage() {
  console.error('Usage: node scripts/test-cases-to-xlsx.mjs <path/to/cases.json>');
  process.exit(1);
}

const input = process.argv[2];
if (!input) usage();

const jsonPath = path.resolve(process.cwd(), input);
if (!fs.existsSync(jsonPath)) {
  console.error(`File not found: ${jsonPath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const cases = payload.cases || payload;
if (!Array.isArray(cases) || !cases.length) {
  console.error('JSON must contain a non-empty "cases" array');
  process.exit(1);
}

const rows = cases.map((c) => [
  c.module ?? c['所属模块'] ?? '',
  c.requirement ?? c['相关研发需求'] ?? '',
  c.name ?? c['用例名称'] ?? '',
  c.preconditions ?? c['前置条件'] ?? '',
  c.type ?? c['用例类型'] ?? '功能测试',
  c.steps ?? c['测试步骤'] ?? '',
  c.expected ?? c['预期结果'] ?? '',
  c.priority ?? c['优先级'] ?? 'P2',
]);

const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
ws['!cols'] = COL_WIDTHS.map((w) => ({ wch: w }));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '测试用例');

const outPath = jsonPath.replace(/\.json$/i, '.xlsx');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${cases.length} cases)`);
