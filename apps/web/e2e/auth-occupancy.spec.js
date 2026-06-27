import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill('admin@example.com');
  await page.getByLabel('パスワード').fill('Admin123!!');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page.getByText('おはようございます')).toBeVisible({ timeout: 15_000 });
}

test.describe('登录', () => {
  test('正确账号密码进入仪表盘', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/(\?.*)?$/);
  });

  test('错误密码停留在登录页', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('admin@example.com');
    await page.getByLabel('パスワード').fill('wrong-password-xxx');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('入退寮 UX', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('入退寮 hub 三卡片', async ({ page }) => {
    await page.goto('/occupancy');
    await expect(page.getByText('入寮登録')).toBeVisible();
    await expect(page.getByText('退寮登録')).toBeVisible();
    await expect(page.getByText('入退寮履歴')).toBeVisible();
  });

  test('入居向导双路径入口', async ({ page }) => {
    await page.goto('/occupancy/create');
    await expect(page.getByText('登録方法を選択してください')).toBeVisible();
    await expect(page.getByRole('button', { name: '社員から選ぶ' })).toBeVisible();
    await expect(page.getByRole('button', { name: '寮から選ぶ' })).toBeVisible();
  });

  test('退寮向导双路径入口', async ({ page }) => {
    await page.goto('/occupancy/move-out');
    await expect(page.getByText('登録方法を選択してください')).toBeVisible();
    await expect(page.getByRole('button', { name: '社員から選ぶ' })).toBeVisible();
    await expect(page.getByRole('button', { name: '寮から選ぶ' })).toBeVisible();
  });

  test('履历页可打开', async ({ page }) => {
    await page.goto('/occupancy/history');
    await expect(page.getByRole('button', { name: 'ＣＳＶ出力' })).toBeVisible({ timeout: 10_000 });
  });
});
