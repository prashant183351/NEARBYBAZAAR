import { test, expect } from '@playwright/test';

test('Form submission flow', async ({ page }) => {
  await page.goto('http://localhost:3000/forms/test');
  await page.fill('input[name="name"]', 'Alice');
  await page.selectOption('select[name="color"]', 'blue');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-message')).toHaveText(/Thank you/);
});
