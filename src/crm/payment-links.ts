export interface CreatePaymentLinkInput {
  title: string;
  amountCents: number;
  currency?: string; // 'USD', 'PEN', 'MXN'
  contactPhone: string;
  organizationSlug: string;
  provider?: "stripe" | "mercadopago";
}

export function generatePaymentLink(input: CreatePaymentLinkInput): string {
  const currency = input.currency || "USD";
  const provider = input.provider || "stripe";
  const randomRef = Math.random().toString(36).substring(7);

  // Formato estándar de link de pago seguro
  if (provider === "mercadopago") {
    return `https://mpago.la/pay/${input.organizationSlug}-${randomRef}?amount=${(input.amountCents / 100).toFixed(2)}&currency=${currency}`;
  }

  return `https://buy.stripe.com/${input.organizationSlug}-${randomRef}?amount=${input.amountCents}&currency=${currency.toLowerCase()}`;
}
