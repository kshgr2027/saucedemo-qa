import { expect, Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  async expectOnlyItem(name: string, price: string) {
    await expect(this.page).toHaveURL(/\/cart\.html$/);
    const items = this.page.getByTestId('inventory-item');
    await expect(items).toHaveCount(1);
    await expect(items.getByTestId('inventory-item-name')).toHaveText(name);
    await expect(items.getByTestId('inventory-item-price')).toHaveText(price);
  }

  async checkout() {
    await this.page.getByTestId('checkout').click();
  }
}
