import { expect, test } from '@playwright/test';

test('home → catalog search → product → cart drawer → persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Rubber-Powered Plane Kits' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /which kit/i })).toHaveCount(0);
  await expect(page.getByRole('banner').locator('img')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /featured kits/i })).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(6);

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

// PayPal expands its card form inline where the buttons sit. SheetContent is a viewport-height
// fixed column, so without its own scroller that form ran past the bottom of the drawer with no
// scrollbar anywhere and the Pay button could not be reached.
test('cart drawer scrolls, so a tall payment panel stays reachable', async ({ page }) => {
  await page.goto('/products/custom-propeller/');
  await page.getByTestId('add-to-cart').click();
  const sheet = page.locator('[data-slot="sheet-content"]');
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');

  // Stand in for PayPal expanding its form in the container that holds the buttons: content taller
  // than the drawer must become reachable by scrolling it.
  const reachable = await sheet.evaluate((el) => {
    const host = el.querySelector('[data-testid="paypal-buttons"]')?.parentElement ?? el;
    const probe = document.createElement('div');
    probe.style.height = `${el.clientHeight + 600}px`;
    host.appendChild(probe);
    el.scrollTop = 99_999;
    const scrolled = el.scrollTop > 0;
    probe.remove();
    return scrolled;
  });
  expect(reachable).toBe(true);
});

// The checkout page renders its own PayPal buttons. A cart drawer on top of it mounted a second
// set and their hosted overlays stacked, so the drawer is suppressed there.
test('checkout page suppresses the cart drawer, so PayPal buttons mount once', async ({ page }) => {
  await page.goto('/products/custom-propeller/');
  await page.getByTestId('add-to-cart').click();
  await expect(page.getByRole('dialog', { name: /your cart/i })).toBeVisible();

  await page.goto('/checkout/');
  await expect(page.getByTestId('paypal-buttons')).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: /your cart/i })).toHaveCount(0);

  await page.getByTestId('cart-trigger').click();
  await expect(page.getByRole('dialog', { name: /your cart/i })).toHaveCount(0);
  await expect(page.getByTestId('paypal-buttons')).toHaveCount(1);
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

test('about page carries the rewritten description', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByText(/designs and sells laser-cut rubber-powered indoor free-flight kits/i)).toBeVisible();
  await expect(page.getByText(/placed 1st at the MIT Science Olympiad Invitational in the 2025 and 2026 seasons/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'soinc.org' })).toHaveAttribute('href', 'https://www.soinc.org/');
  await expect(page.getByText(/2nd place/i)).toHaveCount(0);
});
