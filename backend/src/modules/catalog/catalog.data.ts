import { ProductCatalogItem } from '../../types';

export const PRODUCT_CATALOG: Record<string, ProductCatalogItem> = {
  'prod_sample_001': {
    id: 'prod_sample_001',
    name: 'PayFlow Developer Sandbox Pass',
    description: 'Lifetime access to PayFlow developer sandbox tools, testing utilities, and API credentials.',
    unitPriceMinor: 99900, // ₹999.00
    currency: 'INR',
  },
  'prod_starter_kit': {
    id: 'prod_starter_kit',
    name: 'Fintech Starter Kit',
    description: 'Pre-configured payment flow templates, webhooks testing suite, and security checklists.',
    unitPriceMinor: 149900, // ₹1,499.00
    currency: 'INR',
  },
};

export function getProductById(productId: string): ProductCatalogItem | undefined {
  return PRODUCT_CATALOG[productId];
}

export function getAllProducts(): ProductCatalogItem[] {
  return Object.values(PRODUCT_CATALOG);
}
