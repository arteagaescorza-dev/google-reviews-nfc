import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLeadsCsv, computeWebhookSignature, dispatchCrmWebhook } from '../export';
import type { Coupon } from '../../types';

describe('Exportación CSV/Excel y Webhooks CRM (DT-08)', () => {
  const mockCoupons: Coupon[] = [
    {
      id: 'coup-1',
      ad_id: 'ad-101',
      restaurant_id: 'res-1',
      coupon_code: 'TACOPROMO20',
      title: '20% en Tacos al Pastor',
      advertiser_name: 'Taquería La Esquina',
      discount_description: '20% OFF en consumo mínimo de $200',
      status: 'redeemed',
      customer_name: 'María Gómez López',
      customer_phone: '5511223344',
      ticket_amount: 340.50,
      redeemed_at: '2026-10-31T20:15:00Z',
      expires_at: '2026-11-30T23:59:59Z',
      created_at: '2026-10-31T19:00:00Z',
    },
    {
      id: 'coup-2',
      ad_id: 'ad-102',
      restaurant_id: 'res-1',
      coupon_code: 'DENTISALUD',
      title: 'Limpieza Dental 2x1',
      advertiser_name: 'Clínica Dental Roma',
      discount_description: 'Limpieza ultrasónica sin costo adicional',
      status: 'active',
      customer_name: 'Juan Pérez Hernández',
      customer_phone: '5599887766',
      ticket_amount: null,
      redeemed_at: null,
      expires_at: '2026-12-15T23:59:59Z',
      created_at: '2026-11-01T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe generar el contenido CSV con BOM UTF-8 (\uFEFF) para Windows Excel', () => {
    const csv = generateLeadsCsv(mockCoupons);

    // Validar el BOM al inicio
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Validar encabezados en español
    expect(csv).toContain('Código de Canje');
    expect(csv).toContain('Teléfono WhatsApp');
    expect(csv).toContain('Monto Ticket (MXN)');

    // Validar que se preservan acentos y eñes sin corrupción
    expect(csv).toContain('María Gómez López');
    expect(csv).toContain('Juan Pérez Hernández');
    expect(csv).toContain('Taquería La Esquina');

    // Validar valores numéricos y estados
    expect(csv).toContain('340.50');
    expect(csv).toContain('Canjeado');
    expect(csv).toContain('Activo');
  });

  it('debe generar una firma HMAC determinista para seguridad de webhooks', () => {
    const payload = JSON.stringify({ event: 'lead_captured', id: '123' });
    const secret = 'my_secret_token_123';

    const sig1 = computeWebhookSignature(payload, secret);
    const sig2 = computeWebhookSignature(payload, secret);

    expect(sig1).toBe(sig2);
    expect(sig1.startsWith('sha256=')).toBe(true);
    expect(sig1).toHaveLength(71); // 'sha256=' (7) + 64 hex chars
  });

  it('debe despachar un webhook con headers de evento y firma criptográfica', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    (globalThis as any).fetch = mockFetch;

    const result = await dispatchCrmWebhook(
      'https://hooks.zapier.com/hooks/catch/12345/abcde/',
      'lead_captured',
      mockCoupons[0],
      'secret-clave'
    );

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(mockFetch).toHaveBeenCalled();

    const [url, requestInit] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hooks.zapier.com/hooks/catch/12345/abcde/');
    expect(requestInit.method).toBe('POST');
    expect(requestInit.headers['X-Webhook-Event']).toBe('lead_captured');
    expect(requestInit.headers['X-Webhook-Signature']).toContain('sha256=');

    const bodyParsed = JSON.parse(requestInit.body);
    expect(bodyParsed.event).toBe('lead_captured');
    expect(bodyParsed.data.coupon_code).toBe('TACOPROMO20');
    expect(bodyParsed.data.customer_name).toBe('María Gómez López');
  });
});

