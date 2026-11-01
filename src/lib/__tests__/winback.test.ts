import { describe, it, expect } from 'vitest';
import { generateWinbackEmail, scheduleWinbackCampaign } from '../winback';

describe('Pipeline Automatizado de Recaptura por E-mail (Win-Back) (DT-07)', () => {
  it('debe generar el correo de advertencia del Día 3 sobre pérdida del filtro', () => {
    const email = generateWinbackEmail(
      'day_3',
      'Parrilla Los Compadres',
      'Don Fernando',
      'https://app.tuplataforma.mx/#/portal/login?reactivate=compadres'
    );

    expect(email.step).toBe('day_3');
    expect(email.subject).toContain('Don Fernando');
    expect(email.subject).toContain('Parrilla Los Compadres');
    expect(email.subject).toContain('filtro');

    // Mensaje advierte del riesgo de Google Maps
    expect(email.plainText).toContain('1 a 3 estrellas');
    expect(email.plainText).toContain('Google Maps');
    expect(email.htmlBody).toContain('Riesgo de Reputación Activo');
    expect(email.htmlBody).toContain('https://app.tuplataforma.mx/#/portal/login?reactivate=compadres');
  });

  it('debe generar el correo de reactivación del Día 14 con oferta del 30% OFF', () => {
    const email = generateWinbackEmail(
      'day_14',
      'Parrilla Los Compadres',
      'Don Fernando'
    );

    expect(email.step).toBe('day_14');
    expect(email.subject).toContain('30% de Descuento');
    expect(email.plainText).toContain('$209 MXN/mes');
    expect(email.htmlBody).toContain('$209 MXN / mes');
    expect(email.htmlBody).toContain('WINBACK30');
  });

  it('debe programar los envíos a los 3 y 14 días después de la fecha de baja', () => {
    const deactivatedDate = new Date('2026-11-01T12:00:00Z');
    const plan = scheduleWinbackCampaign({
      organizationId: 'org-compadres-1',
      restaurantName: 'Parrilla Los Compadres',
      ownerName: 'Don Fernando',
      ownerEmail: 'fernando@compadres.mx',
      deactivatedAt: deactivatedDate,
    });

    expect(plan.organizationId).toBe('org-compadres-1');
    expect(plan.status).toBe('scheduled');

    const day3Date = new Date(plan.day3ScheduledFor);
    const day14Date = new Date(plan.day14ScheduledFor);

    // Diferencia en milisegundos
    const diffDays3 = Math.round((day3Date.getTime() - deactivatedDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffDays14 = Math.round((day14Date.getTime() - deactivatedDate.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays3).toBe(3);
    expect(diffDays14).toBe(14);
  });
});

