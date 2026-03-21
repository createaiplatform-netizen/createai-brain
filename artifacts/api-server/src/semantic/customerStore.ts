/**
 * semantic/customerStore.ts
 * -------------------------
 * In-memory customer registry for semantic product purchases.
 *
 * Populated via the Stripe checkout.session.completed webhook.
 * Every real purchase is recorded here with full metadata.
 * Foundation layer for future CRM, email sequences, and LTV analysis.
 *
 * Note: In-memory — persists until server restart. Upgrade path:
 * replace _customers array with a DB table (semantic_customers) using the
 * same interface. No consumer code changes required.
 */

export interface SemanticCustomer {
  id: string;
  email: string;
  name: string;
  productId: string;
  productTitle: string;
  productFormat: string;
  priceCents: number;
  currency: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  channel: string;
  deliveryEmailSent: boolean;
  deliverySentAt?: string;
  purchasedAt: string;
}

export interface CustomerStats {
  totalCustomers: number;
  uniqueEmails: number;
  totalRevenueCents: number;
  averageOrderCents: number;
  topProducts: Array<{ productId: string; productTitle: string; count: number }>;
  topFormats: Array<{ format: string; count: number }>;
  recentPurchases: SemanticCustomer[];
}

const _customers: SemanticCustomer[] = [];

export function addCustomer(c: SemanticCustomer): void {
  _customers.push(c);
  console.log(`[SemanticCRM] Customer captured — ${c.email} · ${c.productTitle} · $${(c.priceCents / 100).toFixed(2)}`);
}

export function getCustomers(): SemanticCustomer[] {
  return [..._customers].sort((a, b) =>
    new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );
}

export function getCustomerCount(): number {
  return _customers.length;
}

export function findCustomerByEmail(email: string): SemanticCustomer[] {
  return _customers.filter(c => c.email.toLowerCase() === email.toLowerCase());
}

export function getCustomerStats(): CustomerStats {
  const uniqueEmails = new Set(_customers.map(c => c.email)).size;
  const totalRevenueCents = _customers.reduce((sum, c) => sum + c.priceCents, 0);
  const avgOrderCents = _customers.length > 0 ? Math.round(totalRevenueCents / _customers.length) : 0;

  const productCounts = _customers.reduce<Record<string, { title: string; count: number }>>((acc, c) => {
    if (!acc[c.productId]) acc[c.productId] = { title: c.productTitle, count: 0 };
    acc[c.productId]!.count++;
    return acc;
  }, {});

  const formatCounts = _customers.reduce<Record<string, number>>((acc, c) => {
    acc[c.productFormat] = (acc[c.productFormat] || 0) + 1;
    return acc;
  }, {});

  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([productId, v]) => ({ productId, productTitle: v.title, count: v.count }));

  const topFormats = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([format, count]) => ({ format, count }));

  return {
    totalCustomers: _customers.length,
    uniqueEmails,
    totalRevenueCents,
    averageOrderCents: avgOrderCents,
    topProducts,
    topFormats,
    recentPurchases: getCustomers().slice(0, 10),
  };
}
