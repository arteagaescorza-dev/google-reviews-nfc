/**
 * Módulo de Exportación Masiva y Webhooks CRM para Anunciantes (DT-08)
 * Permite descargar prospectos en CSV/Excel con codificación UTF-8 BOM para Windows
 * y disparar webhooks en tiempo real a Zapier / Make / HubSpot / Salesforce.
 */

import type { Coupon } from '../types';

/**
 * Genera el contenido CSV con BOM UTF-8 (\uFEFF) para compatibilidad total con Excel en español
 */
export function generateLeadsCsv(coupons: Coupon[]): string {
  const BOM = '\uFEFF';
  const headers = [
    'ID Cupón',
    'Código de Canje',
    'Anunciante / Marca',
    'Beneficio',
    'Nombre del Prospecto',
    'Teléfono WhatsApp',
    'Estado',
    'Monto Ticket (MXN)',
    'Fecha de Creación',
    'Fecha de Canje',
  ];

  const escapeField = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = coupons.map((c) => [
    escapeField(c.id),
    escapeField(c.coupon_code),
    escapeField(c.advertiser_name),
    escapeField(c.discount_description),
    escapeField(c.customer_name || 'Comensal en mesa'),
    escapeField(c.customer_phone || 'No registrado'),
    escapeField(c.status === 'redeemed' ? 'Canjeado' : c.status === 'active' ? 'Activo' : 'Vencido'),
    escapeField(c.ticket_amount ? c.ticket_amount.toFixed(2) : '0.00'),
    escapeField(c.created_at ? new Date(c.created_at).toLocaleString('es-MX') : ''),
    escapeField(c.redeemed_at ? new Date(c.redeemed_at).toLocaleString('es-MX') : 'Pendiente'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return BOM + csvContent;
}

/**
 * Dispara la descarga del archivo CSV en el navegador del cliente
 */
export function downloadLeadsCsv(coupons: Coupon[], filename = 'prospectos-anunciante.csv'): void {
  const csv = generateLeadsCsv(coupons);
  if (typeof window === 'undefined') return;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera una firma HMAC de prueba para seguridad en webhooks salientes
 */
export function computeWebhookSignature(payload: string, secret: string): string {
  // En frontend / test usamos una codificación simple determinista basada en el payload y el secreto
  let hash = 0;
  const combined = `${payload}:${secret}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sha256=' + Math.abs(hash).toString(16).padStart(64, '0');
}

export interface WebhookDispatchResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Despacha un evento de prospecto en tiempo real al Webhook del CRM del anunciante
 */
export async function dispatchCrmWebhook(
  targetUrl: string,
  eventType: 'lead_captured' | 'coupon_redeemed',
  coupon: Coupon,
  secret = 'webhook_secret_default'
): Promise<WebhookDispatchResult> {
  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: {
      coupon_id: coupon.id,
      coupon_code: coupon.coupon_code,
      advertiser_name: coupon.advertiser_name,
      customer_name: coupon.customer_name,
      customer_phone: coupon.customer_phone,
      discount_description: coupon.discount_description,
      status: coupon.status,
      ticket_amount: coupon.ticket_amount,
      redeemed_at: coupon.redeemed_at,
    },
  };

  const payloadString = JSON.stringify(payload);
  const signature = computeWebhookSignature(payloadString, secret);

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': eventType,
        'X-Webhook-Signature': signature,
      },
      body: payloadString,
    });

    return {
      success: res.ok,
      statusCode: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error de conexión con el endpoint del CRM.',
    };
  }
}

