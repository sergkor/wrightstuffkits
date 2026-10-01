import { expect, test } from '@playwright/test';

test('home → catalog search → product → cart drawer → persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /featured kits/i })).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(5);

  await page.goto('/products/');
  await page.getByTestId('search').fill('mylar');
  await expect(page.getByTestId('product-card')).toHaveCount(2);
  await expect(page).toHaveURL(/q=mylar/);

  await page.goto('/products/custom-propeller/');
  await expect(page.getByTestId('variant-select')).toBeVisible();
  await expect(page.getByTestId('price')).toHaveText('$12.99');
  await page.getByTestId('add-to-cart').click();

  const drawer = page.getByRole('dialog', { name: /your cart/i });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByTestId('subtotal')).toHaveText('$12.99');
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  await page.reload();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await page.getByTestId('cart-trigger').click();
  await expect(page.getByRole('dialog', { name: /your cart/i }).getByTestId('subtotal')).toHaveText('$12.99');
  await expect(page.getByRole('dialog', { name: /your cart/i }).getByTestId('paypal-buttons')).toBeVisible();
  await page.goto('/checkout/');
  await expect(page.getByTestId('subtotal')).toHaveText('$12.99');
  await expect(page.getByTestId('paypal-buttons')).toBeVisible();
});
