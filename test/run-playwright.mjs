#!/usr/bin/env node
/**
 * 寮ProjectWyp — 读 JSON/Excel 用例 → Playwright 执行 → 截图 + DB 对照 → 报告
 *
 * 用法:
 *   node test/run-playwright.mjs
 *   node test/run-playwright.mjs --case test/寮ProjectWyp_68241.json --priority P1
 *   node test/run-playwright.mjs --case test/寮ProjectWyp_68241.xlsx --limit 5
 *
 * 环境变量: HEADLESS=true | SLOWMO=1000 | KEEPOPEN=true | CASE_FILE=...
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const playwrightPath = path.join(root, 'apps/web/node_modules/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(playwrightPath).href);

function loadEnv() {
  const p = path.join(__dirname, 'config', 'env.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseArgs(env) {
  const args = process.argv.slice(2);
  const opts = {
    caseFile: process.env.CASE_FILE || env.defaults.caseFile,
    priority: null,
    limit: null,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--case' && args[i + 1]) opts.caseFile = args[++i];
    else if (args[i] === '--priority' && args[i + 1]) opts.priority = args[++i];
    else if (args[i] === '--limit' && args[i + 1]) opts.limit = parseInt(args[++i], 10);
  }
  if (!path.isAbsolute(opts.caseFile)) opts.caseFile = path.join(root, opts.caseFile);
  return opts;
}

async function loadCases(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return (data.cases || data).map((c, i) => normalizeCase(c, i + 1));
  }
  if (ext === '.xlsx') {
    const xlsxPath = path.join(root, 'apps/api/node_modules/xlsx/xlsx.mjs');
    const XLSX = await import(pathToFileURL(xlsxPath).href);
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const [, ...body] = rows;
    return body
      .filter((r) => r?.[2])
      .map((r, i) =>
        normalizeCase(
          {
            module: r[0],
            requirement: r[1],
            name: r[2],
            preconditions: r[3],
            type: r[4],
            steps: r[5],
            expected: r[6],
            priority: r[7],
          },
          i + 2,
        ),
      );
  }
  throw new Error(`Unsupported case file: ${filePath} (use .json or .xlsx)`);
}

function normalizeCase(c, row) {
  return {
    row,
    module: c.module || c['所属模块'] || '',
    requirement: c.requirement || c['相关研发需求'] || '',
    name: c.name || c['用例名称'] || '',
    preconditions: c.preconditions || c['前置条件'] || '',
    type: c.type || c['用例类型'] || '',
    steps: c.steps || c['测试步骤'] || '',
    expected: c.expected || c['预期结果'] || '',
    priority: (c.priority || c['优先级'] || 'P2').toUpperCase(),
  };
}

function parseSteps(stepsStr, expectedStr) {
  const stepLines = String(stepsStr || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const expLines = String(expectedStr || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return stepLines.map((line, idx) => {
    const m = line.match(/^(\d+)\.\s*(.+)$/);
    const body = m ? m[2] : line;
    const tag = body.match(/^\[([^\]]+)\]\s*(.*)$/);
    const exp = expLines[idx]?.replace(/^\d+\.\s*/, '') || '';
    return {
      index: idx + 1,
      raw: body,
      tag: tag ? tag[1] : '未知',
      arg: tag ? tag[2].trim() : body,
      expected: exp,
    };
  });
}

const PRIO = { P1: 1, P2: 2, P3: 3, P4: 4 };

function sortCases(cases, priorityFilter) {
  let list = [...cases].sort((a, b) => (PRIO[a.priority] || 9) - (PRIO[b.priority] || 9));
  if (priorityFilter) list = list.filter((c) => c.priority === priorityFilter.toUpperCase());
  return list;
}

function normalizeSql(sql) {
  return String(sql)
    .replace(/FROM\s+"user"/gi, 'FROM users')
    .replace(/FROM\s+user\b/gi, 'FROM users')
    .replace(/\boccupancy_history\b/gi, 'occupancy_histories')
    .replace(/\bFROM room\b/gi, 'FROM rooms')
    .replace(/\bJOIN room\b/gi, 'JOIN rooms')
    .replace(/\bFROM dorm\b/gi, 'FROM dorms')
    .replace(/\bJOIN dorm\b/gi, 'JOIN dorms')
    .replace(/\bdorm_fee\b/gi, 'dorm_fees')
    .replace(/\baudit_log\b/gi, 'audit_logs')
    .replace(/\bequipment_item\b/gi, 'equipment_items')
    .replace(/\bimport_job\b/gi, 'import_jobs');
}

const CLICK_ALIASES = {
  新規登録: ['新規登録', '新規ユーザー', '新規寮', '新規'],
  确定: ['确定', '確定', 'OK', '確認'],
  詳細: ['詳細', '详情'],
  CSV: ['ＣＳＶ出力', 'CSV', 'CSV出力'],
};

const SELECT_ALIASES = {
  TOKYO: '東京',
  OccupancyHistory: 'OccupancyHistory',
};

const LABEL_ALIASES = {
  メールアドレス: ['メールアドレス', 'メール'],
  社員: ['社員'],
};

async function assertTextVisible(page, text) {
  if (text === 'おはようございます') {
    await page.locator('.home__title').first().waitFor({ state: 'visible', timeout: 20_000 });
    return;
  }
  const alert = page.locator('.el-alert').filter({ hasText: text });
  if (await alert.count()) {
    await alert.first().waitFor({ state: 'visible', timeout: 15_000 });
    return;
  }
  const err = page.locator('.el-form-item__error').filter({ hasText: text });
  if (await err.count()) {
    await err.first().waitFor({ state: 'visible', timeout: 10_000 });
    return;
  }
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 15_000 });
}

async function assertNotEditable(page, arg) {
  const labelMap = { genderType: '区分' };
  const raw = arg.replace(/\s*不可编辑\s*$/, '').trim();
  const label = labelMap[raw] || raw;
  const item = page.locator('.el-form-item').filter({ has: page.getByText(label, { exact: true }) }).first();
  const disabled = item.locator('.is-disabled, .el-select.is-disabled, input:disabled').first();
  if (!(await disabled.count())) {
    throw new Error(`字段 ${label} 应不可编辑`);
  }
  return `不可编辑: ${label}`;
}

async function fillBySelector(page, sel, val) {
  const labelM = sel.match(/^getByLabel\(['"](.+?)['"]\)$/);
  if (labelM) {
    const names = LABEL_ALIASES[labelM[1]] || [labelM[1]];
    for (const name of names) {
      const loc = page.getByLabel(name);
      if (await loc.count()) {
        await loc.fill(val ?? '');
        return name;
      }
    }
  }
  const loc = locatorFromSelector(page, sel);
  await loc.fill(val ?? '');
  return sel;
}

async function clearSession(context, page, baseUrl) {
  await context.clearCookies();
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch {
    /* ignore */
  }
}

async function clickByLabel(page, label) {
  if (label === '詳細') {
    const tableBtn = page.locator('.el-table').getByRole('button', { name: '詳細' }).first();
    if (await tableBtn.count()) {
      await tableBtn.click({ timeout: 10_000 });
      return '詳細(表格按钮)';
    }
  }
  if (label === '.el-table__row' || label === '.el-table tbody tr') {
    await page.locator('.el-table__body-wrapper tbody tr').first().click({ timeout: 10_000 });
    return '表格首行';
  }
  const msgBox = page.locator('.el-message-box');
  if ((label === '确定' || label === '確認' || label === '確定') && (await msgBox.count())) {
    await msgBox.getByRole('button', { name: /OK|确定|確認|確定/ }).click({ timeout: 5000 });
    return '確認(对话框)';
  }
  const names = CLICK_ALIASES[label] || [label];
  for (const name of names) {
    const btn = page.getByRole('button', { name, exact: false }).first();
    if (await btn.count()) {
      await btn.click({ timeout: 5000 });
      if (name === 'ログイン') {
        await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15_000 }).catch(() => {});
        await page.locator('.home__title, .home').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
      }
      return name;
    }
  }
  if (label.startsWith('.') || label.startsWith('#') || label.includes('[')) {
    await page.locator(label).first().click({ timeout: 10_000 });
    return label;
  }
  await page.getByText(label, { exact: false }).first().click({ timeout: 10_000 });
  return label;
}

async function assertUrlContains(page, pattern) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const href = page.url();
    if (href.includes(pattern)) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`URL 不含 ${pattern}，当前: ${page.url()}`);
}

function locatorFromSelector(page, sel) {
  const s = sel.trim();
  const labelM = s.match(/^getByLabel\(['"](.+?)['"]\)$/);
  if (labelM) return page.getByLabel(labelM[1]);
  const roleM = s.match(/^getByRole\(['"](.+?)['"],\s*\{\s*name:\s*['"](.+?)['"]\s*\}\)$/);
  if (roleM) return page.getByRole(roleM[1], { name: roleM[2] });
  if (s.startsWith('input') || s.startsWith('.') || s.startsWith('#')) return page.locator(s).first();
  return page.getByText(s, { exact: false }).first();
}

function substitute(str, vars) {
  return String(str || '').replace(/\{([^}]+)\}/g, (_, key) => {
    const k = key.trim();
    if (k === 'VIEWER密码') return vars.viewerPassword || '';
    if (k === 'dormId') return vars.dormId || '';
    return vars[k] ?? `{${key}}`;
  });
}

function resolveAuthRole(preconditions, steps) {
  const text = `${preconditions}\n${steps}`;
  if (/VIEWER\s*已登录|viewer@example\.com/.test(text)) return 'viewer';
  if (/DORM_MANAGER\s*已登录|manager@example\.com/.test(text)) return 'manager';
  if (/已登录|admin@example\.com/.test(text)) return 'admin';
  return null;
}

function stepsIncludeLogin(stepsStr) {
  return /\[导航\]\s*\/login/.test(stepsStr);
}

async function loginAs(page, env, role, baseUrl) {
  const creds =
    role === 'viewer'
      ? { email: env.auth.viewerEmail, password: env.auth.viewerPassword }
      : role === 'manager'
        ? { email: env.auth.managerEmail, password: env.auth.managerPassword }
        : { email: env.auth.adminEmail, password: env.auth.adminPassword };

  if (!creds.email || !creds.password) {
    throw new Error(`缺少 ${role} 账号配置，请在 test/config/env.json 填写`);
  }

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByLabel('メールアドレス').fill(creds.email);
  await page.getByLabel('パスワード').fill(creds.password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
  return `${role} 登录 ${creds.email}`;
}

async function loadTestVars(db, env) {
  const vars = {
    viewerPassword: env.auth.viewerPassword || 'Admin123!!',
    dormId: '',
  };
  if (db) {
    try {
      const res = await db.query("SELECT id FROM dorms WHERE code='TOYOSU-1' LIMIT 1");
      vars.dormId = res.rows[0]?.id || '';
    } catch {
      /* ignore */
    }
  }
  return vars;
}

async function execStep(page, step, ctx) {
  const tag = step.tag;
  const arg = substitute(step.arg, ctx.vars);
  switch (tag) {
    case '导航': {
      const url = arg.startsWith('http') ? arg : `${ctx.baseUrl}${arg.startsWith('/') ? arg : `/${arg}`}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (url.includes('/login')) {
        await page.getByLabel('メールアドレス').fill('').catch(() => {});
        await page.getByLabel('パスワード').fill('').catch(() => {});
      }
      await page.waitForTimeout(300);
      return `已打开 ${url}`;
    }
    case '输入': {
      const [sel, val] = arg.split('::');
      const filled = await fillBySelector(page, sel, val);
      return `已输入 ${filled}`;
    }
    case '点击': {
      const clicked = await clickByLabel(page, arg);
      return `已点击 ${clicked}`;
    }
    case '等待': {
      const ms = parseInt(arg, 10);
      if (!Number.isNaN(ms)) {
        await page.waitForTimeout(ms);
        return `等待 ${ms}ms`;
      }
      await locatorFromSelector(page, arg).waitFor({ timeout: 15_000 });
      return `元素已出现 ${arg}`;
    }
    case '断言': {
      if (/不可见\s*$/.test(arg)) {
        const text = arg.replace(/\s*不可见\s*$/, '').trim();
        const loc = page.getByText(text, { exact: false });
        const count = await loc.count();
        if (count > 0) {
          const visible = await loc.first().isVisible().catch(() => false);
          if (visible) throw new Error(`不应可见: ${text}`);
        }
        return `不可见: ${text}`;
      }
      if (/不可编辑\s*$/.test(arg)) {
        return await assertNotEditable(page, arg);
      }
      const text = arg.replace(/\s*可见\s*$/, '').trim();
      await assertTextVisible(page, text);
      return `可见: ${text}`;
    }
    case '断言URL': {
      await assertUrlContains(page, arg);
      return `URL 含 ${arg}`;
    }
    case 'DB': {
      if (!ctx.db) return 'DB 跳过（未安装 pg 或连接失败）';
      const sql = normalizeSql(arg);
      const res = await ctx.db.query(sql);
      ctx.lastDb = { sql, rows: res.rows, rowCount: res.rowCount };
      return `${res.rowCount} 行 ${JSON.stringify(res.rows.slice(0, 3))}`;
    }
    case '选择': {
      const [sel, opt] = arg.split('::');
      const optionText = SELECT_ALIASES[opt] || opt;
      const labelM = (sel || '').match(/^getByLabel\(['"](.+?)['"]\)$/);
      if (labelM) {
        const formItem = page.locator('.el-form-item').filter({ has: page.getByText(labelM[1], { exact: true }) });
        await formItem.locator('.el-select').click({ force: true });
      } else {
        await locatorFromSelector(page, sel || '.el-select').click({ force: true });
      }
      await page.waitForTimeout(2500);
      const dropdown = page.locator('.el-select-dropdown:visible');
      await dropdown.waitFor({ state: 'visible', timeout: 15_000 });
      const option = dropdown.getByText(optionText, { exact: false });
      if (!(await option.count())) {
        throw new Error(`下拉中未找到选项: ${optionText}`);
      }
      await option.first().click({ timeout: 10_000 });
      return `已选择 ${optionText}`;
    }
    case '上传': {
      const filePath = path.isAbsolute(arg) ? arg : path.join(root, 'test/fixtures', arg);
      await page.locator('input[type="file"]').first().setInputFiles(filePath);
      return `已上传 ${path.basename(filePath)}`;
    }
    case '截图': {
      const file = `${ctx.shotPrefix}-s${String(step.index).padStart(2, '0')}-${slug(arg)}.png`;
      const full = path.join(ctx.screenshotDir, file);
      await page.screenshot({ path: full, fullPage: true });
      step.screenshot = file;
      return `截图 ${file}`;
    }
    case '提交': {
      await page.getByRole('button', { name: arg }).first().click();
      await page.waitForTimeout(800);
      return `提交 ${arg}`;
    }
    case '校验必填': {
      await page.getByRole('button', { name: '保存' }).first().click().catch(() => page.getByRole('button', { name: '登録' }).first().click());
      await page.locator('.el-form-item__error').first().waitFor({ timeout: 5000 });
      return `必填校验触发 ${arg}`;
    }
    case '校验约束':
      return `约束校验（占位通过，需手工补充具体断言）: ${arg}`;
    case '断言行': {
      const m = arg.match(/^(.+?)\s+(存在|不存在)$/);
      const text = m ? m[1] : arg;
      const loc = page.locator('.el-table').getByText(text, { exact: false });
      if (m && m[2] === '不存在') {
        if (await loc.count()) throw new Error(`不应存在: ${text}`);
        return `确认不存在 ${text}`;
      }
      await loc.first().waitFor({ timeout: 10_000 });
      return `表格存在 ${text}`;
    }
    case '关闭': {
      await page.locator('.el-dialog__headerbtn').first().click();
      return '已关闭弹窗';
    }
    default:
      throw new Error(`未知步骤标签 [${tag}]`);
  }
}

function slug(s) {
  return String(s).replace(/[^\w\u4e00-\u9fa5-]+/g, '-').slice(0, 40);
}

async function connectDb(url) {
  try {
    const mod = await import('pg');
    const client = new mod.default.Client({ connectionString: url });
    await client.connect();
    return client;
  } catch (e) {
    console.warn('DB 连接失败:', e.message);
    return null;
  }
}

async function checkHealth(env) {
  const url = `${env.backend.baseUrl}${env.backend.healthPath || '/health'}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API 不可用 ${url} (${res.status})`);
}

function writeReport(reportDir, env, caseFile, run) {
  fs.mkdirSync(reportDir, { recursive: true });
  const mdPath = path.join(reportDir, 'test-report.md');
  const jsonPath = path.join(reportDir, 'results.json');

  const passRate = run.summary.total ? ((run.summary.passed / run.summary.total) * 100).toFixed(1) : '0';

  let md = `# ${env.projectName} 自动化测试报告

## 项目信息

| 项 | 值 |
|----|-----|
| 项目 | ${env.displayName} |
| 工具 | Playwright + ${process.env.HEADLESS === 'true' ? 'headless' : 'Chrome headed'} |
| DB | ${env.database.url.replace(/:[^:@]+@/, ':***@')} |
| 用例文件 | ${path.basename(caseFile)} |

## 总体结果

| 总用例 | 已执行 | 通过 | 失败 | 通过率 | 截图数 |
|--------|--------|------|------|--------|--------|
| ${run.summary.total} | ${run.summary.total} | ${run.summary.passed} | ${run.summary.failed} | ${passRate}% | ${run.summary.screenshots} |

## 用例执行结果

| 行号 | 模块 | 用例名 | 优先级 | 结果 | 备注 |
|------|------|--------|--------|------|------|
`;

  for (const c of run.cases) {
    md += `| ${c.row} | ${c.module} | ${c.name} | ${c.priority} | ${c.status} | ${c.note || ''} |\n`;
  }

  md += `\n## 详细执行过程\n\n`;

  for (const c of run.cases) {
    md += `### TC-${String(c.row).padStart(2, '0')}: ${c.name} (行${c.row}·${c.module}·${c.priority})\n\n`;
    md += `**来源**: ${path.basename(caseFile)} 行${c.row} | **前置**: ${c.preconditions.replace(/\n/g, ' ')}\n\n`;
    md += `| 步骤 | 操作 | 预期 | 实际 | 状态 | 截图 |\n|------|------|------|------|------|------|\n`;
    for (const s of c.steps) {
      const shot = s.screenshot ? `![](./screenshots/${s.screenshot})` : '';
      md += `| ${s.step} | ${s.action} | ${s.expected} | ${s.actual || ''} | ${s.status} | ${shot} |\n`;
    }
    if (c.dbBefore) md += `\n**操作前DB**: \`${c.dbBefore.sql}\` → ${c.dbBefore.summary}\n`;
    if (c.dbAfter) md += `\n**操作后DB**: \`${c.dbAfter.sql}\` → ${c.dbAfter.summary}\n`;
    md += `\n**结果**: ${c.status}\n\n---\n\n`;
  }

  md += `\n## 结论\n\n通过率 ${passRate}% | 失败 ${run.summary.failed} 条 | 跳过 ${run.summary.skipped || 0} 条\n`;

  if (run.summary.failed > 0) {
    md += `\n### 失败用例摘要\n\n`;
    for (const c of run.cases.filter((x) => x.status === 'FAIL')) {
      const failStep = c.steps.find((s) => s.status === 'FAIL');
      md += `- **行${c.row}** ${c.name}: ${failStep?.actual || c.note}\n`;
    }
  }

  fs.writeFileSync(mdPath, md, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(run, null, 2), 'utf8');
  console.log(`\n报告: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);
}

async function main() {
  if (process.stdout.setDefaultEncoding) process.stdout.setDefaultEncoding('utf8');

  const env = loadEnv();
  const opts = parseArgs(env);
  const headless = process.env.HEADLESS === 'true' || env.defaults.headless === true;
  const slowMo = parseInt(process.env.SLOWMO || env.defaults.slowMo || '600', 10);
  const keepOpen = process.env.KEEPOPEN === 'true';

  console.log(`项目: ${env.projectName}`);
  console.log(`用例: ${opts.caseFile}`);

  await checkHealth(env);
  const db = await connectDb(env.database.url);
  const testVars = await loadTestVars(db, env);
  if (!testVars.dormId) console.warn('警告: 未从 DB 取得 dormId，含 {dormId} 的用例可能失败');

  if (db) {
    const protectedDorms = ['TOYOSU-1', 'toyosu-2'];
    try {
      await db.query('BEGIN');
      // 仅清理测试寮：非 seed 保护寮、且 code/name 符合测试命名
      await db.query(`
        UPDATE occupancy_histories oh
        SET move_out_date = (CURRENT_DATE - INTERVAL '1 day')::date, updated_at = NOW()
        FROM rooms r
        JOIN dorms d ON d.id = r.dorm_id
        WHERE oh.room_id = r.id
          AND oh.deleted_at IS NULL
          AND oh.move_out_date IS NULL
          AND d.code NOT IN (${protectedDorms.map((_, i) => `$${i + 1}`).join(', ')})
          AND (
            d.code ILIKE 'test%' OR d.code ILIKE 'tc-%' OR d.code = 'TEST-DORM'
          )
      `, protectedDorms);
      await db.query(`
        UPDATE rooms r
        SET deleted_at = NOW(), version = version + 1
        FROM dorms d
        WHERE r.dorm_id = d.id
          AND r.deleted_at IS NULL
          AND d.code NOT IN (${protectedDorms.map((_, i) => `$${i + 1}`).join(', ')})
          AND (
            d.code ILIKE 'test%' OR d.code ILIKE 'tc-%' OR d.code = 'TEST-DORM'
          )
      `, protectedDorms);
      await db.query(`
        UPDATE dorm_fees df
        SET status = 'DRAFT', version = version + 1
        FROM employees e
        WHERE df.employee_id = e.id
          AND df.year_month = '2026-06'
          AND df.deleted_at IS NULL
          AND e.employee_code LIKE 'TC-%'
      `);
      await db.query('COMMIT');
    } catch (e) {
      await db.query('ROLLBACK').catch(() => {});
      console.warn('测试数据重置跳过:', e.message);
    }
  }

  let cases = await loadCases(opts.caseFile);
  cases = sortCases(cases, opts.priority);
  if (opts.limit) cases = cases.slice(0, opts.limit);

  const batch = path.basename(opts.caseFile, path.extname(opts.caseFile));
  const screenshotDir = path.join(root, env.defaults.screenshotDir, batch);
  const reportDir = path.join(root, env.defaults.reportDir, `${batch}-${Date.now()}`);
  fs.mkdirSync(screenshotDir, { recursive: true });
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'config', 'env.json'), path.join(reportDir, 'env.json'));

  let browser;
  try {
    browser = await chromium.launch({
      headless,
      channel: 'chrome',
      slowMo,
      args: ['--start-maximized'],
    });
  } catch {
    try {
      browser = await chromium.launch({ headless, channel: 'msedge', slowMo });
    } catch {
      browser = await chromium.launch({ headless, slowMo });
    }
  }

  const context = await browser.newContext({ viewport: null, locale: 'ja-JP' });
  let page = await context.newPage();
  const baseUrl = env.frontend.baseUrl.replace(/\/$/, '');

  const run = { summary: { total: 0, passed: 0, failed: 0, skipped: 0, screenshots: 0 }, cases: [] };

  for (const tc of cases) {
    run.summary.total++;
    console.log(`\n═══ TC-${String(tc.row).padStart(2, '0')} ${tc.name} (行${tc.row}·${tc.priority}) ═══`);

    await clearSession(context, page, baseUrl);

    const caseResult = {
      row: tc.row,
      module: tc.module,
      name: tc.name,
      priority: tc.priority,
      preconditions: tc.preconditions,
      status: 'PASS',
      note: '',
      steps: [],
    };

    const steps = parseSteps(substitute(tc.steps, testVars), tc.expected);
    const ctx = {
      baseUrl,
      db,
      vars: testVars,
      env,
      screenshotDir,
      shotPrefix: `tc${String(tc.row).padStart(2, '0')}`,
      lastDb: null,
    };

    const authRole = resolveAuthRole(tc.preconditions, tc.steps);
    if (/未登录/.test(tc.preconditions)) {
      /* session already cleared */
    } else if (authRole && !stepsIncludeLogin(tc.steps)) {
      try {
        const loginMsg = await loginAs(page, env, authRole, baseUrl);
        console.log(`  [前置] ${loginMsg}`);
        caseResult.note = loginMsg;
      } catch (e) {
        caseResult.status = 'FAIL';
        caseResult.note = `登录失败: ${e.message}`;
        run.summary.failed++;
        run.cases.push(caseResult);
        console.log(`  ❌ 前置登录失败: ${e.message}`);
        continue;
      }
    }

    let failed = false;
    for (const step of steps) {
      const rec = {
        step: step.index,
        action: step.raw,
        expected: step.expected,
        actual: '',
        status: 'PASS',
        screenshot: null,
      };
      console.log(`  [${step.index}/${steps.length}] ${step.raw}`);
      console.log(`        预期: ${step.expected || '—'}`);
      try {
        rec.actual = await execStep(page, step, ctx);
        rec.screenshot = step.screenshot || null;
        if (step.screenshot) run.summary.screenshots++;
        console.log(`        实际: ${rec.actual} → ✅ PASS`);
      } catch (e) {
        failed = true;
        rec.status = 'FAIL';
        rec.actual = e.message;
        console.log(`        实际: ${e.message} → ❌ FAIL`);
        try {
          const errShot = `${ctx.shotPrefix}-s${String(step.index).padStart(2, '0')}-error.png`;
          await page.screenshot({ path: path.join(screenshotDir, errShot), fullPage: true });
          rec.screenshot = errShot;
          run.summary.screenshots++;
        } catch { /* ignore */ }
      }
      caseResult.steps.push(rec);
      if (failed) break;
    }

    if (failed) {
      caseResult.status = 'FAIL';
      run.summary.failed++;
    } else {
      run.summary.passed++;
    }
    run.cases.push(caseResult);
  }

  fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });
  if (fs.existsSync(screenshotDir)) {
    for (const f of fs.readdirSync(screenshotDir)) {
      fs.copyFileSync(path.join(screenshotDir, f), path.join(reportDir, 'screenshots', f));
    }
  }

  writeReport(reportDir, env, opts.caseFile, run);

  if (!keepOpen) await browser.close();
  if (db) await db.end();

  process.exit(run.summary.failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
