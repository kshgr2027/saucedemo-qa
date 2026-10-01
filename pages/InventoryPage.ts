import { expect, Page } from '@playwright/test';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  private productCard(name: string) {
    return this.page.getByTestId('inventory-item').filter({ hasText: name });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await expect(this.page.getByTestId('title')).toHaveText('Products');
  }

  async expectProductListed(name: string, price: string) {
    const card = this.productCard(name);
    await expect(card).toBeVisible();
    await expect(card.getByTestId('inventory-item-price')).toHaveText(price);
  }

  async addToCart(name: string) {
    const card = this.productCard(name);
    await card.getByRole('button', { name: 'Add to cart' }).click();
    // The button flips to "Remove" once the item is in the cart.
    await expect(card.getByRole('button', { name: 'Remove' })).toBeVisible();
  }

  async expectCartBadge(count: number) {
    await expect(this.page.getByTestId('shopping-cart-badge')).toHaveText(String(count));
  }

  async openCart() {
    await this.page.getByTestId('shopping-cart-link').click();
  }
}
