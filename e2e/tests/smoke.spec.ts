import { expect, test, type Page } from '@playwright/test';

/** Development-only demo credentials (see README). */
const PASSWORD = 'DemoPassword!2026';
const ADMIN = 'admin@cedargrove.example';
const SUPPLIER = 'bids@peakhvac.example';

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('redirects anonymous users to the login page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('rejects invalid credentials', async ({ page }) => {
  await signIn(page, ADMIN, 'wrong-password-123');
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
});

test('buyer admin signs in, sees departments with budgets, and signs out', async ({ page }) => {
  await signIn(page, ADMIN);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome, Avery Collins');
  await page.getByRole('navigation').getByRole('link', { name: 'Departments & budgets' }).click();
  await expect(page.getByRole('heading', { name: 'Departments & budgets' })).toBeVisible();
  const table = page.getByRole('table');
  await expect(table.getByRole('row', { name: /Engineering/ })).toContainText('USD 180,000.00');
  await expect(table.getByRole('row', { name: /Operations/ })).toBeVisible();
  const form = page.getByRole('form', { name: 'Add department' });
  const code = `QA${Date.now() % 100000}`;
  await form.getByLabel('Code').fill(code);
  await form.getByLabel('Name').fill(`Smoke test ${code}`);
  await form.getByLabel('Budget (USD)').fill('1,250.50');
  await form.getByRole('button', { name: 'Add department' }).click();
  await expect(page.getByRole('status')).toHaveText(`Department ${code} created.`);
  await expect(table.getByRole('row', { name: new RegExp(code) })).toContainText('USD 1,250.50');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('pending screens show their backlog ticket', async ({ page }) => {
  await signIn(page, ADMIN);
  await page.getByRole('navigation').getByRole('link', { name: /^RFQs/ }).click();
  await expect(page.getByRole('heading', { name: 'RFQs' })).toBeVisible();
  await expect(page.getByText('BF-032')).toBeVisible();
});

test('supplier users only see the portal navigation', async ({ page }) => {
  await signIn(page, SUPPLIER);
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: /My invitations/ })).toBeVisible();
  await expect(nav.getByRole('link', { name: /Departments/ })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: /RFQs/ })).toHaveCount(0);
});

// TODO(BF-054, BF-055, BF-056): PRD §9 acceptance scenarios B-01..B-18.
