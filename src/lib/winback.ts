/**
 * Pipeline Automatizado de Recaptura por E-mail (Win-Back) (DT-07)
 * Secuencia inteligente en 2 etapas tras la baja o pausa de una sucursal:
 * - Día 3: Alerta de pérdida del escudo anti-reseñas negativas.
 * - Día 14: Oferta de reactivación con 30% de descuento vitalicio.
 */

export interface WinbackEmailMessage {
  step: 'day_3' | 'day_14';
  subject: string;
  previewText: string;
  htmlBody: string;
  plainText: string;
}

export interface WinbackScheduleParams {
  organizationId: string;
  restaurantName: string;
  ownerName: string;
  ownerEmail: string;
  deactivatedAt?: Date;
  reactivateUrl?: string;
}

export interface WinbackCampaignPlan {
  organizationId: string;
  restaurantName: string;
  ownerEmail: string;
  day3ScheduledFor: string;
  day14ScheduledFor: string;
  status: 'scheduled' | 'active' | 'completed' | 'reactivated';
}

/**
 * Genera el contenido persuasivo del correo de recaptura según la etapa
 */
export function generateWinbackEmail(
  step: 'day_3' | 'day_14',
  restaurantName: string,
  ownerName: string,
  reactivateUrl = 'https://app.tuplataforma.mx/#/portal/login?reactivate=true'
): WinbackEmailMessage {
  if (step === 'day_3') {
    const subject = `⚠️ Atención ${ownerName}: Tus comensales en ${restaurantName} ya no tienen filtro anti-reseñas`;
    const previewText = `Las quejas de 1 a 3 estrellas ahora van directo a Google Maps sin previo aviso.`;
    const plainText = `Hola ${ownerName},

Te escribimos porque hace 3 días desactivaste la protección en ${restaurantName}.

Queremos advertirte de un riesgo operativo crítico:
Durante tu periodo activo, filtramos las quejas de 1 a 3 estrellas hacia tu buzón privado de gerencia, evitando que afectaran tu promedio público en Google Maps.

Ahora que la sucursal está inactiva, cualquier comensal insatisfecho que escanee las mesas o busque tu local podrá publicar 1 estrella públicamente sin que puedas resolver el malentendido a tiempo.

Puedes reactivar tu escudo inteligente en cualquier momento y mantener intactas las placas NFC ya instaladas en tus mesas:
${reactivateUrl}

Saludos cordiales,
Equipo de Operaciones y Calidad`;

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #e11d48; margin-top: 0;">⚠️ Atención ${ownerName}</h2>
        <p style="font-size: 15px; color: #334155;">Te escribimos porque hace 3 días se pausó la protección en <strong>${restaurantName}</strong>.</p>
        <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px 16px; margin: 16px 0; border-radius: 8px;">
          <p style="margin: 0; color: #9f1239; font-size: 14px; font-weight: bold;">Riesgo de Reputación Activo:</p>
          <p style="margin: 4px 0 0 0; color: #be123c; font-size: 13px;">Las quejas de 1, 2 y 3 estrellas ya no se canalizan a tu buzón privado; ahora impactan directamente tu calificación pública en Google.</p>
        </div>
        <p style="font-size: 14px; color: #475569;">No necesitas cambiar ni retirar las placas NFC de tus mesas. Tu configuración sigue lista para reactivarse con 1 clic.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${reactivateUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">Reactivar Escudo en ${restaurantName}</a>
        </div>
      </div>
    `;

    return { step, subject, previewText, htmlBody, plainText };
  }

  // ETAPA DÍA 14: OFERTA DE REACTIVACIÓN CON 30% OFF
  const subject = `🎁 Oferta Exclusiva: Reactiva ${restaurantName} con 30% de Descuento Vitalicio`;
  const previewText = `Queremos que sigas creciendo. Reactiva hoy por solo $209 MXN/mes.`;
  const plainText = `Hola ${ownerName},

Te extrañamos en la red de restaurantes inteligentes.

Sabemos lo difícil que es mantener los costos a raya mientras cuidas la experiencia de tus clientes en ${restaurantName}. Por eso, queremos ofrecerte un 30% de descuento vitalicio en tu suscripción de Marca Blanca:

De $299 MXN/mes ➡️ a solo $209 MXN/mes para siempre.

Tus mesas siguen listas, tus códigos QR siguen funcionando. Solo pulsa el enlace para reactivar tu tarifa preferencial:
${reactivateUrl}&coupon=WINBACK30

Atentamente,
Dirección Comercial`;

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #0f172a; margin-top: 0;">🎁 Oferta Exclusiva para ${ownerName}</h2>
      <p style="font-size: 15px; color: #334155;">Queremos que <strong>${restaurantName}</strong> continúe recibiendo reseñas de 5 estrellas en automático.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 16px; margin: 16px 0; border-radius: 12px; text-align: center;">
        <span style="font-size: 12px; font-weight: bold; color: #166534; text-transform: uppercase;">Tarifa Especial de Reactivación</span>
        <div style="font-size: 28px; font-weight: 900; color: #15803d; margin: 8px 0;">$209 MXN / mes</div>
        <p style="margin: 0; font-size: 12px; color: #166534;">Precio congelado de por vida (Ahorras $90 MXN cada mes)</p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${reactivateUrl}&coupon=WINBACK30" style="background-color: #f59e0b; color: #0f172a; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px; display: inline-block;">Reactivar con 30% de Descuento</a>
      </div>
    </div>
  `;

  return { step, subject, previewText, htmlBody, plainText };
}

/**
 * Planifica el calendario de envíos para los días 3 y 14 tras la baja
 */
export function scheduleWinbackCampaign(params: WinbackScheduleParams): WinbackCampaignPlan {
  const baseDate = params.deactivatedAt ? new Date(params.deactivatedAt) : new Date();

  const day3 = new Date(baseDate);
  day3.setDate(day3.getDate() + 3);

  const day14 = new Date(baseDate);
  day14.setDate(day14.getDate() + 14);

  return {
    organizationId: params.organizationId,
    restaurantName: params.restaurantName,
    ownerEmail: params.ownerEmail,
    day3ScheduledFor: day3.toISOString(),
    day14ScheduledFor: day14.toISOString(),
    status: 'scheduled',
  };
}

