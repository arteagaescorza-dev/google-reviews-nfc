import type { Coupon } from '../types';

export interface WalletLocation {
  latitude: number;
  longitude: number;
  relevantText: string;
}

export interface ApplePassStructure {
  formatVersion: number;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  logoText: string;
  foregroundColor: string;
  backgroundColor: string;
  labelColor: string;
  coupon: {
    primaryFields: Array<{ key: string; label: string; value: string }>;
    secondaryFields: Array<{ key: string; label: string; value: string }>;
    auxiliaryFields: Array<{ key: string; label: string; value: string }>;
    backFields: Array<{ key: string; label: string; value: string }>;
  };
  barcode: {
    format: 'PKBarcodeFormatQR';
    message: string;
    messageEncoding: 'iso-8859-1';
  };
  locations?: WalletLocation[];
}

/**
 * Coordenadas de los locales y restaurantes aliados para el encendido por Geocerca GPS (200m)
 */
export const DEFAULT_PARTNER_LOCATIONS: WalletLocation[] = [
  {
    latitude: 19.432608,
    longitude: -99.133209,
    relevantText: '¡Estás cerca de La Parrilla Argentina! Muestra tu cupón en mesa para 20% OFF.',
  },
  {
    latitude: 19.418731,
    longitude: -99.167812,
    relevantText: '¡Bienvenido a Roma Norte! Tienes cupones exclusivos disponibles en la zona.',
  },
  {
    latitude: 19.434412,
    longitude: -99.191245,
    relevantText: '¡Estás a menos de 200m de un local aliado! Escanea el chip NFC en tu mesa.',
  },
];

/**
 * Genera el manifiesto pass.json para Apple Wallet (.pkpass)
 */
export function generateApplePassPayload(
  coupon: Coupon,
  customLocations: WalletLocation[] = DEFAULT_PARTNER_LOCATIONS
): ApplePassStructure {
  return {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.googleresenas.loyalty',
    serialNumber: `PASS-${coupon.coupon_code}`,
    teamIdentifier: 'AGY8947DEV',
    organizationName: coupon.advertiser_name || 'Red de Comercios Aliados',
    description: coupon.title || 'Cupón de Beneficios NFC',
    logoText: coupon.advertiser_name || 'Pasaporte Digital',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(30, 41, 59)', // slate-800
    labelColor: 'rgb(245, 158, 11)', // amber-500
    coupon: {
      primaryFields: [
        {
          key: 'discount',
          label: 'BENEFICIO EXCLUSIVO',
          value: coupon.discount_description || '20% DE DESCUENTO',
        },
      ],
      secondaryFields: [
        {
          key: 'expires',
          label: 'VIGENCIA',
          value: new Date(coupon.expires_at).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        },
        {
          key: 'status',
          label: 'ESTADO',
          value: coupon.status === 'active' ? 'LISTO PARA USAR' : 'CANJEADO',
        },
      ],
      auxiliaryFields: [
        {
          key: 'code',
          label: 'CÓDIGO DE CANJE',
          value: coupon.coupon_code,
        },
      ],
      backFields: [
        {
          key: 'terms',
          label: 'TÉRMINOS Y CONDICIONES',
          value:
            'Válido en establecimientos afiliados al presentar la tarjeta física NFC o el código de canje en mostrador. No acumulable con otras promociones. Sujeto a disponibilidad.',
        },
        {
          key: 'geofence',
          label: 'NOTIFICACIONES POR PROXIMIDAD',
          value:
            'Esta tarjeta te avisará automáticamente en tu pantalla bloqueada cuando te encuentres a menos de 200 metros de un restaurante o comercio aliado.',
        },
      ],
    },
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: coupon.coupon_code,
      messageEncoding: 'iso-8859-1',
    },
    locations: customLocations,
  };
}

/**
 * Genera el enlace de guardado directo a Google Wallet (Save to Google Wallet)
 */
export function generateGoogleWalletUrl(coupon: Coupon): string {
  const jwtPayload = {
    iss: 'google-wallet-issuer@nfc-reviews.iam.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [
        {
          id: `3388000000022${coupon.coupon_code}`,
          classId: '3388000000022.nfc_passport_tier1',
          state: 'active',
          accountId: coupon.customer_phone || 'COMENSAL-ANONIMO',
          accountName: coupon.customer_name || 'Comensal Frecuente',
          barcode: {
            type: 'qrCode',
            value: coupon.coupon_code,
            alternateText: coupon.coupon_code,
          },
          textModulesData: [
            {
              header: 'Beneficio',
              body: coupon.discount_description || '20% OFF en consumo',
            },
          ],
        },
      ],
    },
  };

  const encodedPayload = btoa(JSON.stringify(jwtPayload));
  return `https://pay.google.com/gp/v/save/${encodedPayload}`;
}

/**
 * Descarga el archivo de estructura del pase para depuración o empaquetado directo
 */
export function exportApplePassJson(coupon: Coupon): void {
  const payload = generateApplePassPayload(coupon);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pass-${coupon.coupon_code}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
