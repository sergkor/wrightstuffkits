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

test('order confirmation renders from sessionStorage and shows custom-prop note', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    sessionStorage.setItem(
      'wsk-last-order',
      JSON.stringify({
        orderId: 'TEST-ORDER',
        captureId: 'TEST-CAP',
        status: 'COMPLETED',
        payerEmail: 'b@example.com',
        shippingName: 'Pat',
        shippingLabel: 'USPS Ground Advantage',
        totalCents: 1949,
        lines: [{ sku: 'CPROP-2', name: 'Custom Laser-cut Propeller – 2 sets', qty: 1, unitCents: 1299 }],
        notes: ['Email your propeller design and your PayPal order ID to orders@wrightstuffkits.com.'],
      }),
    );
  });
  await page.goto('/order/confirmed/');
  await expect(page.getByTestId('order-confirmation')).toContainText('TEST-ORDER');
  await expect(page.getByTestId('order-confirmation')).toContainText('$19.49');
  await expect(page.getByText(/email your propeller design/i)).toBeVisible();
});

test('order confirmation without an order shows fallback', async ({ page }) => {
  await page.goto('/order/confirmed/');
  await expect(page.getByText(/no recent order found/i)).toBeVisible();
});
