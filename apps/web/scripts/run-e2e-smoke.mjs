/**
 * 轻量 E2E smoke（不依赖 @playwright/test runner，Windows 上更稳定）。
 * 用法：node scripts/run-e2e-smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.PW_BASE_URL || 'http://127.0.0.1:3000';
const API = process.env.PW_API_URL || 'http://127.0.0.1:3001/api/v1';
const ADMIN = { email: 'admin@example.com', password: 'Admin123!!' };

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function assertHealth() {
  const res = await fetch(`${API}/health`);
  if (!res.ok) throw new Error(`API health ${res.status}`);
}

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('メールアドレス').fill(ADMIN.email);
  await page.getByLabel('パスワード').fill(ADMIN.password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.getByText('おはようございます').waitFor({ timeout: 15_000 });
}

async function main() {
  console.log(`Smoke E2E → ${BASE}`);

  try {
    await assertHealth();
    record('API health', true);
  } catch (e) {
    record('API health', false, e.message);
    console.error('\n请先启动 API（3001）与 Web（3000），或执行 npm run db:setup');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await login(page);
    record('登录 → 仪表盘', true);

    await page.goto(`${BASE}/occupancy`);
    await page.getByText('入寮登録').waitFor({ timeout: 10_000 });
    await page.getByText('退寮登録').waitFor();
    await page.getByText('入退寮履歴').waitFor();
    record('入退寮 hub', true);

    await page.goto(`${BASE}/occupancy/create`);
    await page.getByText('登録方法を選択してください').waitFor({ timeout: 10_000 });
    await page.getByText('社員から選ぶ').waitFor();
    record('入居向导入口', true);

    await page.goto(`${BASE}/occupancy/history`);
    await page.getByRole('heading', { name: '入退寮履歴' }).waitFor({ timeout: 10_000 });
    record('履历页', true);
  } catch (e) {
    record('浏览器场景', false, e.message);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
