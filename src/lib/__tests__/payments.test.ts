import { describe, it, expect } from 'vitest';
import {
  PAYMENT_PLANS,
  buildStripeCheckoutPayload,
  buildMercadoPagoPreferencePayload,
  calculateAnnualSavings,
  getStripeCustomerPortalUrl,
} from '../payments';

describe('Motor de Pagos Autónomos y Facturación (DT-04)', () => {
  it('debe contener los planes clave con sus precios y frecuencias en MXN', () => {
    expect(PAYMENT_PLANS.WHITE_LABEL_MONTHLY.amount).toBe(299);
    expect(PAYMENT_PLANS.WHITE_LABEL_MONTHLY.interval).toBe('month');
    expect(PAYMENT_PLANS.WHITE_LABEL_ANNUAL.amount).toBe(2990);
    expect(PAYMENT_PLANS.WHITE_LABEL_ANNUAL.interval).toBe('year');
    expect(PAYMENT_PLANS.CLUB_VIP_MONTHLY.amount).toBe(49);
    expect(PAYMENT_PLANS.ADS_RECHARGE_500.amount).toBe(500);
  });

  it('debe calcular correctamente el ahorro de 2 meses en el plan anual', () => {
    const monthly = PAYMENT_PLANS.WHITE_LABEL_MONTHLY.amount; // 299
    const annual = PAYMENT_PLANS.WHITE_LABEL_ANNUAL.amount; // 2990
    const savings = calculateAnnualSavings(monthly, annual);

    // 299 * 12 = 3588. 3588 - 2990 = 598 MXN (exactamente 2 meses de ahorro)
    expect(savings).toBe(598);
  });

  it('debe estructurar el payload para Stripe Checkout en modo suscripción', () => {
    const payload = buildStripeCheckoutPayload({
      planId: PAYMENT_PLANS.WHITE_LABEL_MONTHLY.id,
      organizationId: 'org-reforma-1',
      customerEmail: 'gerente@tacosguero.mx',
      metadata: { branch: 'Matriz Roma' },
    });

    expect(payload.mode).toBe('subscription');
    expect(payload.customer_email).toBe('gerente@tacosguero.mx');
    expect(payload.client_reference_id).toBe('org-reforma-1');
    expect(payload.line_items).toHaveLength(1);
    expect(payload.line_items[0].price).toBe(PAYMENT_PLANS.WHITE_LABEL_MONTHLY.id);
    expect(payload.metadata.branch).toBe('Matriz Roma');
    expect(payload.success_url).toContain('payment=success');
  });

  it('debe generar el payload para la API de Preferencias de Mercado Pago (SPEI/OXXO)', () => {
    const payload = buildMercadoPagoPreferencePayload({
      planId: PAYMENT_PLANS.ADS_RECHARGE_1000.id,
      organizationId: 'org-dentista-del-valle',
      payerEmail: 'contacto@dentistas.mx',
    });

    expect(payload.items[0].currency_id).toBe('MXN');
    expect(payload.items[0].unit_price).toBe(1000);
    expect(payload.payer.email).toBe('contacto@dentistas.mx');
    expect(payload.external_reference).toBe('org-dentista-del-valle');
    expect(payload.back_urls.success).toContain('mp_status=approved');
  });

  it('debe generar la URL del portal de autoservicio de clientes de Stripe', () => {
    const url = getStripeCustomerPortalUrl('cus_NxF821');
    expect(url).toContain('https://billing.stripe.com/p/session/test_cus_NxF821');
  });
});

