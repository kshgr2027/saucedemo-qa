import * as fs from 'fs';
import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

// Credentials are the public demo ones supplied by the assessment. Customer data is synthetic.
const USER = { username: 'standard_user', password: 'secret_sauce' };
const CUSTOMER = { firstName: 'Test', lastName: 'User', postalCode: '12345' };
const PRODUCT = { name: 'Sauce Labs Backpack', price: '$29.99' };
// Observed baseline for this product, not a documented requirement. The tax rule is
// undocumented, so the independent subtotal + tax = total check below is the primary oracle.
const EXPECTED_TOTAL = '$32.39';

test('standard user can purchase a single product end to end', async ({ page }, testInfo) => {
  const login = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  await test.step('Log in', async () => {
    await login.goto();
    await login.login(USER.username, USER.password);
    await inventory.expectLoaded();
  });

  await test.step('Add the product to the cart', async () => {
    await inventory.expectProductListed(PRODUCT.name, PRODUCT.price);
    await inventory.addToCart(PRODUCT.name);
    await inventory.expectCartBadge(1);
  });

  await test.step('Review the cart', async () => {
    await inventory.openCart();
    await cart.expectOnlyItem(PRODUCT.name, PRODUCT.price);
  });

  await test.step('Enter customer information and review the order', async () => {
    await cart.checkout();
    await checkout.fillCustomerInfo(CUSTOMER);
    await checkout.expectOverview(PRODUCT.name, PRODUCT.price);
    await checkout.expectTotalIsSubtotalPlusTax();
    await checkout.expectTotal(EXPECTED_TOTAL);
  });

  await test.step('Finish and verify the order is complete', async () => {
    await checkout.finish();
    await checkout.expectOrderComplete();
  });

  await test.step('Generate the PDF order and verify the download', async () => {
    const download = await checkout.generateOrderPdf();
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    expect(await download.failure()).toBeNull();

    // Keep a copy as a test artifact (the app's own filename is dynamic, so ours is fixed).
    const pdfPath = testInfo.outputPath('order-receipt.pdf');
    await download.saveAs(pdfPath);
    // The extension alone proves little: check the file really starts with the PDF signature.
    expect(fs.readFileSync(pdfPath).subarray(0, 4).toString('latin1')).toBe('%PDF');
    await testInfo.attach('order-receipt', { path: pdfPath, contentType: 'application/pdf' });
  });
});
