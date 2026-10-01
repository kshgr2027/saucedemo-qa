import { Download, expect, Page } from '@playwright/test';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillCustomerInfo(info: CustomerInfo) {
    await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
    await this.page.getByTestId('firstName').fill(info.firstName);
    await this.page.getByTestId('lastName').fill(info.lastName);
    await this.page.getByTestId('postalCode').fill(info.postalCode);
    await this.page.getByTestId('continue').click();
  }

  async expectOverview(name: string, price: string) {
    await expect(this.page).toHaveURL(/\/checkout-step-two\.html$/);
    const items = this.page.getByTestId('inventory-item');
    await expect(items).toHaveCount(1);
    await expect(items.getByTestId('inventory-item-name')).toHaveText(name);
    await expect(items.getByTestId('inventory-item-price')).toHaveText(price);
    await expect(this.page.getByTestId('subtotal-label')).toHaveText(`Item total: ${price}`);
  }

  /** Independent oracle: total must equal item total + displayed tax, whatever the tax rule is. */
  async expectTotalIsSubtotalPlusTax() {
    const subtotal = await this.amountOf('subtotal-label');
    const tax = await this.amountOf('tax-label');
    const total = await this.amountOf('total-label');
    expect(total).toBe(subtotal + tax);
  }

  async expectTotal(total: string) {
    await expect(this.page.getByTestId('total-label')).toHaveText(`Total: ${total}`);
  }

  async finish() {
    await this.page.getByTestId('finish').click();
  }

  async expectOrderComplete() {
    await expect(this.page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(this.page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  }

  /** Clicks "Generate PDF order" and returns the download Playwright receives. */
  async generateOrderPdf(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Generate PDF order' }).click(),
    ]);
    return download;
  }

  /** Reads a "Label: $12.34" element and returns the amount in cents (avoids float errors). */
  private async amountOf(testId: string): Promise<number> {
    const text = await this.page.getByTestId(testId).innerText();
    const match = text.match(/\$(\d+\.\d{2})/);
    if (!match) throw new Error(`No price found in "${text}" (${testId})`);
    return Math.round(parseFloat(match[1]) * 100);
  }
}
