/**
 * Motor de Pagos Autónomos y Facturación Recurrente (DT-04)
 * Soporta Stripe Billing (Tarjetas internacionales) y Mercado Pago (SPEI, OXXO, Débito MX)
 */

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: 'mxn' | 'usd';
  interval?: 'month' | 'year';
  type: 'subscription' | 'one_time';
}

export const PAYMENT_PLANS: Record<string, PaymentPlan> = {
  WHITE_LABEL_MONTHLY: {
    id: 'price_wl_monthly_299',
    name: 'Suscripción Marca Blanca Mensual',
    description: 'Elimina anuncios de terceros, personaliza logo y colores propios.',
    amount: 299,
    currency: 'mxn',
    interval: 'month',
    type: 'subscription',
  },
  WHITE_LABEL_ANNUAL: {
    id: 'price_wl_annual_2990',
    name: 'Suscripción Marca Blanca Anual (Ahorra 2 Meses)',
    description: '12 meses de Marca Blanca por el precio de 10 meses.',
    amount: 2990,
    currency: 'mxn',
    interval: 'year',
    type: 'subscription',
  },
  CLUB_VIP_MONTHLY: {
    id: 'price_club_vip_49',
    name: 'Membresía Club Foodie VIP',
    description: 'Envíos gratis a oficinas corporativas y 10% de cashback.',
    amount: 49,
    currency: 'mxn',
    interval: 'month',
    type: 'subscription',
  },
  ADS_RECHARGE_500: {
    id: 'price_ads_500',
    name: 'Recarga de Saldo Pauta Publicitaria ($500 MXN)',
    description: 'Aproximadamente 2,000 impresiones en mesas locales.',
    amount: 500,
    currency: 'mxn',
    type: 'one_time',
  },
  ADS_RECHARGE_1000: {
    id: 'price_ads_1000',
    name: 'Recarga de Saldo Pauta Publicitaria ($1,000 MXN)',
    description: 'Aproximadamente 4,500 impresiones con bono de alcance.',
    amount: 1000,
    currency: 'mxn',
    type: 'one_time',
  },
  ADS_RECHARGE_2500: {
    id: 'price_ads_2500',
    name: 'Recarga de Saldo Pauta Publicitaria ($2,500 MXN)',
    description: 'Aproximadamente 12,000 impresiones en circuito gastronómico.',
    amount: 2500,
    currency: 'mxn',
    type: 'one_time',
  },
};

export interface StripeCheckoutOptions {
  planId: string;
  organizationId: string;
  customerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutPayload {
  mode: 'subscription' | 'payment';
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  customer_email: string;
  client_reference_id: string;
  success_url: string;
  cancel_url: string;
  metadata: Record<string, string>;
}

export interface MercadoPagoPreferenceOptions {
  planId: string;
  organizationId: string;
  payerEmail: string;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
}

export interface MercadoPagoPreferencePayload {
  items: Array<{
    id: string;
    title: string;
    unit_price: number;
    quantity: number;
    currency_id: 'MXN';
  }>;
  payer: {
    email: string;
  };
  external_reference: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: 'approved';
  payment_methods: {
    excluded_payment_types: Array<{ id: string }>;
    installments: number;
  };
}

/**
 * Genera el payload de creación de sesión en Stripe Checkout
 */
export function buildStripeCheckoutPayload(options: StripeCheckoutOptions): StripeCheckoutPayload {
  const plan = Object.values(PAYMENT_PLANS).find((p) => p.id === options.planId) || PAYMENT_PLANS.WHITE_LABEL_MONTHLY;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.tuplataforma.mx';

  return {
    mode: plan.type === 'subscription' ? 'subscription' : 'payment',
    line_items: [
      {
        price: plan.id,
        quantity: 1,
      },
    ],
    customer_email: options.customerEmail,
    client_reference_id: options.organizationId,
    success_url: options.successUrl || `${baseUrl}/#/portal?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: options.cancelUrl || `${baseUrl}/#/portal?payment=cancelled`,
    metadata: {
      organization_id: options.organizationId,
      plan_name: plan.name,
      ...options.metadata,
    },
  };
}

/**
 * Genera el payload para la API de Preferencias de Mercado Pago (SPEI, OXXO y tarjetas)
 */
export function buildMercadoPagoPreferencePayload(
  options: MercadoPagoPreferenceOptions
): MercadoPagoPreferencePayload {
  const plan = Object.values(PAYMENT_PLANS).find((p) => p.id === options.planId) || PAYMENT_PLANS.WHITE_LABEL_MONTHLY;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.tuplataforma.mx';

  return {
    items: [
      {
        id: plan.id,
        title: plan.name,
        unit_price: plan.amount,
        quantity: 1,
        currency_id: 'MXN',
      },
    ],
    payer: {
      email: options.payerEmail,
    },
    external_reference: options.organizationId,
    back_urls: options.backUrls || {
      success: `${baseUrl}/#/portal?mp_status=approved`,
      failure: `${baseUrl}/#/portal?mp_status=failure`,
      pending: `${baseUrl}/#/portal?mp_status=pending`,
    },
    auto_return: 'approved',
    payment_methods: {
      excluded_payment_types: [],
      installments: 1,
    },
  };
}

/**
 * Calcula el ahorro en pesos de elegir el plan anual
 */
export function calculateAnnualSavings(monthlyAmount: number, annualAmount: number): number {
  return monthlyAmount * 12 - annualAmount;
}

/**
 * Genera la URL del portal de autoservicio de clientes de Stripe (Customer Portal)
 */
export function getStripeCustomerPortalUrl(customerId: string): string {
  return `https://billing.stripe.com/p/session/test_${customerId}`;
}

